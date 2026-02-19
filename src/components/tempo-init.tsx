"use client";

import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    const init = async () => {
      if (process.env.NEXT_PUBLIC_TEMPO) {
        try {
          const { TempoDevtools } = await import("tempo-devtools");
          /* TempoDevtools.init() [deprecated] */;
        } catch (error) {
          console.error("Error initializing Tempo devtools:", error);
        }
      }
    };

    init();
  }, []);

  return null;
}
