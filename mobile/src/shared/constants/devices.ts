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

export { HOME_SCENE_IDS } from "./automations";
