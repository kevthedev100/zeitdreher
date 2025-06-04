"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold mb-8 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Zeit ist wertvoll
              </span>{" "}
              <span className="text-slate-800">
                und die Zeit deiner Mitarbeiter auch
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Moderne Zeiterfassungsplattform mit Spracherkennung, interaktiven
              Dashboards und rollenbasierter Analytik. Transformieren Sie, wie
              Ihr Team Arbeitsstunden erfasst und analysiert.
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
                className="inline-flex items-center px-8 py-4 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-300 text-lg font-medium shadow-sm"
              >
                Preise ansehen
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Sprachgestützte Zeiterfassung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Interaktives Analytik-Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Rollenbasierte Zugriffskontrolle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
