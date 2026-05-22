import { useEffect, useRef } from "react";

// Generic: knows nothing about auth, cart, or notifications.
// T = the shape of messages you'll send/receive on this channel.
export function useBroadcastChannel<T>(name: string, onMessage?: (data: T) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(name);
    channelRef.current = channel;

    if (onMessage) {
      channel.onmessage = (e: MessageEvent<T>) => onMessage(e.data);
    }

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [name]);

  // Return a stable function the caller can use to send messages.
  const post = (data: T) => channelRef.current?.postMessage(data);
  return post;
}

// added comment
