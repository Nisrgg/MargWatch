import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketURL } from '../config/apiConfig';

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  userId?: string;
  message?: string;
  timestamp?: string;
}

export type WebSocketEventHandler = (data: WebSocketMessage['data'] | WebSocketMessage) => void;

interface UseWebSocketOptions {
  token: string | null;
  eventTypes?: string[];
  onMessage?: WebSocketEventHandler;
  enabled?: boolean;
}

/**
 * Connect to backend WebSocket at ws://<API_HOST>/ws/notifications?token=<JWT>
 * and handle events: complaint_created, complaint_update, work_order_update.
 */
export function useWebSocket({
  token,
  eventTypes = ['complaint_created', 'complaint_update', 'work_order_update'],
  onMessage,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const eventTypesRef = useRef(eventTypes);

  onMessageRef.current = onMessage;
  eventTypesRef.current = eventTypes;

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !token) {
      disconnect();
      return;
    }

    const url = getWebSocketURL(token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string);
        const type = message.type === 'broadcast' || message.type === 'notification'
          ? (message.data as { type?: string })?.type
          : message.type;
        if (type && eventTypesRef.current.includes(type)) {
          onMessageRef.current?.(message.data ?? message);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      disconnect();
    };
  }, [token, enabled, disconnect]);

  return { isConnected, disconnect };
}
