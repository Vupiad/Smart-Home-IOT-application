/**
 * ThingsBoard Cloud Telemetry Service
 *
 * Kết nối đến ThingsBoard Cloud để lấy dữ liệu nhiệt độ & độ ẩm.
 * Sử dụng API Key để xác thực (không cần login lấy JWT).
 * Nếu không kết nối được sẽ fallback về dữ liệu hardcode.
 *
 * Thông tin kết nối:
 *   - Host: thingsboard.cloud
 *   - API Key: tb_NGG14H9ObmLDfe2qhOSZWYBkg28lbDa3HeiGQS2R955jTRn7h34jLPzQDvNeniFLVELb_m8KJpx6974DRQuDdw
 *   - Device Access Token: T6L85alHs9qRth0q1qKn
 */

// ────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────
const THINGSBOARD_HTTP_HOST = "https://thingsboard.cloud";
const DEVICE_ACCESS_TOKEN = "T6L85alHs9qRth0q1qKn";

// API Key – dùng để xác thực REST API (thay cho JWT login)
const TB_API_KEY =
  "tb_NGG14H9ObmLDfe2qhOSZWYBkg28lbDa3HeiGQS2R955jTRn7h34jLPzQDvNeniFLVELb_m8KJpx6974DRQuDdw";

// Auth header dùng API Key
const AUTH_HEADER = { "X-Authorization": `ApiKey ${TB_API_KEY}` };

// Device ID (UUID) – "Temperature Sensor" – đã tìm được từ ThingsBoard API
// Nếu để trống, service sẽ tự động tìm device
const TB_DEVICE_ID = "64d57930-374c-11f1-8651-7bd390870707";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
export type TelemetryDataPoint = {
  ts: number; // timestamp milliseconds
  temperature: number;
  humidity: number;
};

export type DailyTelemetry = {
  dateLabel: string; // dd/MM
  temperature: number; // trung bình nhiệt độ trong ngày
  humidity: number; // trung bình độ ẩm trong ngày
};

// ────────────────────────────────────────────────────────────
// Hardcoded fallback data
// ────────────────────────────────────────────────────────────
const HARDCODED_DATA: DailyTelemetry[] = [
  { dateLabel: "07/04", temperature: 30, humidity: 67 },
  { dateLabel: "08/04", temperature: 31, humidity: 65 },
  { dateLabel: "09/04", temperature: 29, humidity: 72 },
  { dateLabel: "10/04", temperature: 32, humidity: 68 },
  { dateLabel: "11/04", temperature: 33, humidity: 63 },
  { dateLabel: "12/04", temperature: 31, humidity: 70 },
  { dateLabel: "13/04", temperature: 30, humidity: 69 },
];

// ────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────

/** Kiểm tra kết nối API Key có hoạt động không */
async function verifyApiKey(): Promise<boolean> {
  try {
    const response = await fetch(
      `${THINGSBOARD_HTTP_HOST}/api/auth/user`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH_HEADER,
        },
      },
    );
    if (response.ok) {
      console.log("[ThingsBoard] API Key xác thực thành công!");
      return true;
    }
    console.warn(
      `[ThingsBoard] API Key xác thực thất bại: ${response.status}`,
    );
    return false;
  } catch (error) {
    console.warn("[ThingsBoard] Lỗi xác thực API Key:", error);
    return false;
  }
}

