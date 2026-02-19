import Link from "next/link";
import { Twitter, Linkedin, Github, Clock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-white/5">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
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

          {/* Product */}
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
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Unternehmen</h3>
            <ul className="space-y-2.5">
              {["Über uns", "Blog", "Karriere", "Presse"].map((label) => (
                <li key={label}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Ressourcen</h3>
            <ul className="space-y-2.5">
              {["Dokumentation", "Hilfe-Center", "Community", "Status"].map((label) => (
                <li key={label}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Rechtliches</h3>
            <ul className="space-y-2.5">
              {["Datenschutz", "AGB", "Sicherheit", "Cookies"].map((label) => (
                <li key={label}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {label}
                  </Link>
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
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
