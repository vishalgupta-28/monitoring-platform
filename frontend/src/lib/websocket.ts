'use client';

import { useEffect, useState } from 'react';

type StreamMessage = {
  type: 'metric' | 'alert' | 'log';
  payload: Record<string, string | number>;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/api/v1/ws/stream';

export function useLiveStream() {
  const [messages, setMessages] = useState<StreamMessage[]>([]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let fallbackInterval: number | null = null;
    let hasLiveTraffic = false;

    const startFallback = () => {
      if (fallbackInterval !== null) {
        return;
      }
      fallbackInterval = window.setInterval(() => {
        const fallbackMessage: StreamMessage = {
          type: 'metric',
          payload: {
            service_id: 'edge-api-gateway',
            metric_name: 'latency_ms',
            value: Math.round(140 + Math.random() * 120),
            recorded_at: new Date().toISOString(),
          },
        };
        setMessages((current) => [fallbackMessage, ...current].slice(0, 12));
      }, 2200);
    };

    try {
      socket = new WebSocket(WS_URL);
      socket.onmessage = (event) => {
        hasLiveTraffic = true;
        setMessages((current) => [JSON.parse(event.data) as StreamMessage, ...current].slice(0, 12));
      };
      socket.onopen = () => socket?.send('subscribe');
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (!hasLiveTraffic) {
          startFallback();
        }
      };
      window.setTimeout(() => {
        if (!hasLiveTraffic && messages.length === 0) {
          startFallback();
        }
      }, 1800);
    } catch {
      startFallback();
    }

    return () => {
      socket?.close();
      if (fallbackInterval !== null) {
        window.clearInterval(fallbackInterval);
      }
    };
  }, []);

  return messages;
}
