"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Clock, Star } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamic Clock Component
function DynamicClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles for clock hands
  const hourAngle = hours * 30 + minutes * 0.5; // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  return (
    <div className="w-[700px] h-[700px] relative">
      {/* Clock face */}
      <div className="w-full h-full rounded-full border-4 border-white/20 relative">
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-14 bg-white/50 origin-bottom"
            style={{
              left: "50%",
              top: "12px",
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: "50% 338px",
            }}
          />
        ))}

        {/* Hour hand */}
        <div
          className="absolute w-2.5 bg-white/50 origin-bottom rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            height: "210px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${hourAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />

        {/* Minute hand */}
        <div
          className="absolute w-2 bg-white/50 origin-bottom rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            height: "280px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />

        {/* Second hand */}
        <div
          className="absolute w-0.5 bg-red-300 origin-bottom rounded-full transition-transform duration-75 ease-linear"
          style={{
            height: "300px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${secondAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />

        {/* Center dot */}
        <div className="absolute w-5 h-5 bg-white/90 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black relative overflow-hidden">
      {/* Dynamic Clock in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rotate-12 flex items-center justify-center">
          <DynamicClock />
        </div>
      </div>

      <div className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 md:pt-20 md:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-blue-100">
                Nr. 1 KI-Zeiterfassungssoftware
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                KI-Zeittracking und Analyse
              </span>{" "}
              <span className="text-white">
                für echte Produktivitätsgewinne – jeden Tag
              </span>
            </h1>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-medium mb-8 sm:mb-12 text-white">
              Reflektieren. Analysieren. Optimieren.
            </h2>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Erfasse deine Zeit und Aufgaben mühelos per Sprache und gewinne
              wertvolle KI-gestützte Erkenntnisse zur Produktivitätsoptimierung.
              Verstehe deine Arbeitsmuster, identifiziere
              Verbesserungspotenziale und setze gezielte Optimierungsvorschläge
              um.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 sm:px-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto justify-center"
              >
                Zeit erfassen starten
                <ArrowUpRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-white bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-base sm:text-lg font-medium shadow-sm w-full sm:w-auto justify-center"
              >
                Preise ansehen
              </Link>
            </div>

            <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-300 px-4 sm:px-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
                <span className="text-center sm:text-left">
                  Sprachgestützte Zeiterfassung
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
                <span className="text-center sm:text-left">
                  KI-gestützte Produktivitätsanalyse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
                <span className="text-center sm:text-left">
                  Personalisierte Optimierungsvorschläge
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
