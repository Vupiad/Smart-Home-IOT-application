export type DeviceType = "fan" | "ac" | "light";

export interface DeviceSummary {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  room: string;
  //deviceCountLabel: string;
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
  scheduleFrom: string;
  scheduleTo: string;
}

export type DeviceDetail = FanDeviceDetail | ACDeviceDetail | LightDeviceDetail;
