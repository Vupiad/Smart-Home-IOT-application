import {
  ACDeviceDetail,
  DeviceDetail,
  DeviceSummary,
  LightDeviceDetail,
} from "../types";

const mockDevices: DeviceSummary[] = [
  {
    id: "device-ac-1",
    name: "Air Condition",
    type: "ac",
    isOn: true,
    room: "Living Room",
    //deviceCountLabel: "1 device",
  },
  {
    id: "device-light-1",
    name: "Smart Light",
    type: "light",
    isOn: false,
    room: "Kitchen",
    //deviceCountLabel: "1 device",
  },
  {
    id: "device-fan-1",
    name: "Fan",
    type: "fan",
    isOn: true,
    room: "Bedroom",
    //deviceCountLabel: "1 device",
  },
];

const mockDetails: Record<string, DeviceDetail> = {
  "device-fan-1": {
    id: "device-fan-1",
    name: "Fan",
    type: "fan",
    isOn: true,
    online: true,
    level: 1,
    timerMinutes: 10,
  },
  "device-ac-1": {
    id: "device-ac-1",
    name: "Air Condition",
    type: "ac",
    isOn: true,
    online: true,
    mode: "cool",
    temperature: 24,
    fanSpeed: 1,
    timerMinutes: 10,
    humidity: 62,
  },
  "device-light-1": {
    id: "device-light-1",
    name: "Smart Light",
    type: "light",
    isOn: true,
    online: true,
    brightness: 47,
    colorHex: "#2D5BFF",
    scheduleFrom: "18:00",
    scheduleTo: "23:00",
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

function syncSummaryPower(deviceId: string, isOn: boolean) {
  const index = mockDevices.findIndex((item) => item.id === deviceId);
  if (index !== -1) {
    mockDevices[index] = { ...mockDevices[index], isOn };
  }
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
  isOn: boolean,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail) {
    throw new Error("Device not found");
  }

  mockDetails[deviceId] = { ...detail, isOn };
  syncSummaryPower(deviceId, isOn);
}

export async function setFanLevel(
  deviceId: string,
  level: 1 | 2 | 3,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "fan") {
    throw new Error("Fan device not found");
  }

  mockDetails[deviceId] = { ...detail, level };
}

export async function setFanTimer(
  deviceId: string,
  timerMinutes: number,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "fan") {
    throw new Error("Fan device not found");
  }

  mockDetails[deviceId] = {
    ...detail,
    timerMinutes: Math.max(0, timerMinutes),
  };
}

export async function setACTemperature(
  deviceId: string,
  temperature: number,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "ac") {
    throw new Error("AC device not found");
  }

  mockDetails[deviceId] = {
    ...detail,
    temperature: Math.min(30, Math.max(16, temperature)),
  };
}

export async function setACMode(
  deviceId: string,
  mode: ACDeviceDetail["mode"],
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "ac") {
    throw new Error("AC device not found");
  }

  mockDetails[deviceId] = { ...detail, mode };
}

export async function setACFanSpeed(
  deviceId: string,
  fanSpeed: 1 | 2 | 3,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "ac") {
    throw new Error("AC device not found");
  }

  mockDetails[deviceId] = { ...detail, fanSpeed };
}

export async function setACTimer(
  deviceId: string,
  timerMinutes: number,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "ac") {
    throw new Error("AC device not found");
  }

  mockDetails[deviceId] = {
    ...detail,
    timerMinutes: Math.max(0, timerMinutes),
  };
}

export async function setLightBrightness(
  deviceId: string,
  brightness: number,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "light") {
    throw new Error("Light device not found");
  }

  mockDetails[deviceId] = {
    ...detail,
    brightness: Math.min(100, Math.max(0, brightness)),
  };
}

export async function setLightColor(
  deviceId: string,
  colorHex: string,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "light") {
    throw new Error("Light device not found");
  }

  mockDetails[deviceId] = { ...detail, colorHex };
}

export async function setLightSchedule(
  deviceId: string,
  schedule: Pick<LightDeviceDetail, "scheduleFrom" | "scheduleTo">,
): Promise<void> {
  await wait(120);
  const detail = mockDetails[deviceId];
  if (!detail || detail.type !== "light") {
    throw new Error("Light device not found");
  }

  mockDetails[deviceId] = { ...detail, ...schedule };
}