/** Tìm Device ID tự động bằng cách duyệt danh sách devices */
async function findDeviceId(): Promise<string | null> {
  // Nếu đã cấu hình Device ID, dùng luôn
  if (TB_DEVICE_ID) {
    console.log(`[ThingsBoard] Dùng Device ID đã cấu hình: ${TB_DEVICE_ID}`);
    return TB_DEVICE_ID;
  }

  try {
    // Thử lấy danh sách devices từ tenant
    const response = await fetch(
      `${THINGSBOARD_HTTP_HOST}/api/tenant/devices?pageSize=50&page=0`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH_HEADER,
        },
      },
    );

    if (!response.ok) {
      // Nếu tenant API không khả dụng, thử customer API
      console.log(
        "[ThingsBoard] Tenant API không khả dụng, thử Customer API...",
      );
      return await findDeviceIdViaCustomer();
    }

    const data = await response.json();
    const devices = data.data || [];

    if (devices.length === 0) {
      console.warn("[ThingsBoard] Không tìm thấy device nào");
      return null;
    }

    // Tìm device có credentials match với access token
    for (const device of devices) {
      try {
        const credRes = await fetch(
          `${THINGSBOARD_HTTP_HOST}/api/device/${device.id.id}/credentials`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...AUTH_HEADER,
            },
          },
        );

        if (credRes.ok) {
          const cred = await credRes.json();
          if (cred.credentialsId === DEVICE_ACCESS_TOKEN) {
            console.log(
              `[ThingsBoard] ✓ Tìm thấy device: ${device.name} (${device.id.id})`,
            );
            return device.id.id;
          }
        }
      } catch {
        // Bỏ qua lỗi cho từng device
      }
    }

    // Nếu không match credentials, dùng device đầu tiên
    console.log(
      `[ThingsBoard] Dùng device đầu tiên: ${devices[0].name} (${devices[0].id.id})`,
    );
    return devices[0].id.id;
  } catch (error) {
    console.warn("[ThingsBoard] Lỗi tìm device:", error);
    return null;
  }
}

/** Tìm Device ID qua Customer API (dùng khi không có quyền tenant) */
async function findDeviceIdViaCustomer(): Promise<string | null> {
  try {
    // Lấy thông tin user hiện tại để biết customerId
    const userRes = await fetch(
      `${THINGSBOARD_HTTP_HOST}/api/auth/user`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH_HEADER,
        },
      },
    );

    if (!userRes.ok) return null;

    const user = await userRes.json();
    const customerId = user.customerId?.id;

    if (!customerId) {
      // Nếu là tenant admin, thử lấy trực tiếp
      console.log("[ThingsBoard] User là Tenant Admin");
      return null;
    }

    // Lấy devices của customer
    const devRes = await fetch(
      `${THINGSBOARD_HTTP_HOST}/api/customer/${customerId}/devices?pageSize=50&page=0`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH_HEADER,
        },
      },
    );

    if (!devRes.ok) return null;

    const data = await devRes.json();
    const devices = data.data || [];

    if (devices.length > 0) {
      console.log(
        `[ThingsBoard] ✓ Tìm thấy device qua Customer: ${devices[0].name} (${devices[0].id.id})`,
      );
      return devices[0].id.id;
    }

    return null;
  } catch (error) {
    console.warn("[ThingsBoard] Lỗi Customer API:", error);
    return null;
  }
}

/** Lấy telemetry data từ ThingsBoard REST API */
async function fetchTelemetryFromAPI(
  deviceId: string,
  days: number = 7,
): Promise<TelemetryDataPoint[]> {
  const now = Date.now();
  const startTs = now - days * 24 * 60 * 60 * 1000;

  const url =
    `${THINGSBOARD_HTTP_HOST}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries` +
    `?keys=temperature,humidity` +
    `&startTs=${startTs}` +
    `&endTs=${now}` +
    `&limit=10000` +
    `&agg=NONE`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Telemetry fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const raw = await response.json();

  // ThingsBoard trả về dạng:
  // { temperature: [{ts, value}, ...], humidity: [{ts, value}, ...] }
  const tempPoints: { ts: number; value: string }[] = raw.temperature || [];
  const humidPoints: { ts: number; value: string }[] = raw.humidity || [];

  // Tạo map timestamp -> values
  const tsMap = new Map<
    number,
    { temperature?: number; humidity?: number }
  >();

  for (const point of tempPoints) {
    const existing = tsMap.get(point.ts) || {};
    existing.temperature = parseFloat(point.value);
    tsMap.set(point.ts, existing);
  }

  for (const point of humidPoints) {
    const existing = tsMap.get(point.ts) || {};
    existing.humidity = parseFloat(point.value);
    tsMap.set(point.ts, existing);
  }

  // Chuyển map thành array và sắp xếp theo thời gian
  const result: TelemetryDataPoint[] = [];
  for (const [ts, values] of tsMap.entries()) {
    result.push({
      ts,
      temperature: values.temperature ?? 0,
      humidity: values.humidity ?? 0,
    });
  }

  result.sort((a, b) => a.ts - b.ts);
  return result;
}

