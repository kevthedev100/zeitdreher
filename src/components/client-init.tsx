"use client";

import { useEffect } from "react";

export default function ClientInit() {
  useEffect(() => {
    const initTempo = async () => {
      if (process.env.NEXT_PUBLIC_TEMPO) {
        try {
          const { TempoDevtools } = await import("tempo-devtools");
          TempoDevtools.init();
        } catch (error) {
          console.error("Failed to initialize Tempo devtools:", error);
        }
      }
    };

    initTempo();
  }, []);

  return null;
}
