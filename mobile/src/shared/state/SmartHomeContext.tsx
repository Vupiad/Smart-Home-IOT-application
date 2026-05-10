import React, { createContext, useContext, useMemo, useState } from "react";

import {
  DEVICE_CATALOG,
  DeviceCatalogItem,
} from "../constants/devices";
import {
  AUTOMATION_SCENES,
  AutomationScene,
} from "../constants/automations";

type SmartHomeContextValue = {
  devices: DeviceCatalogItem[];
  scenes: AutomationScene[];
  selectDevicesByIds: (ids: string[]) => DeviceCatalogItem[];
  selectScenesByIds: (ids: string[]) => AutomationScene[];
  setDevicePower: (deviceId: string, isOn: boolean) => void;
  setSceneActive: (sceneId: string, isActive: boolean) => void;
};

const SmartHomeContext = createContext<SmartHomeContextValue | undefined>(
  undefined,
);

function cloneArray<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

export function SmartHomeProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<DeviceCatalogItem[]>(() =>
    cloneArray(DEVICE_CATALOG),
  );
  const [scenes, setScenes] = useState<AutomationScene[]>(() =>
    cloneArray(AUTOMATION_SCENES),
  );

  const value = useMemo<SmartHomeContextValue>(() => {
    const selectDevicesByIds = (ids: string[]) => {
      const byId = new Map(devices.map((device) => [device.id, device]));
      return ids
        .map((id) => byId.get(id))
        .filter((device): device is DeviceCatalogItem => Boolean(device));
    };

    const selectScenesByIds = (ids: string[]) => {
      const byId = new Map(scenes.map((scene) => [scene.id, scene]));
      return ids
        .map((id) => byId.get(id))
        .filter((scene): scene is AutomationScene => Boolean(scene));
    };

    const setDevicePower = (deviceId: string, isOn: boolean) => {
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, isOn } : device,
        ),
      );
    };

    const setSceneActive = (sceneId: string, isActive: boolean) => {
      setScenes((prev) =>
        prev.map((scene) =>
          scene.id === sceneId ? { ...scene, isActive } : scene,
        ),
      );
    };

    return {
      devices,
      scenes,
      selectDevicesByIds,
      selectScenesByIds,
      setDevicePower,
      setSceneActive,
    };
  }, [devices, scenes]);

  return (
    <SmartHomeContext.Provider value={value}>{children}</SmartHomeContext.Provider>
  );
}

export function useSmartHomeContext() {
  const ctx = useContext(SmartHomeContext);
  if (!ctx) {
    throw new Error("useSmartHomeContext must be used inside SmartHomeProvider");
  }

  return ctx;
}
