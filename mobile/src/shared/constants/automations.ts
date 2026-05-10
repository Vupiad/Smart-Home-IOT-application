import { theme } from "../../theme";

export type AutomationScene = {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
};

export const AUTOMATION_SCENES: AutomationScene[] = [
  {
    id: "scene-get-up",
    name: "Get Up",
    icon: "sunny",
    iconColor: theme.colors.weatherIcon,
    isActive: true,
  },
  {
    id: "scene-goodnight",
    name: "Goodnight",
    icon: "moon",
    iconColor: "#4A6FA5",
    isActive: false,
  },
  {
    id: "scene-go-out",
    name: "Go out",
    icon: "partly-sunny",
    iconColor: "#FFD700",
    isActive: false,
  },
  {
    id: "scene-hot-weather",
    name: "Hot weather",
    icon: "thermometer-outline",
    iconColor: theme.colors.dateIcon,
    isActive: false,
  },
];

export const HOME_SCENE_IDS = [
  "scene-get-up",
  "scene-goodnight",
  "scene-go-out",
];

export const AUTOMATION_FILTERS = [
  "Get Up",
  "Goodnight",
  "Go out",
  "Hot weather",
] as const;

export type AutomationFilter =
  | "Get Up"
  | "Goodnight"
  | "Go out"
  | "Hot weather";

export type AutomationDeviceItem = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  icon: string;

};

export const AUTOMATION_OTHER_DEVICES: AutomationDeviceItem[] = [
  {
    id: "device-door-front",
    name: "Front Door",
    status: "Locked",
    isActive: true,
    icon: "lock-closed-outline",
  },
  {
    id: "device-fan-kitchen",
    name: "Kitchen Fan",
    status: "Speed 2",
    isActive: true,
    icon: "aperture-outline",
  },
  {
    id: "device-ac-living-room",
    name: "Living Room AC",
    status: "24 degree",
    isActive: true,
    icon: "snow-outline",
  },
  {
    id: "device-light-bedroom",
    name: "Bedroom Light",
    status: "Dim 10%",
    isActive: false,
    icon: "bulb-outline",
  },
];

export const AUTOMATION_AVAILABLE_SCENES: Record<
  AutomationFilter,
  AutomationDeviceItem[]
> = {
  "Get Up": [
    {
      id: "device-door-front",
      name: "Front Door",
      status: "Unlocked",
      isActive: true,
      icon: "lock-open-outline",
    },
    {
      id: "device-light-bedroom",
      name: "Bedroom Light",
      status: "Warm White",
      isActive: true,
      icon: "bulb-outline",
    },
    {
      id: "device-fan-living-room",
      name: "Living Room Fan",
      status: "Speed 2",
      isActive: true,
      icon: "aperture-outline",
    },
    {
      id: "device-ac-bedroom",
      name: "Bedroom AC",
      status: "24 degree",
      isActive: false,
      icon: "snow-outline",
    },
  ],
  Goodnight: [
    {
      id: "device-door-front",
      name: "Front Door",
      status: "Locked",
      isActive: true,
      icon: "lock-closed-outline",
    },
    {
      id: "device-light-bedroom",
      name: "Bedroom Light",
      status: "Dim 10%",
      isActive: true,
      icon: "bulb-outline",
    },
    {
      id: "device-fan-bedroom",
      name: "Bedroom Fan",
      status: "Off",
      isActive: false,
      icon: "aperture-outline",
    },
    {
      id: "device-ac-bedroom",
      name: "Bedroom AC",
      status: "Sleep Mode 26C",
      isActive: true,
      icon: "snow-outline",
    },
  ],
  "Go out": [
    {
      id: "device-door-front",
      name: "Front Door",
      status: "Locked",
      isActive: true,
      icon: "lock-closed-outline",
    },
    {
      id: "device-light-kitchen",
      name: "Kitchen Light",
      status: "Off",
      isActive: false,
      icon: "bulb-outline",
    },
    {
      id: "device-fan-kitchen",
      name: "Kitchen Fan",
      status: "Off",
      isActive: false,
      icon: "aperture-outline",
    },
    {
      id: "device-ac-living-room",
      name: "Living Room AC",
      status: "Off",
      isActive: false,
      icon: "snow-outline",
    },
  ],
  "Hot weather": [
    {
      id: "device-ac-living-room",
      name: "Living Room AC",
      status: "Cooling 18C",
      isActive: true,
      icon: "snow-outline",
    },
    {
      id: "device-fan-living-room",
      name: "Living Room Fan",
      status: "Speed 3",
      isActive: true,
      icon: "aperture-outline",
    },
    {
      id: "device-light-living-room",
      name: "Living Room Light",
      status: "Warm White",
      isActive: true,
      icon: "bulb-outline",
    },
    {
      id: "device-door-front",
      name: "Front Door",
      status: "Locked",
      isActive: true,
      icon: "lock-closed-outline",
    },
  ],
};

export function getScenesByIds(ids: string[]) {
  const byId = new Map(AUTOMATION_SCENES.map((scene) => [scene.id, scene]));
  return ids
    .map((id) => byId.get(id))
    .filter((scene): scene is AutomationScene => Boolean(scene));
}