/** Nhóm data points theo ngày, tính trung bình */
function groupByDay(dataPoints: TelemetryDataPoint[]): DailyTelemetry[] {
  const dayMap = new Map<
    string,
    { temps: number[]; humids: number[] }
  >();

  for (const point of dataPoints) {
    const date = new Date(point.ts);
    const dayKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

    const existing = dayMap.get(dayKey) || { temps: [], humids: [] };
    if (point.temperature > 0) existing.temps.push(point.temperature);
    if (point.humidity > 0) existing.humids.push(point.humidity);
    dayMap.set(dayKey, existing);
  }

  const result: DailyTelemetry[] = [];
  for (const [dateLabel, values] of dayMap.entries()) {
    const avgTemp =
      values.temps.length > 0
        ? values.temps.reduce((sum, v) => sum + v, 0) / values.temps.length
        : 0;
    const avgHumid =
      values.humids.length > 0
        ? values.humids.reduce((sum, v) => sum + v, 0) / values.humids.length
        : 0;

    result.push({
      dateLabel,
      temperature: Math.round(avgTemp * 100) / 100,
      humidity: Math.round(avgHumid * 100) / 100,
    });
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

export type FetchResult = {
  data: DailyTelemetry[];
  source: "thingsboard" | "hardcoded";
  error?: string;
};

/**
 * Lấy dữ liệu nhiệt độ & độ ẩm theo ngày từ ThingsBoard Cloud.
 * Sử dụng API Key để xác thực.
 * Nếu không kết nối được, sẽ trả về dữ liệu hardcoded.
 *
 * @param days Số ngày cần lấy dữ liệu (mặc định 7)
 * @returns DailyTelemetry[] và thông tin nguồn dữ liệu
 */
export async function fetchDailyTelemetry(
  days: number = 7,
): Promise<FetchResult> {
  try {
    console.log("[ThingsBoard] Đang kết nối ThingsBoard Cloud (API Key)...");

    // Step 1: Kiểm tra API Key
    const isValid = await verifyApiKey();
    if (!isValid) {
      console.log(
        "[ThingsBoard] API Key không hợp lệ → dùng dữ liệu hardcoded",
      );
      return {
        data: HARDCODED_DATA,
        source: "hardcoded",
        error: "API Key không hợp lệ hoặc hết hạn",
      };
    }

    // Step 2: Tìm Device ID
    const deviceId = await findDeviceId();
    if (!deviceId) {
      console.log(
        "[ThingsBoard] Không tìm được Device → dùng dữ liệu hardcoded",
      );
      return {
        data: HARDCODED_DATA,
        source: "hardcoded",
        error: "Không tìm được Device trên ThingsBoard",
      };
    }

    console.log(`[ThingsBoard] Device ID: ${deviceId}`);

    // Step 3: Lấy telemetry data
    const rawData = await fetchTelemetryFromAPI(deviceId, days);

    if (rawData.length === 0) {
      console.log(
        "[ThingsBoard] Không có dữ liệu telemetry → dùng dữ liệu hardcoded",
      );
      return {
        data: HARDCODED_DATA,
        source: "hardcoded",
        error: "ThingsBoard không có dữ liệu telemetry",
      };
    }

    // Step 4: Nhóm theo ngày & tính trung bình
    const dailyData = groupByDay(rawData);

    console.log(
      `[ThingsBoard] ✓ Đã lấy được ${dailyData.length} ngày dữ liệu từ ${rawData.length} data points`,
    );

    return {
      data: dailyData,
      source: "thingsboard",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.warn("[ThingsBoard] Lỗi:", errorMessage);

    return {
      data: HARDCODED_DATA,
      source: "hardcoded",
      error: errorMessage,
    };
  }
}

/**
 * Lấy giá trị mới nhất (latest) của nhiệt độ & độ ẩm từ ThingsBoard.
 * Sử dụng API Key.
 */
export async function fetchLatestTelemetry(): Promise<{
  temperature: number | null;
  humidity: number | null;
  source: "thingsboard" | "hardcoded";
}> {
  try {
    // Tìm device ID trước
    const deviceId = await findDeviceId();
    if (!deviceId) {
      return { temperature: null, humidity: null, source: "hardcoded" };
    }

    // Lấy latest telemetry qua REST API
    const url = `${THINGSBOARD_HTTP_HOST}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADER,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const temp = data.temperature?.[0]?.value;
      const humid = data.humidity?.[0]?.value;
      return {
        temperature: temp ? parseFloat(temp) : null,
        humidity: humid ? parseFloat(humid) : null,
        source: "thingsboard",
      };
    }
  } catch (error) {
    console.warn("[ThingsBoard] Latest telemetry error:", error);
  }

  return {
    temperature: null,
    humidity: null,
    source: "hardcoded",
  };
}

// ────────────────────────────────────────────────────────────
// Real-time Telemetry (cho biểu đồ real-time)
// ────────────────────────────────────────────────────────────

export type RealtimeDataPoint = {
  ts: number;
  time: string; // HH:mm:ss
  temperature: number;
  humidity: number;
};

/** Sinh dữ liệu hardcoded giả lập real-time */
function generateHardcodedRealtime(count: number = 20): RealtimeDataPoint[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const ts = now - (count - 1 - i) * 5000;
    const d = new Date(ts);
    return {
      ts,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
      temperature: +(25 + Math.random() * 10).toFixed(1),
      humidity: +(55 + Math.random() * 30).toFixed(1),
    };
  });
}

/**
 * Lấy N data points gần nhất từ ThingsBoard (real-time).
 * Dùng cho biểu đồ real-time, cập nhật mỗi 5 giây.
 *
 * @param limit Số data points cần lấy (mặc định 20)
 */
export async function fetchRealtimeTelemetry(
  limit: number = 20,
): Promise<{
  data: RealtimeDataPoint[];
  source: "thingsboard" | "hardcoded";
  error?: string;
}> {
  try {
    const deviceId = TB_DEVICE_ID || (await findDeviceId());
    if (!deviceId) {
      return {
        data: generateHardcodedRealtime(limit),
        source: "hardcoded",
        error: "Device not found",
      };
    }

    const now = Date.now();
    const startTs = now - 10 * 60 * 1000; // 10 phút gần nhất

    const url =
      `${THINGSBOARD_HTTP_HOST}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries` +
      `?keys=temperature,humidity` +
      `&startTs=${startTs}` +
      `&endTs=${now}` +
      `&limit=${limit}` +
      `&agg=NONE`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADER,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();
    const tempPoints: { ts: number; value: string }[] =
      raw.temperature || [];
    const humidPoints: { ts: number; value: string }[] =
      raw.humidity || [];

    // Merge theo timestamp
    const tsMap = new Map<
      number,
      { temperature?: number; humidity?: number }
    >();
    for (const p of tempPoints) {
      const existing = tsMap.get(p.ts) || {};
      existing.temperature = parseFloat(p.value);
      tsMap.set(p.ts, existing);
    }
    for (const p of humidPoints) {
      const existing = tsMap.get(p.ts) || {};
      existing.humidity = parseFloat(p.value);
      tsMap.set(p.ts, existing);
    }

    // Sort theo thời gian tăng dần
    const sorted = [...tsMap.entries()].sort((a, b) => a[0] - b[0]);
    const data: RealtimeDataPoint[] = sorted.map(([ts, vals]) => {
      const d = new Date(ts);
      return {
        ts,
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
        temperature: vals.temperature ?? 0,
        humidity: vals.humidity ?? 0,
      };
    });

    if (data.length === 0) {
      return {
        data: generateHardcodedRealtime(limit),
        source: "hardcoded",
        error: "No telemetry data",
      };
    }

    return { data, source: "thingsboard" };
  } catch (error) {
    return {
      data: generateHardcodedRealtime(limit),
      source: "hardcoded",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
