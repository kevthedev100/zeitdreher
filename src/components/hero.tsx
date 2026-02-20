"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Star, Users, TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";

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

  const hourAngle = hours * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <div className="w-[700px] h-[700px] relative">
      <div className="w-full h-full rounded-full border-2 border-blue-400/20 relative"
        style={{ boxShadow: "0 0 80px rgba(59, 130, 246, 0.08), inset 0 0 80px rgba(59, 130, 246, 0.03)" }}
      >
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-10 bg-blue-400/30 origin-bottom rounded-full"
            style={{
              left: "50%",
              top: "16px",
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: "50% 334px",
            }}
          />
        ))}

        {/* Minute tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null;
          return (
            <div
              key={`m-${i}`}
              className="absolute w-[1px] h-4 bg-blue-400/15 origin-bottom"
              style={{
                left: "50%",
                top: "16px",
                transform: `translateX(-50%) rotate(${i * 6}deg)`,
                transformOrigin: "50% 334px",
              }}
            />
          );
        })}

        {/* Hour hand */}
        <div
          className="absolute w-2 bg-blue-300/60 origin-bottom rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            height: "180px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${hourAngle}deg)`,
            transformOrigin: "50% 100%",
            boxShadow: "0 0 12px rgba(147, 197, 253, 0.4)",
          }}
        />

        {/* Minute hand */}
        <div
          className="absolute w-1.5 bg-blue-300/50 origin-bottom rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            height: "250px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
            transformOrigin: "50% 100%",
            boxShadow: "0 0 10px rgba(147, 197, 253, 0.3)",
          }}
        />

        {/* Second hand */}
        <div
          className="absolute w-[2px] bg-purple-400/60 origin-bottom rounded-full"
          style={{
            height: "270px",
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${secondAngle}deg)`,
            transformOrigin: "50% 100%",
            boxShadow: "0 0 8px rgba(192, 132, 252, 0.5)",
            transition: "transform 0.1s linear",
          }}
        />

        {/* Center dot */}
        <div
          className="absolute w-4 h-4 bg-blue-400/80 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ boxShadow: "0 0 16px rgba(96, 165, 250, 0.6)" }}
        />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-[#0a0f1e] to-gray-950">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[80px]" />

      {/* Dynamic Clock in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.15]">
        <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rotate-12 flex items-center justify-center">
          <DynamicClock />
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 md:pt-36 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 mb-8">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-blue-200">
                Nr. 1 KI-Zeiterfassungssoftware
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-shift">
                KI-Zeiterfassung
              </span>
              <br />
              <span className="text-white">
                für echte Produktivitäts&shy;gewinne
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl font-medium mb-4 text-gray-300 tracking-wide">
              Reflektieren. Analysieren. Optimieren.
            </p>

            <p className="text-base sm:text-lg text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Erfasse deine Zeit mühelos per Sprache und gewinne
              KI-gestützte Erkenntnisse zur Produktivitätsoptimierung.
              Verstehe Arbeitsmuster und setze gezielte Vorschläge um.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/dashboard"
                className="group inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl transition-all duration-300 text-lg font-semibold glow-button transform hover:-translate-y-0.5"
              >
                Kostenlos starten
                <ArrowUpRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-lg font-medium backdrop-blur-sm"
              >
                Preise ansehen
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Sprachgestützte Zeiterfassung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>KI-Produktivitätsanalyse</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>14 Tage kostenlos</span>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-16 pt-10 border-t border-white/5">
              <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">35%</div>
                  <div className="text-xs sm:text-sm text-gray-500">Mehr Produktivität</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">9.6/10</div>
                  <div className="text-xs sm:text-sm text-gray-500">Bewertung</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">24h</div>
                  <div className="text-xs sm:text-sm text-gray-500">Zeitersparnis/Woche</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
