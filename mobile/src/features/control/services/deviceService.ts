import {
  ACDeviceDetail,
  ACDeviceUpdatePayload,
  DeviceDetail,
  DeviceSummary,
  DoorDeviceDetail,
  FanDeviceDetail,
  FanDeviceUpdatePayload,
  LightDeviceDetail,
  LightDeviceUpdatePayload,
  ToggleDevicePowerPayload,
} from "../types";
import { getStoredToken } from "../../../shared/storage/tokenStorage";

// Helper to get auth headers with JWT token
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function apiBase(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

export function parseBackedDeviceId(id: string): number | null {
  if (!/^\d+$/.test(String(id))) return null;
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

/** lamp / pendant / bulb → light cho filter & UI control */
export function normalizeDeviceType(raw: string): DeviceSummary["type"] {
  const t = String(raw ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  if (t === "fan") return "fan";
  if (t === "ac" || t === "air_conditioner") return "ac";
  if (t === "door") return "door";
  if (
    t === "light" ||
    t === "lamp" ||
    t === "pendant" ||
    t === "bulb" ||
    t === "light_bulb"
  ) {
    return "light";
  }
  return "light";
}

function inferDeviceIcon(rawType: string, name: string, stateStyle?: unknown): string {
  const type = String(rawType ?? "").toLowerCase().replace(/-/g, "_");
  const lowerName = String(name ?? "").toLowerCase();

  if (type === "fan") {
    return "fan";
  }

  if (type === "ac" || type === "air_conditioner") {
    return "air-conditioner";
  }

  if (type === "door") {
    return "door-closed-outline";
  }

  if (stateStyle === "lamp" || type === "lamp" || lowerName.includes("lamp")) {
    return "lamp-outline";
  }

  if (stateStyle === "pendant" || type === "pendant") {
    return "bulb-outline";
  }

  return "bulb-outline";
}

function rgbObjToHex(
  c: { r?: number; g?: number; b?: number } | undefined,
  fallback = "#FFFFFF",
): string {
  if (!c) return fallback;
  const r = Math.round(Math.min(255, Math.max(0, Number(c.r ?? 255))));
  const g = Math.round(Math.min(255, Math.max(0, Number(c.g ?? 255))));
  const b = Math.round(Math.min(255, Math.max(0, Number(c.b ?? 255))));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h;
  const n = parseInt(full || "0", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyBrightnessToRgb(
  hex: string,
  brightness: number,
): { r: number; g: number; b: number } {
  const { r, g, b } = hexToRgb(hex);
  const f = Math.max(0, Math.min(100, brightness)) / 100;
  return { r: Math.round(r * f), g: Math.round(g * f), b: Math.round(b * f) };
}

function speedToLevel(speed: number | undefined): 1 | 2 | 3 {
  const s = speed ?? 0;
  if (s <= 34) return 1;
  if (s <= 67) return 2;
  return 3;
}

export function levelToSpeed(level: number): number {
  if (level <= 1) return 33;
  if (level === 2) return 66;
  return 100;
}

function inferLightStyle(
  deviceTypeRaw: string,
  stateStyle: unknown,
): "bulb" | "pendant" | "lamp" | undefined {
  if (
    stateStyle === "bulb" ||
    stateStyle === "pendant" ||
    stateStyle === "lamp"
  ) {
    return stateStyle;
  }
  const t = String(deviceTypeRaw || "").toLowerCase();
  if (t === "pendant") return "pendant";
  if (t === "lamp") return "lamp";
  if (t === "light_bulb" || t === "bulb") return "bulb";
  return undefined;
}

export function backendRowToDetail(row: any): DeviceDetail {
  const s = row.state ?? {};
  const id = String(row.id);
  const name = row.name ?? "Device";
  const deviceTypeRaw = row.device_type ?? "light";
  const kind = normalizeDeviceType(deviceTypeRaw);
  const statusStr = typeof s.status === "string" ? s.status : "";
  const isOn =
    s.isOn === true || statusStr === "on" || statusStr === "unlocked";
  const online = row.is_online !== false;

  if (kind === "fan") {
    const speed = typeof s.speed === "number" ? s.speed : isOn ? 100 : 0;
    return {
      id,
      name,
      type: "fan",
      isOn,
      online,
      level: speedToLevel(speed),
      timerMinutes: typeof s.timerMinutes === "number" ? s.timerMinutes : 0,
    };
  }

  if (kind === "door") {
    const unlocked = statusStr === "unlocked";
    const d: DoorDeviceDetail = {
      id,
      name,
      type: "door",
      isOn: unlocked,
      online,
      lockStatus: unlocked ? "unlocked" : "locked",
      timerMinutes: typeof s.timerMinutes === "number" ? s.timerMinutes : 0,
    };
    return d;
  }

  if (kind === "ac") {
    return {
      id,
      name,
      type: "ac",
      isOn,
      online,
      mode: (s.mode as ACDeviceDetail["mode"]) || "cool",
      temperature: typeof s.temperature === "number" ? s.temperature : 24,
      fanSpeed: (typeof s.fanSpeed === "number" ? s.fanSpeed : 1) as 1 | 2 | 3,
      timerMinutes: typeof s.timerMinutes === "number" ? s.timerMinutes : 0,
      humidity: typeof s.humidity === "number" ? s.humidity : 50,
    };
  }

  const brightness =
    typeof s.brightness === "number"
      ? Math.min(100, Math.max(0, s.brightness))
      : isOn
        ? 80
        : 40;
  const colorHex = rgbObjToHex(s.color, "#FFFFFF");
  const style = inferLightStyle(deviceTypeRaw, s.style);
  const light: LightDeviceDetail = {
    id,
    name,
    type: "light",
    isOn,
    online,
    brightness,
    colorHex,
    timerMinutes: typeof s.timerMinutes === "number" ? s.timerMinutes : 0,
    style,
  };
  return light;
}

async function putDeviceControlState(
  numId: number,
  state: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/device-control/${numId}/state`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ state }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Control failed (${res.status})`);
  }
}

async function putDeviceMergedState(
  numId: number,
  partial: Record<string, unknown>,
): Promise<void> {
  const getRes = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    headers: await getAuthHeaders(),
  });
  if (!getRes.ok) throw new Error("Could not load device to update");
  const row = await getRes.json();
  const nextState = { ...(row.state || {}), ...partial };
  const putRes = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ state: nextState }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => null);
    throw new Error(err?.detail || "Update failed");
  }
}

