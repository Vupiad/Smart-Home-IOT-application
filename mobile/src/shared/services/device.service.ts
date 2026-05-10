import { apiRequest } from "./api.client";

export interface DeviceState {
  status: string;
  color?: { r: number; g: number; b: number };
  speed?: number | string;
  temp?: number;
  mode?: string;
  fanSpeed?: string;
}

export interface Device {
  id: number | string;
  owner_id?: number;
  name: string;
  device_type: string;
  base_topic?: string;
  state: DeviceState;
  last_online?: string;
}

export const deviceService = {
  getDevices: async (): Promise<Device[]> => {
    return apiRequest<Device[]>("/devices");
  },

  updateDeviceState: async (deviceId: number | string, state: DeviceState): Promise<Device> => {
    return apiRequest<Device>(`/device-control/${deviceId}/state`, {
      method: "PUT",
      body: { state },
    });
  },
};
