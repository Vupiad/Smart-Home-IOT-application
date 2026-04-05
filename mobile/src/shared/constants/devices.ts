export type DeviceCatalogKind = "fan" | "ac" | "light" | "door";

export type DeviceCatalogItem = {
  id: string;
  type: DeviceCatalogKind;
  name: string;
  icon: string;
  room: string;
  isOn: boolean;
  subtitle?: string;
};

export const DEVICE_CATALOG: DeviceCatalogItem[] = [
  {
    id: "device-fan-kitchen",
    type: "fan",
    name: "Fan",
    icon: "aperture-outline",
    room: "Kitchen",
    isOn: true,
    subtitle: "Speed 2",
  },
  {
    id: "device-fan-living-room",
    type: "fan",
    name: "Fan",
    icon: "aperture-outline",
    room: "Living room",
    isOn: true,
    subtitle: "Speed 3",
  },
  {
    id: "device-fan-bedroom",
    type: "fan",
    name: "Fan",
    icon: "aperture-outline",
    room: "Bedroom",
    isOn: false,
    subtitle: "Speed 1",
  },
  {
    id: "device-ac-living-room",
    type: "ac",
    name: "Air Conditioner",
    icon: "snow-outline",
    room: "Living room",
    isOn: true,
    subtitle: "24 degree",
  },
  {
    id: "device-ac-bedroom",
    type: "ac",
    name: "Air Conditioner",
    icon: "snow-outline",
    room: "Bedroom",
    isOn: false,
    subtitle: "26 degree",
  },
  {
    id: "device-light-kitchen",
    type: "light",
    name: "Light",
    icon: "bulb-outline",
    room: "Kitchen",
    isOn: true,
    subtitle: "Warm White",
  },
  {
    id: "device-light-living-room",
    type: "light",
    name: "Light",
    icon: "bulb-outline",
    room: "Living room",
    isOn: true,
    subtitle: "Soft White",
  },
  {
    id: "device-light-bedroom",
    type: "light",
    name: "Light",
    icon: "bulb-outline",
    room: "Bedroom",
    isOn: false,
    subtitle: "Dim 10%",
  },
  {
    id: "device-door-front",
    type: "door",
    name: "Front Door",
    icon: "lock-closed-outline",
    room: "Entrance",
    isOn: true,
    subtitle: "Locked",
  },
  {
    id: "device-door-garage",
    type: "door",
    name: "Front Door",
    icon: "lock-closed-outline",
    room: "Garage",
    isOn: false,
    subtitle: "Closed",
  },
];

export const HOME_QUICK_ACCESS_IDS = [
  "device-ac-living-room",
  "device-fan-living-room",
];
export const CONTROL_DEVICE_IDS = [
  "device-fan-kitchen",
  "device-ac-living-room",
  "device-light-kitchen",
  "device-door-front",
];

export { HOME_SCENE_IDS } from "./automations";

export function getDevicesByIds(ids: string[]) {
  const byId = new Map(DEVICE_CATALOG.map((device) => [device.id, device]));
  return ids
    .map((id) => byId.get(id))
    .filter((device): device is DeviceCatalogItem => Boolean(device));
}