const mockDevices: DeviceSummary[] = [
  {
    id: "device-fan-kitchen",
    name: "Fan",
    type: "fan",
    isOn: true,
    room: "Kitchen",
    subtitle: "Speed 2",
  },
  {
    id: "device-fan-living-room",
    name: "Fan",
    type: "fan",
    isOn: true,
    room: "Living room",
    subtitle: "Speed 3",
  },
  {
    id: "device-ac-living-room",
    name: "Air Conditioner",
    type: "ac",
    isOn: true,
    room: "Living room",
    subtitle: "24 degree",
  },
  {
    id: "device-light-kitchen",
    name: "Light",
    type: "light",
    isOn: true,
    room: "Kitchen",
    subtitle: "Warm White",
  },
  {
    id: "device-light-living-room",
    name: "Pendant",
    type: "light",
    isOn: true,
    room: "Living room",
    subtitle: "Soft White",
  },
  {
    id: "device-light-bedroom",
    name: "Lamp",
    type: "light",
    isOn: false,
    room: "Bedroom",
    subtitle: "Dim 10%",
  },
];

const mockDetails: Record<string, DeviceDetail> = {
  "device-fan-kitchen": {
    id: "device-fan-kitchen",
    name: "Fan",
    type: "fan",
    isOn: true,
    online: true,
    level: 1,
    timerMinutes: 10,
  },
  "device-fan-living-room": {
    id: "device-fan-living-room",
    name: "Fan",
    type: "fan",
    isOn: true,
    online: true,
    level: 2,
    timerMinutes: 5,
  },
  "device-ac-living-room": {
    id: "device-ac-living-room",
    name: "Air Conditioner",
    type: "ac",
    isOn: true,
    online: true,
    mode: "cool",
    temperature: 24,
    fanSpeed: 1,
    timerMinutes: 10,
    humidity: 62,
  },
  "device-light-kitchen": {
    id: "device-light-kitchen",
    name: "Light",
    type: "light",
    isOn: true,
    online: true,
    brightness: 47,
    colorHex: "#2D5BFF",
    timerMinutes: 90,
    style: "bulb",
  },
  "device-light-living-room": {
    id: "device-light-living-room",
    name: "Pendant",
    type: "light",
    isOn: true,
    online: true,
    brightness: 62,
    colorHex: "#FFFFFF",
    timerMinutes: 120,
    style: "pendant",
  },
  "device-light-bedroom": {
    id: "device-light-bedroom",
    name: "Lamp",
    type: "light",
    isOn: false,
    online: true,
    brightness: 20,
    colorHex: "#F6C126",
    timerMinutes: 45,
  },
};

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function updateSummary(deviceId: string, nextValue: Partial<DeviceSummary>) {
  const index = mockDevices.findIndex((item) => item.id === deviceId);
  if (index !== -1) {
    mockDevices[index] = {
      ...mockDevices[index],
      ...nextValue,
    };
  }
}

