export interface ModeDeviceState {
  status?: string;
  speed?: number;
  color?: { r: number; g: number; b: number };
}

export interface ModeDevice {
  id: string | number;
  state: ModeDeviceState;
}

export interface Mode {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  devices: ModeDevice[];
  isActive: boolean;
}

export interface CreateModeDto {
  name: string;
  startTime: string;
  endTime: string;
  devices: ModeDevice[];
  isActive: boolean;
}
