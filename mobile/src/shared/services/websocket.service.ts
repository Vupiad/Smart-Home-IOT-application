import { apiConfig } from "./api.client";

type WebSocketEvent =
  | { type: "telemetry_update"; data: { temperature: number; humidity: number; light: number; timestamp: string } }
  | { type: "device_update"; device_id: number; state: Record<string, unknown> };

type Listener = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect() {
    if (this.ws) return;

    const wsUrl = apiConfig.baseUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "") + "/ws";
    
    console.log("[WebSocket] Connecting to", wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[WebSocket] Connected");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("[WebSocket] Disconnected. Reconnecting in 5s...");
      this.ws = null;
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const wsService = new WebSocketService();
