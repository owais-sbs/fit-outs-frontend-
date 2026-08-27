import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function wsBaseUrl() {
  const api = process.env.REACT_APP_API_BASE_URL || "/api";
  if (api.startsWith("http")) {
    return api.replace(/\/api\/?$/, "");
  }
  return window.location.origin;
}

export function useCommunicationsSocket({ channelUuid, accountId, onMessage, onInboxRefresh }) {
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsBaseUrl()}/api/ws`),
      reconnectDelay: 5000,
      onStompError: () => {
        /* non-fatal — inbox still works via REST polling */
      },
      onWebSocketError: () => {
        /* SockJS transport errors must not bubble as uncaught exceptions */
      },
      onConnect: () => {
        if (channelUuid) {
          client.subscribe(`/topic/channels/${channelUuid}`, (frame) => {
            try {
              onMessage?.(JSON.parse(frame.body));
            } catch {
              /* ignore */
            }
          });
        }
        if (accountId) {
          client.subscribe(`/topic/inbox/${accountId}`, () => {
            onInboxRefresh?.();
          });
        }
      },
    });
    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [channelUuid, accountId, onMessage, onInboxRefresh]);
}
