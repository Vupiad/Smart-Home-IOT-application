export type DeviceType = "fan" | "ac" | "light";

export interface DeviceSummary {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  room: string;
  icon?: string;
  subtitle?: string;
}

export interface BaseDeviceDetail {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  online: boolean;
}

export interface FanDeviceDetail extends BaseDeviceDetail {
  type: "fan";
  level: 1 | 2 | 3;
  timerMinutes: number;
}

export type ACMode = "cool" | "hot" | "auto";

export interface ACDeviceDetail extends BaseDeviceDetail {
  type: "ac";
  mode: ACMode;
  temperature: number;
  fanSpeed: 1 | 2 | 3;
  timerMinutes: number;
  humidity: number;
}

export interface LightDeviceDetail extends BaseDeviceDetail {
  type: "light";
  brightness: number;
  colorHex: string;
  timerMinutes: number;
}

export type DeviceDetail = FanDeviceDetail | ACDeviceDetail | LightDeviceDetail;

export type ToggleDevicePowerPayload = {
  isOn: boolean;
};

export type FanDeviceUpdatePayload = {
  level?: 1 | 2 | 3;
  timerMinutes?: number;
};

export type ACDeviceUpdatePayload = {
  mode?: ACMode;
  temperature?: number;
  fanSpeed?: 1 | 2 | 3;
  timerMinutes?: number;
};

export type LightDeviceUpdatePayload = {
  brightness?: number;
  colorHex?: string;
  timerMinutes?: number;
};

export type DeviceUpdatePayload =
  | ToggleDevicePowerPayload
  | FanDeviceUpdatePayload
  | ACDeviceUpdatePayload
  | LightDeviceUpdatePayload;
