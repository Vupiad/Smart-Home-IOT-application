import { apiRequest } from "./api.client";

export type RealtimeDataPoint = {
  ts: number;
  time: string;
  temperature: number;
  humidity: number;
};

export type DailyTelemetry = {
  dateLabel: string;
  temperature: number;
  humidity: number;
};

export type FetchResult = {
  data: DailyTelemetry[];
  source: "thingsboard" | "hardcoded" | "api";
  error?: string;
};

const DEFAULT_TOPIC = "yolohome/device/yolo_uno_01/telemetry";

export async function fetchDailyTelemetry(days: number = 7): Promise<FetchResult> {
  try {
    // Fetch last 100 points, hopefully spanning enough time for some variation
    const response = await apiRequest<{ topic: string; count: number; history: any[] }>(
      `/sensors/${DEFAULT_TOPIC}/history?limit=100`
    );

    const history = response.history || [];
    
    if (history.length === 0) {
      return {
        data: [],
        source: "api",
        error: "No data available",
      };
    }

    // Group by date
    const dayMap = new Map<string, { temps: number[]; humids: number[] }>();

    for (const point of history) {
      if (!point.timestamp) continue;
      const date = new Date(point.timestamp);
      const dayKey = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = dayMap.get(dayKey) || { temps: [], humids: [] };
      if (point.temperature !== undefined) existing.temps.push(point.temperature);
      if (point.humidity !== undefined) existing.humids.push(point.humidity);
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

    // Sort by date (naive approach, assume all within same year and not crossing new year for simplicity)
    result.sort((a, b) => {
      const [d1, m1] = a.dateLabel.split("/").map(Number);
      const [d2, m2] = b.dateLabel.split("/").map(Number);
      if (m1 !== m2) return m1 - m2;
      return d1 - d2;
    });

    // If we only have 1 day of data, we might want to fill some previous days with dummy data
    // so the chart looks good, but let's just return what we have for correctness.

    return {
      data: result.slice(-days),
      source: "api",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[Sensor API] Error:", errorMessage);

    return {
      data: [
        { dateLabel: "07/04", temperature: 30, humidity: 67 },
        { dateLabel: "08/04", temperature: 31, humidity: 65 },
        { dateLabel: "09/04", temperature: 29, humidity: 72 },
        { dateLabel: "10/04", temperature: 32, humidity: 68 },
        { dateLabel: "11/04", temperature: 33, humidity: 63 },
        { dateLabel: "12/04", temperature: 31, humidity: 70 },
        { dateLabel: "13/04", temperature: 30, humidity: 69 },
      ],
      source: "hardcoded",
      error: errorMessage,
    };
  }
}

export async function fetchRealtimeTelemetry(
  limit: number = 20,
): Promise<{
  data: RealtimeDataPoint[];
  source: "api" | "hardcoded";
  error?: string;
}> {
  try {
    const response = await apiRequest<{ topic: string; count: number; history: any[] }>(
      `/sensors/${DEFAULT_TOPIC}/history?limit=${limit}`
    );

    const history = response.history || [];

    if (history.length === 0) {
      return {
        data: [],
        source: "api",
        error: "No data available",
      };
    }

    const data: RealtimeDataPoint[] = history.map((p) => {
      const d = new Date(p.timestamp);
      return {
        ts: d.getTime(),
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
        temperature: p.temperature ?? 0,
        humidity: p.humidity ?? 0,
      };
    }).sort((a, b) => a.ts - b.ts);

    return { data, source: "api" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[Sensor API Realtime] Error:", errorMessage);
    
    // Generate some fake fallback data
    const now = Date.now();
    const data = Array.from({ length: limit }, (_, i) => {
      const ts = now - (limit - 1 - i) * 5000;
      const d = new Date(ts);
      return {
        ts,
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
        temperature: +(25 + Math.random() * 10).toFixed(1),
        humidity: +(55 + Math.random() * 30).toFixed(1),
      };
    });

    return {
      data,
      source: "hardcoded",
      error: errorMessage,
    };
  }
}
