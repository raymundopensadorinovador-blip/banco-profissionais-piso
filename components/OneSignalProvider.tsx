"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export function OneSignalProvider() {
  const initializedRef = useRef(false);

  useEffect(() => {
    async function initOneSignal() {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId || initializedRef.current) {
        return;
      }

      initializedRef.current = true;

      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
        });
      } catch (error) {
        console.error("Erro ao iniciar OneSignal:", error);
      }
    }

    initOneSignal();
  }, []);

  return null;
}