import {
  ACDeviceDetail,
  ACDeviceUpdatePayload,
  DeviceDetail,
  DeviceSummary,
  FanDeviceUpdatePayload,
  LightDeviceDetail,
  LightDeviceUpdatePayload,
  ToggleDevicePowerPayload,
} from "../types";

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
    id: "device-light-bedroom",
    name: "Light",
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
    scheduleFrom: "18:00",
    scheduleTo: "23:00",
  },
  "device-light-bedroom": {
    id: "device-light-bedroom",
    name: "Light",
    type: "light",
    isOn: false,
    online: true,
    brightness: 20,
    colorHex: "#F6C126",
    scheduleFrom: "19:00",
    scheduleTo: "23:30",
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
  await wait(160);
  return copy(mockDevices);
}

export async function getDeviceDetail(deviceId: string): Promise<DeviceDetail> {
  await wait(180);
  const detail = mockDetails[deviceId];
  if (!detail) {
    throw new Error("Device not found");
  }
  return copy(detail);
}

export async function toggleDevicePower(
  deviceId: string,
  payload: ToggleDevicePowerPayload | boolean,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail) {
    throw new Error("Device not found");
  }

  const isOn = typeof payload === "boolean" ? payload : payload.isOn;

  updateDetail(deviceId, { isOn } as Partial<DeviceDetail>);
  syncSummaryPower(deviceId, isOn);
}

export async function setFanLevel(
  deviceId: string,
  payload: FanDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "fan");

  const level = typeof payload === "number" ? payload : payload.level;
  if (!level) {
    throw new Error("Fan level is required");
  }

  updateDetail(deviceId, { level } as Partial<
    Extract<DeviceDetail, { type: "fan" }>
  >);
}

export async function setFanTimer(
  deviceId: string,
  payload: FanDeviceUpdatePayload | number,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "fan");

  const timerMinutes =
    typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined) {
    throw new Error("Fan timerMinutes is required");
  }

  updateDetail(deviceId, {
    timerMinutes: Math.max(0, timerMinutes),
  } as Partial<Extract<DeviceDetail, { type: "fan" }>>);
}

export async function setACTemperature(
  deviceId: string,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "ac");

  const temperature =
    typeof payload === "number" ? payload : payload.temperature;
  if (temperature === undefined) {
    throw new Error("AC temperature is required");
  }

  updateDetail(deviceId, {
    temperature: Math.min(30, Math.max(16, temperature)),
  } as Partial<Extract<DeviceDetail, { type: "ac" }>>);
}

export async function setACMode(
  deviceId: string,
  payload: ACDeviceUpdatePayload | ACDeviceDetail["mode"],
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "ac");

  const mode = typeof payload === "string" ? payload : payload.mode;
  if (!mode) {
    throw new Error("AC mode is required");
  }

  updateDetail(deviceId, { mode } as Partial<
    Extract<DeviceDetail, { type: "ac" }>
  >);
}

export async function setACFanSpeed(
  deviceId: string,
  payload: ACDeviceUpdatePayload | 1 | 2 | 3,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "ac");

  const fanSpeed = typeof payload === "number" ? payload : payload.fanSpeed;
  if (!fanSpeed) {
    throw new Error("AC fanSpeed is required");
  }

  updateDetail(deviceId, { fanSpeed } as Partial<
    Extract<DeviceDetail, { type: "ac" }>
  >);
}

export async function setACTimer(
  deviceId: string,
  payload: ACDeviceUpdatePayload | number,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "ac");

  const timerMinutes =
    typeof payload === "number" ? payload : payload.timerMinutes;
  if (timerMinutes === undefined) {
    throw new Error("AC timerMinutes is required");
  }

  updateDetail(deviceId, {
    timerMinutes: Math.max(0, timerMinutes),
  } as Partial<Extract<DeviceDetail, { type: "ac" }>>);
}

export async function setLightBrightness(
  deviceId: string,
  payload: LightDeviceUpdatePayload | number,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "light");

  const brightness = typeof payload === "number" ? payload : payload.brightness;
  if (brightness === undefined) {
    throw new Error("Light brightness is required");
  }

  updateDetail(deviceId, {
    brightness: Math.min(100, Math.max(0, brightness)),
  } as Partial<Extract<DeviceDetail, { type: "light" }>>);
}

export async function setLightColor(
  deviceId: string,
  payload: LightDeviceUpdatePayload | string,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "light");

  const colorHex = typeof payload === "string" ? payload : payload.colorHex;
  if (!colorHex) {
    throw new Error("Light colorHex is required");
  }

  updateDetail(deviceId, {
    colorHex,
  } as Partial<Extract<DeviceDetail, { type: "light" }>>);
}

export async function setLightSchedule(
  deviceId: string,
  schedule:
    | Pick<LightDeviceDetail, "scheduleFrom" | "scheduleTo">
    | LightDeviceUpdatePayload,
): Promise<void> {
  await wait(120);
  assertDeviceType(mockDetails[deviceId], "light");

  const scheduleFrom =
    "scheduleFrom" in schedule ? schedule.scheduleFrom : undefined;
  const scheduleTo = "scheduleTo" in schedule ? schedule.scheduleTo : undefined;

  if (!scheduleFrom || !scheduleTo) {
    throw new Error("Light scheduleFrom and scheduleTo are required");
  }

  updateDetail(deviceId, {
    scheduleFrom,
    scheduleTo,
  } as Partial<Extract<DeviceDetail, { type: "light" }>>);
}
