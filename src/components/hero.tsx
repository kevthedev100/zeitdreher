"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Clock } from "lucide-react";

export default function Hero() {
  // CSS for the pulsing animation
  const pulsingGradientStyle = {
    animation: "pulseGradient 3s infinite alternate",
  };
  return (
    <div className="bg-gradient-to-br from-black via-blue-950 to-purple-950 relative overflow-hidden">
      <style jsx>{`
        @keyframes pulseGradient {
          0% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.8;
          }
        }
      `}</style>
      {/* Logo icon in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="w-[800px] h-[800px] rotate-12 flex items-center justify-center">
          <Clock className="w-[600px] h-[600px] text-white" />
        </div>
      </div>

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold mb-8 tracking-tight">
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300"
                style={pulsingGradientStyle}
              >
                KI-Zeittracking und Analyse
              </span>{" "}
              <span className="text-white">
                für echte Produktivitätsgewinne – jeden Tag
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Erfasse deine Zeit und Aufgaben mühelos per Sprache und gewinne
              wertvolle KI-gestützte Erkenntnisse zur Produktivitätsoptimierung.
              Verstehe deine Arbeitsmuster, identifiziere
              Verbesserungspotenziale und setze gezielte Optimierungsvorschläge
              um.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Zeit erfassen starten
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-white bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-lg font-medium shadow-sm"
              >
                Preise ansehen
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Sprachgestützte Zeiterfassung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>KI-gestützte Produktivitätsanalyse</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Personalisierte Optimierungsvorschläge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
