import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  token?: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: string;
  message?: string;
  timestamp?: string;
}

export function useWebSocket(
  eventType: string,
  onMessage: (data: any) => void,
  options: UseWebSocketOptions = {}
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    token,
  } = options;

  const connect = useCallback(() => {
    console.log('🔌 WebSocket connect() called with:', { 
      url, 
      token: token ? `${token.substring(0, 20)}...` : 'null',
      autoConnect,
      currentState: socketRef.current?.readyState 
    });

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected, skipping');
      return;
    }

    // Add token validation
    if (!token) {
      console.warn('❌ WebSocket: No token available, skipping connection');
      setIsConnected(false);
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Construct WebSocket URL with precise logic
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const wsBaseUrl = baseUrl.replace('/api', '').replace('http', 'ws');
    const finalWsUrl = token 
      ? `${wsBaseUrl}/ws/notifications?token=${token}`
      : `${wsBaseUrl}/ws/notifications`;

    console.log('🌐 WebSocket URL constructed:', finalWsUrl);
    console.log('🔑 Token being used:', token.substring(0, 50) + '...');
    
    try {
      console.log('🚀 Creating new WebSocket connection...');
      socketRef.current = new WebSocket(finalWsUrl);

      socketRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type
        });
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('💥 WebSocket error:', {
          error,
          readyState: socketRef.current?.readyState,
          url: finalWsUrl
        });
        setIsConnected(false);
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          // Check if this is the event type we're listening for
          if (message.type === eventType || message.data?.type === eventType) {
            onMessage(message.data || message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [url, eventType, onMessage, reconnectAttempts, reconnectDelay, token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      console.log('Disconnecting WebSocket');
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    console.log('🔄 WebSocket useEffect triggered:', {
      autoConnect,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      dependencies: { autoConnect, token }
    });
    
    if (autoConnect && token) {
      console.log('✅ Conditions met, calling connect()');
      connect();
    } else {
      console.log('❌ Conditions not met:', { autoConnect, hasToken: !!token });
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 WebSocket useEffect cleanup');
      disconnect();
    };
  }, [autoConnect, token]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    send,
    isConnected,
  };
}

// Hook for listening to multiple event types
export function useWebSocketEvents(
  events: Array<{ type: string; handler: (data: any) => void }>,
  options: UseWebSocketOptions = {}
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    token,
  } = options;

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Add token validation
    if (!token) {
      console.warn('WebSocket: No token available, skipping connection');
      setIsConnected(false);
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Construct WebSocket URL with precise logic
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const wsBaseUrl = baseUrl.replace('/api', '').replace('http', 'ws');
    const finalWsUrl = token 
      ? `${wsBaseUrl}/ws/notifications?token=${token}`
      : `${wsBaseUrl}/ws/notifications`;

    console.log('🌐 WebSocket URL constructed for multiple events:', finalWsUrl);
    
    try {
      socketRef.current = new WebSocket(finalWsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          // Find the appropriate handler for this event type
          const eventHandler = events.find(e => 
            e.type === message.type || 
            e.type === message.data?.type ||
            message.type === 'notification' && e.type === message.data?.type ||
            message.type === 'broadcast' && e.type === message.data?.type
          );
          
          if (eventHandler) {
            eventHandler.handler(message.data || message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [url, events, reconnectAttempts, reconnectDelay, token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      console.log('Disconnecting WebSocket');
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    console.log('🔄 WebSocket useEffect triggered:', {
      autoConnect,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      dependencies: { autoConnect, token }
    });
    
    if (autoConnect && token) {
      console.log('✅ Conditions met, calling connect()');
      connect();
    } else {
      console.log('❌ Conditions not met:', { autoConnect, hasToken: !!token });
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 WebSocket useEffect cleanup');
      disconnect();
    };
  }, [autoConnect, token]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    isConnected,
  };
}

// Hook specifically for dashboard real-time updates
export function useDashboardWebSocket(queryClient: any, token?: string) {
  const events = [
    {
      type: 'complaint_update',
      handler: (data: any) => {
        console.log('Complaint updated, invalidating queries:', data);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    },
    {
      type: 'complaint_created',
      handler: (data: any) => {
        console.log('New complaint created, invalidating queries:', data);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    },
    {
      type: 'work_order_update',
      handler: (data: any) => {
        console.log('Work order updated, invalidating queries:', data);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    },
    {
      type: 'user_update',
      handler: (data: any) => {
        console.log('User updated, invalidating queries:', data);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    },
  ];

  return useWebSocketEvents(events, { token });
}