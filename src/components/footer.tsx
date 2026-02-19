"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github, Clock } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showPopup, setShowPopup] = useState(false);

  const handleDeadLink = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  const liveLinks = new Set(["Features", "Preise", "Dashboard"]);

  return (
    <footer className="bg-gray-950 border-t border-white/5">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Diese Seite ist bald verfügbar</h3>
            <p className="text-gray-500 text-sm mb-6">Danke für Ihre Geduld</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">TimeFocusAI</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              KI-gestützte Zeiterfassung für Teams, die ihre Produktivität maximieren wollen.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Produkt</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Features", href: "#features" },
                { label: "Preise", href: "#pricing" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "API", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  {liveLinks.has(link.label) ? (
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href="#" onClick={handleDeadLink} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Unternehmen</h3>
            <ul className="space-y-2.5">
              {["Über uns", "Blog", "Karriere", "Presse"].map((label) => (
                <li key={label}>
                  <a href="#" onClick={handleDeadLink} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Ressourcen</h3>
            <ul className="space-y-2.5">
              {["Dokumentation", "Hilfe-Center", "Community", "Status"].map((label) => (
                <li key={label}>
                  <a href="#" onClick={handleDeadLink} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Rechtliches</h3>
            <ul className="space-y-2.5">
              {["Datenschutz", "AGB", "Sicherheit", "Cookies"].map((label) => (
                <li key={label}>
                  <a href="#" onClick={handleDeadLink} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            &copy; {currentYear} TimeFocusAI. Alle Rechte vorbehalten.
          </div>

          <div className="flex space-x-5">
            <a href="#" onClick={handleDeadLink} className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" onClick={handleDeadLink} className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" onClick={handleDeadLink} className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
