import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DeviceCatalogItem,
} from "../constants/devices";
import {
  AutomationScene,
} from "../constants/automations";
import { automationService } from "../../features/automation/services/automation.service";
import { Mode } from "../../features/automation/types";
import { theme } from "../../theme";
import { getDevices, toggleDevicePower } from "../../features/control/services/device.service";
import { useAuthContext } from "../../features/auth/state/AuthContext";
import { wsService } from "../services/websocket.service";

export type TelemetryData = {
  temperature: number;
  humidity: number;
  light: number;
  timestamp: string;
};

// Helper to map backend Mode to UI AutomationScene
function mapModeToScene(mode: Mode): AutomationScene {
  const iconMap: Record<string, { icon: string; color: string }> = {
    "Good Morning": { icon: "sunny", color: theme.colors.weatherIcon },
    "Get Up": { icon: "sunny", color: theme.colors.weatherIcon },
    "Goodnight": { icon: "moon", color: "#4A6FA5" },
    "Sleep": { icon: "moon", color: "#4A6FA5" },
    "Go out": { icon: "partly-sunny", color: "#FFD700" },
    "Leave Home": { icon: "log-out-outline", color: "#FFD700" },
    "Hot weather": { icon: "thermometer-outline", color: theme.colors.dateIcon },
  };

  const defaultIcon = { icon: "color-wand-outline", color: theme.colors.headerBlue };
  const mapped = iconMap[mode.name] || defaultIcon;

  return {
    id: String(mode.id),
    name: mode.name,
    icon: mapped.icon,
    iconColor: mapped.color,
    isActive: mode.isActive,
    // Store original mode data for details if needed
    _modeData: mode,
  };
}

type SmartHomeContextValue = {
  devices: DeviceCatalogItem[];
  scenes: AutomationScene[];
  telemetry: TelemetryData | null;
  selectDevicesByIds: (ids: string[]) => DeviceCatalogItem[];
  selectScenesByIds: (ids: string[]) => AutomationScene[];
  setDevicePower: (deviceId: string, isOn: boolean, deviceType?: DeviceCatalogItem["type"]) => Promise<void>;
  setSceneActive: (sceneId: string, isActive: boolean) => Promise<void>;
  reloadScenes: () => Promise<void>;
  reloadDevices: () => Promise<void>;
};
     
const SmartHomeContext = createContext<SmartHomeContextValue | undefined>(
  undefined,
);

export function SmartHomeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([]);
  const [scenes, setScenes] = useState<AutomationScene[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  const loadDevices = useCallback(async () => {
    if (!isAuthenticated) {
      setDevices([]);
      return;
    }

    try {
      const apiDevices = await getDevices();
      setDevices(apiDevices as DeviceCatalogItem[]);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  }, [isAuthenticated]);

  const loadScenes = useCallback(async () => {
    if (!isAuthenticated) {
      setScenes([]);
      return;
    }

    try {
      const modes = await automationService.getModes();
      setScenes(modes.map(mapModeToScene));
    } catch (error) {
      console.error("Failed to load scenes:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDevices([]);
      setScenes([]);
      setTelemetry(null);
      wsService.disconnect();
      return;
    }

    void loadDevices();
    void loadScenes();

    wsService.connect();
    const unsubscribe = wsService.subscribe((event) => {
      if (event.type === "telemetry_update") {
        setTelemetry(event.data);
      } else if (event.type === "device_update") {
        setDevices((prev) =>
          prev.map((device) => {
            if (String(device.id) === String(event.device_id)) {
              const status = typeof event.state.status === "string"
                ? event.state.status.toLowerCase()
                : undefined;
              const isOn = status
                ? (device.type === "door" ? status === "unlocked" : status === "on")
                : device.isOn;
              
              // This is a simplified update. For full accuracy, we'd want to 
              // re-run the normalizer from device.service, but for now we just
              // update the isOn status.
              return { ...device, isOn };
            }
            return device;
          })
        );
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [isAuthenticated, loadDevices, loadScenes]);

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

    const setDevicePowerState = async (
      deviceId: string,
      isOn: boolean,
      deviceType?: DeviceCatalogItem["type"],
    ) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to control devices.");
      }

      // Optimistic update
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, isOn } : device,
        ),
      );

      try {
        const resolvedType = deviceType ?? devices.find((device) => device.id === deviceId)?.type;
        await toggleDevicePower(deviceId, isOn, resolvedType);
      } catch (error) {
        console.error("Failed to toggle device power:", error);
        // Revert on error
        setDevices((prev) =>
          prev.map((device) =>
            device.id === deviceId ? { ...device, isOn: !isOn } : device,
          ),
        );
      }
    };

    const setSceneActive = async (sceneId: string, isActive: boolean) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to control modes.");
      }

      // Optimistic update
      setScenes((prev) =>
        prev.map((scene) =>
          scene.id === sceneId ? { ...scene, isActive } : scene,
        ),
      );

      try {
        await automationService.toggleMode(sceneId, isActive);
        // We could also reload scenes here to get the real state, 
        // but optimistic update is usually fine for a toggle
      } catch (error) {
        console.error("Failed to toggle scene:", error);
        // Revert on error
        setScenes((prev) =>
          prev.map((scene) =>
            scene.id === sceneId ? { ...scene, isActive: !isActive } : scene,
          ),
        );
      }
    };

    return {
      devices,
      scenes,
      telemetry,
      selectDevicesByIds,
      selectScenesByIds,
      setDevicePower: setDevicePowerState,
      setSceneActive,
      reloadScenes: loadScenes,
      reloadDevices: loadDevices,
    };
  }, [devices, isAuthenticated, loadDevices, loadScenes, scenes, telemetry]);

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
