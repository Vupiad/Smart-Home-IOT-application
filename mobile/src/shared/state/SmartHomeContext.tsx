import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDevices } from "../../features/control/services/deviceService";
import { useAuthContext } from "../../features/auth/state/AuthContext";

import { DEVICE_CATALOG, DeviceCatalogItem } from "../constants/devices";
import { AUTOMATION_SCENES, AutomationScene } from "../constants/automations";

type SmartHomeContextValue = {
  devices: DeviceCatalogItem[];
  scenes: AutomationScene[];
  selectDevicesByIds: (ids: string[]) => DeviceCatalogItem[];
  selectScenesByIds: (ids: string[]) => AutomationScene[];
  setDevicePower: (deviceId: string, isOn: boolean) => void;
  updateDeviceById: (
    deviceId: string,
    patch: Partial<DeviceCatalogItem>,
  ) => void;
  removeDeviceById: (deviceId: string) => void;
  setSceneActive: (sceneId: string, isActive: boolean) => void;
  refreshDevices: () => Promise<void>;
};

const SmartHomeContext = createContext<SmartHomeContextValue | undefined>(
  undefined,
);

function cloneArray<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

export function SmartHomeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [devices, setDevices] = useState<DeviceCatalogItem[]>(() =>
    cloneArray(DEVICE_CATALOG),
  );
  const [scenes, setScenes] = useState<AutomationScene[]>(() =>
    cloneArray(AUTOMATION_SCENES),
  );

  const loadDevices = useCallback(async () => {
    try {
      const fetchedDevices = await getDevices();
      const mappedDevices = fetchedDevices.map((d: any) => ({
        id: d.id,
        type: d.type,
        name: d.name,
        room: d.room,
        isOn: d.isOn,
        subtitle: d.subtitle,
        icon:
          d.icon ||
          (d.type === "light"
            ? "bulb-outline"
            : d.type === "fan"
              ? "aperture-outline"
              : d.type === "ac"
                ? "snow-outline"
                : "lock-closed-outline"),
      }));
      setDevices(mappedDevices as DeviceCatalogItem[]);
    } catch (err) {
      console.error("Error fetching devices for context:", err);
    }
  }, []);

  // Trước đây chỉ fetch một lần khi mount → user chưa login, không có JWT →  rơi về mock.
  useEffect(() => {
    if (!isAuthenticated) {
      setDevices(cloneArray(DEVICE_CATALOG));
      return;
    }
    void loadDevices();
  }, [isAuthenticated, loadDevices]);

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

    const updateDeviceById = (
      deviceId: string,
      patch: Partial<DeviceCatalogItem>,
    ) => {
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, ...patch } : device,
        ),
      );
    };

    const removeDeviceById = (deviceId: string) => {
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
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
      updateDeviceById,
      removeDeviceById,
      setSceneActive,
      refreshDevices: loadDevices,
    };
  }, [devices, scenes, loadDevices]);

  return (
    <SmartHomeContext.Provider value={value}>
      {children}
    </SmartHomeContext.Provider>
  );
}

export function useSmartHomeContext() {
  const ctx = useContext(SmartHomeContext);
  if (!ctx) {
    throw new Error(
      "useSmartHomeContext must be used inside SmartHomeProvider",
    );
  }

  return ctx;
}