function updateDetail<T extends DeviceDetail>(
  deviceId: string,
  nextValue: Partial<T>,
) {
  const detail = mockDetails[deviceId] as T | undefined;
  if (!detail) {
    throw new Error("Device not found");
  }

  mockDetails[deviceId] = {
    ...detail,
    ...nextValue,
  } as DeviceDetail;
}

function syncSummaryPower(deviceId: string, isOn: boolean) {
  updateSummary(deviceId, { isOn });
}

function assertDeviceType<T extends DeviceDetail["type"]>(
  detail: DeviceDetail | undefined,
  type: T,
): Extract<DeviceDetail, { type: T }> {
  if (!detail || detail.type !== type) {
    throw new Error(`${type.toUpperCase()} device not found`);
  }

  return detail as Extract<DeviceDetail, { type: T }>;
}

export async function getDevices(): Promise<DeviceSummary[]> {
  try {
    // Lấy IP từ file .env, nếu không có thì lấy mặc định IP Wi-Fi hiện tại của máy tính
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const API_URL = `${BASE_URL}/api/v1/devices/`;
    console.log("Calling API:", API_URL);

    const response = await fetch(API_URL, {
      method: "GET",
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Map BE → FE: backend dùng state.status ('on'/'off'), không có isOn
    return data.map((device: any) => {
      const s = device.state ?? {};
      const isOn = s.isOn === true || s.status === "on" || s.power === "on";
      return {
        id: device.id.toString(),
        name: device.name,
        type: normalizeDeviceType(device.device_type),
        isOn,
        room: s.room || "Khách",
        subtitle: s.subtitle || "",
        icon: inferDeviceIcon(device.device_type, device.name, s.style),
      };
    });
  } catch (error: any) {
    console.error("Failed to fetch devices from BE:", error?.message || error);
    // Nếu lỗi (ví dụ chưa bật BE), tạm thời trả về mockData cũ để app không bị crash
    return copy(mockDevices);
  }
}

export async function getDeviceDetail(deviceId: string): Promise<DeviceDetail> {
  const numId = parseBackedDeviceId(deviceId);
  if (numId === null) {
    await wait(180);
    const detail = mockDetails[deviceId];
    if (!detail) {
      throw new Error("Device not found");
    }
    return copy(detail);
  }

  const res = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load device (${res.status})`);
  }
  return backendRowToDetail(await res.json());
}

export async function toggleDevicePower(
  detail: DeviceDetail,
  payload: ToggleDevicePowerPayload | boolean,
): Promise<void> {
  const isOn = typeof payload === "boolean" ? payload : payload.isOn;
  const numId = parseBackedDeviceId(detail.id);

  if (numId === null) {
    await wait(120);
    const md = mockDetails[detail.id];
    if (!md) throw new Error("Device not found");
    updateDetail(detail.id, { isOn } as Partial<DeviceDetail>);
    syncSummaryPower(detail.id, isOn);
    return;
  }

  if (detail.type === "light") {
    const d = detail as LightDeviceDetail;
    const color = applyBrightnessToRgb(d.colorHex, d.brightness);
    await putDeviceControlState(numId, {
      status: isOn ? "on" : "off",
      brightness: d.brightness,
      ...(isOn ? { color } : {}),
    });
    return;
  }

  if (detail.type === "fan") {
    const d = detail as FanDeviceDetail;
    await putDeviceControlState(numId, {
      status: isOn ? "on" : "off",
      ...(isOn ? { speed: levelToSpeed(d.level) } : {}),
    });
    return;
  }

  if (detail.type === "door") {
    await putDeviceControlState(numId, {
      status: isOn ? "unlocked" : "locked",
    });
    return;
  }

  if (detail.type === "ac") {
    await putDeviceControlState(numId, { status: isOn ? "on" : "off" });
  }
}

export async function setFanLevel(
  detail: FanDeviceDetail,
  payload: FanDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  const level = typeof payload === "number" ? payload : payload.level;
  if (!level) throw new Error("Fan level is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "fan");
    updateDetail(detail.id, { level } as Partial<FanDeviceDetail>);
    return;
  }

  await putDeviceControlState(numId, {
    status: detail.isOn ? "on" : "off",
    ...(detail.isOn ? { speed: levelToSpeed(level) } : {}),
  });
}

export async function setFanTimer(
  detail: FanDeviceDetail,
  payload: FanDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes =
    typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined)
    throw new Error("Fan timerMinutes is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "fan");
    updateDetail(detail.id, {
      timerMinutes: Math.max(0, timerMinutes),
    } as Partial<FanDeviceDetail>);
    return;
  }

  await putDeviceMergedState(numId, {
    timerMinutes: Math.max(0, timerMinutes),
  });
}

export async function setACTemperature(
  detail: ACDeviceDetail,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  const temperature =
    typeof payload === "number" ? payload : payload.temperature;
  if (temperature === undefined) throw new Error("AC temperature is required");
  const safe = Math.min(30, Math.max(16, temperature));

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "ac");
    updateDetail(detail.id, { temperature: safe } as Partial<ACDeviceDetail>);
    return;
  }

  await putDeviceControlState(numId, { temperature: safe });
}

export async function setACMode(
  detail: ACDeviceDetail,
  payload: ACDeviceUpdatePayload | ACDeviceDetail["mode"],
): Promise<void> {
  const mode = typeof payload === "string" ? payload : payload.mode;
  if (!mode) throw new Error("AC mode is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "ac");
    updateDetail(detail.id, { mode } as Partial<ACDeviceDetail>);
    return;
  }

  await putDeviceControlState(numId, { mode });
}

export async function setACFanSpeed(
  detail: ACDeviceDetail,
  payload: ACDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  const fanSpeed = typeof payload === "number" ? payload : payload.fanSpeed;
  if (!fanSpeed) throw new Error("AC fanSpeed is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "ac");
    updateDetail(detail.id, { fanSpeed } as Partial<ACDeviceDetail>);
    return;
  }

  await putDeviceControlState(numId, { fanSpeed });
}

export async function setACTimer(
  detail: ACDeviceDetail,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes =
    typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined)
    throw new Error("AC timerMinutes is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "ac");
    updateDetail(detail.id, {
      timerMinutes: Math.max(0, timerMinutes),
    } as Partial<ACDeviceDetail>);
    return;
  }

  await putDeviceMergedState(numId, {
    timerMinutes: Math.max(0, timerMinutes),
  });
}

export async function setLightBrightness(
  detail: LightDeviceDetail,
  payload: LightDeviceUpdatePayload | number,
): Promise<void> {
  const brightness = typeof payload === "number" ? payload : payload.brightness;
  if (brightness === undefined) throw new Error("Light brightness is required");
  const safe = Math.min(100, Math.max(0, brightness));

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "light");
    updateDetail(detail.id, { brightness: safe } as Partial<LightDeviceDetail>);
    return;
  }

  if (detail.isOn) {
    const color = applyBrightnessToRgb(detail.colorHex, safe);
    await putDeviceControlState(numId, {
      status: "on",
      color,
      brightness: safe,
    });
    return;
  }
  await putDeviceMergedState(numId, { brightness: safe });
}

export async function setLightColor(
  detail: LightDeviceDetail,
  payload: LightDeviceUpdatePayload | string,
): Promise<void> {
  const colorHex = typeof payload === "string" ? payload : payload.colorHex;
  if (!colorHex) throw new Error("Light colorHex is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "light");
    updateDetail(detail.id, { colorHex } as Partial<LightDeviceDetail>);
    return;
  }

  if (detail.isOn) {
    const color = applyBrightnessToRgb(colorHex, detail.brightness);
    await putDeviceControlState(numId, { status: "on", color });
    return;
  }
  const rgb = hexToRgb(colorHex);
  await putDeviceMergedState(numId, { color: rgb });
}

export async function setLightTimer(
  detail: LightDeviceDetail,
  payload: LightDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes =
    typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined)
    throw new Error("Light timerMinutes is required");

  const numId = parseBackedDeviceId(detail.id);
  if (numId === null) {
    await wait(120);
    assertDeviceType(mockDetails[detail.id], "light");
    updateDetail(detail.id, {
      timerMinutes: Math.max(0, timerMinutes),
    } as Partial<LightDeviceDetail>);
    return;
  }

  await putDeviceMergedState(numId, {
    timerMinutes: Math.max(0, timerMinutes),
  });
}

export async function addDevice(payload: {
  name: string;
  type: string;
  room: string;
  base_topic: string;
  lightStyle?: string;
}): Promise<void> {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  const API_URL = `${BASE_URL}/api/v1/devices/`;

  const state: Record<string, unknown> = {
    room: payload.room,
    subtitle: "New device",
    status: "off",
  };

  if (
    (payload.type === "light" ||
      payload.type === "lamp" ||
      payload.type === "pendant") &&
    payload.lightStyle
  ) {
    state.style = payload.lightStyle;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    // Use JWT token for authentication
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      name: payload.name,
      device_type: payload.type,
      base_topic: payload.base_topic,
      state: state,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "Failed to add device");
  }
}

export async function updateDeviceInfo(
  deviceId: string,
  payload: { name?: string; room?: string; subtitle?: string },
): Promise<void> {
  const numId = parseBackedDeviceId(deviceId);
  if (numId === null) {
    throw new Error("Invalid device ID");
  }

  const getRes = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    headers: await getAuthHeaders(),
  });
  if (!getRes.ok) {
    throw new Error("Could not load device");
  }

  const row = await getRes.json();
  const nextState = {
    ...(row.state || {}),
  } as Record<string, unknown>;

  if (payload.room !== undefined) nextState.room = payload.room;
  if (payload.subtitle !== undefined) nextState.subtitle = payload.subtitle;

  const putRes = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      name: payload.name !== undefined ? payload.name : row.name,
      state: nextState,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => null);
    throw new Error(err?.detail || "Failed to update device");
  }
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const numId = parseBackedDeviceId(deviceId);
  if (numId === null) {
    throw new Error("Invalid device ID");
  }

  const response = await fetch(`${apiBase()}/api/v1/devices/${numId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "Failed to delete device");
  }
}
