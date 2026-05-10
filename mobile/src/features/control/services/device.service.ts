import {
  ACDeviceDetail,
  ACDeviceUpdatePayload,
  DeviceDetail,
  DeviceSummary,
  DeviceSummaryType,
  DeviceType,
  FanDeviceUpdatePayload,
  LightDeviceUpdatePayload,
  ToggleDevicePowerPayload,
} from "../types";
import { apiRequest } from "../../../shared/services/api.client";

type ApiDevice = {
  id: number;
  owner_id: number;
  name: string;
  device_type: string;
  base_topic: string;
  state: Record<string, unknown>;
  last_online?: string | null;
};

type DeviceControlResponse = {
  success: boolean;
  message: string;
  device_id: number;
  device_state: Record<string, unknown>;
};

function parseDeviceId(deviceId: string): number {
  const parsed = Number(deviceId);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid device id: ${deviceId}`);
  }
  return parsed;
}

function normalizeType(type: string): DeviceSummaryType {
  const value = type.trim().toLowerCase();
  if (value === "fan" || value === "ac" || value === "light" || value === "door") {
    return value;
  }
  return "light";
}

function toIcon(type: DeviceSummaryType): string {
  if (type === "fan") {
    return "aperture-outline";
  }
  if (type === "ac") {
    return "snow-outline";
  }
  if (type === "door") {
    return "lock-closed-outline";
  }
  return "bulb-outline";
}

function toRoom(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) {
    return "Main";
  }
  return words.slice(0, -1).join(" ");
}

function toBoolStatus(value: unknown): boolean {
  return String(value ?? "").toLowerCase() === "on";
}

function toRgbHex(color: unknown): string {
  if (!color || typeof color !== "object") {
    return "#FFFFFF";
  }
  const map = color as { r?: unknown; g?: unknown; b?: unknown };
  const r = Number(map.r ?? 255);
  const g = Number(map.g ?? 255);
  const b = Number(map.b ?? 255);

  if (![r, g, b].every((item) => Number.isFinite(item))) {
    return "#FFFFFF";
  }

  const toHex = (channel: number) =>
    Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(colorHex: string): { r: number; g: number; b: number } {
  const normalized = colorHex.trim().replace(/^#/, "");
  const hex = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function fanLevelFromSpeed(speed: unknown): 1 | 2 | 3 {
  const value = Number(speed);
  if (!Number.isFinite(value)) {
    return 1;
  }
  if (value >= 70) {
    return 3;
  }
  if (value >= 35) {
    return 2;
  }
  return 1;
}

function speedFromLevel(level: 1 | 2 | 3): number {
  if (level === 1) {
    return 30;
  }
  if (level === 2) {
    return 60;
  }
  return 100;
}

function subtitleFromState(type: DeviceSummaryType, state: Record<string, unknown>): string {
  if (type === "fan") {
    const speed = Number(state.speed ?? 0);
    return speed > 0 ? `Speed ${fanLevelFromSpeed(speed)}` : "Off";
  }
  if (type === "ac") {
    const temp = Number(state.temp ?? 24);
    return `${Number.isFinite(temp) ? temp : 24} degree`;
  }
  if (type === "door") {
    const status = String(state.status ?? "locked");
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  if (toBoolStatus(state.status)) {
    const brightness = Number(state.brightness ?? 100);
    return `${Math.max(0, Math.min(100, Number.isFinite(brightness) ? brightness : 100))}%`;
  }
  return "Off";
}

function toSummary(device: ApiDevice): DeviceSummary {
  const type = normalizeType(device.device_type);
  const state = device.state ?? {};
  const isOn =
    type === "door"
      ? String(state.status ?? "").toLowerCase() === "locked"
      : toBoolStatus(state.status);

  return {
    id: String(device.id),
    name: device.name,
    type,
    isOn,
    room: toRoom(device.name),
    icon: toIcon(type),
    subtitle: subtitleFromState(type, state),
  };
}

function toDeviceDetail(device: ApiDevice): DeviceDetail {
  const state = device.state ?? {};
  const type = normalizeType(device.device_type);
  if (type === "fan") {
    return {
      id: String(device.id),
      name: device.name,
      type: "fan",
      isOn: toBoolStatus(state.status),
      online: true,
      level: fanLevelFromSpeed(state.speed),
      timerMinutes: Number(state.timerMinutes ?? 0) || 0,
    };
  }

  if (type === "ac") {
    const rawMode = String(state.mode ?? "cool").toLowerCase();
    const mode: ACDeviceDetail["mode"] =
      rawMode === "auto" ? "auto" : rawMode === "hot" ? "hot" : "cool";

    return {
      id: String(device.id),
      name: device.name,
      type: "ac",
      isOn: toBoolStatus(state.status),
      online: true,
      mode,
      temperature: Math.max(16, Math.min(30, Number(state.temp ?? 24) || 24)),
      fanSpeed: [1, 2, 3].includes(Number(state.fanSpeed))
        ? (Number(state.fanSpeed) as 1 | 2 | 3)
        : 1,
      timerMinutes: Number(state.timerMinutes ?? 0) || 0,
      humidity: Number(state.humidity ?? 60) || 60,
    };
  }

  return {
    id: String(device.id),
    name: device.name,
    type: "light",
    isOn: toBoolStatus(state.status),
    online: true,
    brightness: Math.max(0, Math.min(100, Number(state.brightness ?? 100) || 100)),
    colorHex: toRgbHex(state.color),
    timerMinutes: Number(state.timerMinutes ?? 0) || 0,
  };
}

async function updateDeviceState(
  deviceId: string,
  state: Record<string, unknown>,
): Promise<DeviceControlResponse> {
  return apiRequest<DeviceControlResponse>(`/device-control/${parseDeviceId(deviceId)}/state`, {
    method: "PUT",
    body: { state },
  });
}

export async function getDevices(): Promise<DeviceSummary[]> {
  const devices = await apiRequest<ApiDevice[]>("/devices");
  return devices.map(toSummary);
}

export async function getDeviceDetail(deviceId: string): Promise<DeviceDetail> {
  const device = await apiRequest<ApiDevice>(`/devices/${parseDeviceId(deviceId)}`);
  const type = normalizeType(device.device_type);
  if (type === "door") {
    throw new Error("Door detail screen is not implemented yet.");
  }
  return toDeviceDetail(device);
}

export async function toggleDevicePower(
  deviceId: string,
  payload: ToggleDevicePowerPayload | boolean,
): Promise<void> {
  const isOn = typeof payload === "boolean" ? payload : payload.isOn;
  await updateDeviceState(deviceId, { status: isOn ? "on" : "off" });
}

export async function setFanLevel(
  deviceId: string,
  payload: FanDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  const level = typeof payload === "number" ? payload : payload.level;
  if (!level) {
    throw new Error("Fan level is required");
  }
  await updateDeviceState(deviceId, { status: "on", speed: speedFromLevel(level) });
}

export async function setFanTimer(
  deviceId: string,
  payload: FanDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes = typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined) {
    throw new Error("Fan timerMinutes is required");
  }
  await updateDeviceState(deviceId, { timerMinutes: Math.max(0, timerMinutes) });
}

export async function setACTemperature(
  deviceId: string,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  const temperature = typeof payload === "number" ? payload : payload.temperature;
  if (temperature === undefined) {
    throw new Error("AC temperature is required");
  }
  await updateDeviceState(deviceId, {
    status: "on",
    temp: Math.max(16, Math.min(30, temperature)),
  });
}

export async function setACMode(
  deviceId: string,
  payload: ACDeviceUpdatePayload | ACDeviceDetail["mode"],
): Promise<void> {
  const mode = typeof payload === "string" ? payload : payload.mode;
  if (!mode) {
    throw new Error("AC mode is required");
  }
  await updateDeviceState(deviceId, { status: "on", mode });
}

export async function setACFanSpeed(
  deviceId: string,
  payload: ACDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  const fanSpeed = typeof payload === "number" ? payload : payload.fanSpeed;
  if (!fanSpeed) {
    throw new Error("AC fanSpeed is required");
  }
  await updateDeviceState(deviceId, { status: "on", fanSpeed });
}

export async function setACTimer(
  deviceId: string,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes = typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined) {
    throw new Error("AC timerMinutes is required");
  }
  await updateDeviceState(deviceId, { timerMinutes: Math.max(0, timerMinutes) });
}

export async function setLightBrightness(
  deviceId: string,
  payload: LightDeviceUpdatePayload | number,
): Promise<void> {
  const brightness = typeof payload === "number" ? payload : payload.brightness;
  if (brightness === undefined) {
    throw new Error("Light brightness is required");
  }
  await updateDeviceState(deviceId, {
    status: brightness > 0 ? "on" : "off",
    brightness: Math.max(0, Math.min(100, brightness)),
  });
}

export async function setLightColor(
  deviceId: string,
  payload: LightDeviceUpdatePayload | string,
): Promise<void> {
  const colorHex = typeof payload === "string" ? payload : payload.colorHex;
  if (!colorHex) {
    throw new Error("Light colorHex is required");
  }
  await updateDeviceState(deviceId, {
    status: "on",
    color: hexToRgb(colorHex),
  });
}

export async function setLightTimer(
  deviceId: string,
  payload: LightDeviceUpdatePayload | number,
): Promise<void> {
  const timerMinutes = typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined) {
    throw new Error("Light timerMinutes is required");
  }
  await updateDeviceState(deviceId, { timerMinutes: Math.max(0, timerMinutes) });
}
