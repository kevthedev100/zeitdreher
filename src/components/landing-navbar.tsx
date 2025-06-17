"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";

export default function LandingNavbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-black flex items-center gap-2"
        >
          <Clock className="w-6 h-6" />
          Zeitdreher
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Anmelden
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
          >
            Registrieren
          </Link>
        </div>
      </div>
    </nav>
  );
}
