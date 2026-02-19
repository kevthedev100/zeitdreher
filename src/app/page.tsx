import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Mic,
  BarChart3,
  Clock,
  Users,
  Play,
  Quote,
  Star,
  Zap,
  Shield,
  ArrowRight,
  TrendingUp,
  Brain,
  MessageCircle,
  Sparkles,
  Lightbulb,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* ─── FEATURE 1: Sprach-Zeiterfassung (Text links, Bild rechts) ─── */}
      <section className="pt-16 pb-24 sm:pt-20 sm:pb-32 bg-white relative overflow-hidden" id="features">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Text */}
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 mb-6">
                <Mic className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Spracheingabe</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Sprach-Zeiterfassung
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Erfasse deine Arbeitszeit durch natürliches Sprechen. Unsere KI versteht dich perfekt und füllt automatisch alle Felder aus.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Präzise Spracherkennung (Deutsch & Englisch)</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Automatische Kategorisierung & Zeitberechnung</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Natürliche Sprache statt Formulare</span>
                </li>
              </ul>
            </div>

            {/* Grafik */}
            <div className="lg:w-1/2 group">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-blue-400/20 rounded-3xl blur-xl transform rotate-2 group-hover:rotate-1 transition-transform duration-500" />
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-400/10 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500" />

                <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl shadow-blue-500/10 border border-blue-100/50">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg h-6 mx-4 flex items-center px-3">
                      <span className="text-[10px] text-gray-400">timefocusai.de/dashboard</span>
                    </div>
                  </div>

                  {/* Recording indicator */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/80">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Aufnahme läuft...</div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">0:12</span>
                  </div>

                  {/* Transcript */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      &ldquo;Heute von 8 bis 11 mit Kunden telefoniert und dabei 53 Kontakte erreicht und 5 Termine gelegt.&rdquo;
                    </p>
                  </div>

                  {/* AI categorization */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/80">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">KI-Kategorisierung</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md font-medium text-xs">Vertrieb</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md font-medium text-xs">Kaltakquise</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium text-xs">Telefonzeit</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 3h Dauer</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-erkannt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE 2: KI-Analyse (Bild links, Text rechts) ─── */}
      <section className="py-24 sm:py-32 bg-gray-50/80 relative overflow-hidden">
        {/* Subtle bg decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Text (rechts) */}
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-6">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">KI-Analyse</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Intelligente Produktivitätsanalyse
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                KI-gestützte Auswertungen erkennen Arbeitsmuster und liefern konkrete Optimierungsvorschläge. Verstehe auf einen Blick, wo deine Zeit wirklich hinfließt.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Automatische Wochen- & Monatsberichte</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Erkennung von Zeitfressern & Mustern</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Handlungsempfehlungen mit Hebelpotenzial</span>
                </li>
              </ul>
            </div>

            {/* Grafik (links) */}
            <div className="lg:w-1/2 group">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 via-blue-500/15 to-emerald-400/20 rounded-3xl blur-xl transform -rotate-2 group-hover:-rotate-1 transition-transform duration-500" />
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-emerald-400/10 rounded-3xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500" />

                <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl shadow-emerald-500/10 border border-emerald-100/50">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg h-6 mx-4 flex items-center px-3">
                      <span className="text-[10px] text-gray-400">timefocusai.de/analytics</span>
                    </div>
                  </div>

                  {/* Stat cards row */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-xl text-center border border-blue-100/50">
                      <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-600">26h</div>
                      <div className="text-[9px] text-gray-500 font-medium">Projektzeit</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-xl text-center border border-emerald-100/50">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-emerald-600">+15%</div>
                      <div className="text-[9px] text-gray-500 font-medium">vs. Vorwoche</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 rounded-xl text-center border border-purple-100/50">
                      <Clock className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-purple-600">4.2h</div>
                      <div className="text-[9px] text-gray-500 font-medium">Fokuszeit/Tag</div>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Wochenübersicht</span>
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">+12% zur Vorwoche</span>
                    </div>
                    <div className="flex items-end gap-2 h-20">
                      {[
                        { h: 40, label: "Mo" },
                        { h: 65, label: "Di" },
                        { h: 50, label: "Mi" },
                        { h: 80, label: "Do" },
                        { h: 60, label: "Fr" },
                        { h: 30, label: "Sa" },
                        { h: 15, label: "So" },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500" style={{ height: `${bar.h}%` }} />
                          <span className="text-[9px] text-gray-400">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="space-y-2.5 mb-4">
                    {[
                      { label: "Vertrieb", pct: 25, color: "bg-red-400" },
                      { label: "Angebote", pct: 35, color: "bg-amber-400" },
                      { label: "Fulfilment", pct: 40, color: "bg-blue-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-600 font-medium">{item.label}</span>
                          <span className="text-gray-400 font-medium">{item.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI suggestion */}
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/80">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-amber-800 mb-0.5">KI-Empfehlung</div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">Automatisiere die Angebotserstellung &ndash; Potenzial: 6h/Woche einsparen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE 3: Lerne dich selbst kennen (Text links, Bild rechts) ─── */}
      <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Text (links) */}
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100 mb-6">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-600">KI-Partner</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Lerne dich selbst kennen
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Dein persönlicher KI-Partner analysiert deine Arbeitsmuster, reflektiert mit dir deine Gedanken und gibt dir gezielte Empfehlungen, die wirklich zu dir passen.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <span>Persönliche Reflexion durch KI-gestützte Gespräche</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <span>Empfehlungen basierend auf deinen echten Daten</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <span>Verstehe, wo deine Energie wirklich hinfließt</span>
                </li>
              </ul>
            </div>

            {/* Grafik (rechts) - Chat-Interface */}
            <div className="lg:w-1/2 group">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-400/20 rounded-3xl blur-xl transform rotate-2 group-hover:rotate-1 transition-transform duration-500" />
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-400/10 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500" />

                <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/50">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Dein KI-Partner</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] text-gray-400">Online &middot; Bereit zu reflektieren</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="space-y-4 mb-5">
                    {/* AI message */}
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-purple-50 rounded-2xl rounded-tl-md p-4 max-w-[85%] border border-purple-100/50">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Mir fällt auf, dass du diese Woche <span className="font-semibold text-purple-700">65% deiner Zeit</span> in Meetings verbringst. Das ist deutlich mehr als letzte Woche. Wie fühlst du dich dabei?
                        </p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex gap-2.5 justify-end">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl rounded-tr-md p-4 max-w-[85%]">
                        <p className="text-sm text-white leading-relaxed">
                          Stimmt, ich komme kaum zum fokussierten Arbeiten. Was schlägst du vor?
                        </p>
                      </div>
                    </div>

                    {/* AI response with recommendation */}
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-purple-50 rounded-2xl rounded-tl-md p-4 max-w-[85%] border border-purple-100/50">
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          Basierend auf deinen Daten habe ich 2 konkrete Ideen:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-purple-100/50">
                            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-600">Blocke Dir-Fr 9-11 Uhr als Fokuszeit &ndash; dort bist du historisch am produktivsten</span>
                          </div>
                          <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-purple-100/50">
                            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-600">3 deiner 12 Meetings lassen sich durch Async-Updates ersetzen</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400 flex-1">Erzähl mir mehr über meine Woche...</span>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 sm:py-32 bg-gray-50/80" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 mb-6">
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">In 3 Schritten starten</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              So einfach funktioniert{"'"}s
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Von der Anmeldung zur produktiven Nutzung in wenigen Minuten
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-20 left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200" />

              {/* Step 1 */}
              <div className="relative text-center group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-300 relative z-10">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Account erstellen</h3>
                <p className="text-gray-500 leading-relaxed">
                  Registriere dich kostenlos, erstelle dein Team und lade Mitarbeiter ein. In 2 Minuten erledigt.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">Kostenlos</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">2 Min</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative text-center group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow duration-300 relative z-10">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Struktur konfigurieren</h3>
                <p className="text-gray-500 leading-relaxed">
                  Richte Bereiche, Felder und Aktivitäten ein. Passe die Kategorien an dein Unternehmen an.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">Anpassbar</span>
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">5 Min</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative text-center group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-shadow duration-300 relative z-10">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Sofort produktiv</h3>
                <p className="text-gray-500 leading-relaxed">
                  Starte mit Spracheingabe oder manuell. Alle Daten werden automatisch analysiert und visualisiert.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">Sofort</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">KI-Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-gray-950 via-[#0a0f1e] to-gray-950 text-white relative overflow-hidden">
        {/* Background clock icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Clock className="w-[500px] h-[500px] text-white" />
        </div>
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 mb-6">
              <Quote className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium text-blue-200">Kundenstimmen</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Erfahre, wie Teams ihre Produktivität mit TimeFocusAI steigern
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Maria Schmidt",
                role: "Projektleiterin, TechStart GmbH",
                initials: "MS",
                gradient: "from-blue-500 to-purple-500",
                quote: "TimeFocusAI hat unsere Zeiterfassung revolutioniert. Die Spracheingabe spart uns täglich 30 Minuten pro Mitarbeiter.",
              },
              {
                name: "Thomas Müller",
                role: "CEO, DesignStudio Pro",
                initials: "TM",
                gradient: "from-emerald-500 to-blue-500",
                quote: "Die KI-Analysen haben uns geholfen, unsere Produktivität um 25% zu steigern. Unglaublich wertvoll!",
              },
              {
                name: "Anna Klein",
                role: "Teamlead, DevCorp Solutions",
                initials: "AK",
                gradient: "from-purple-500 to-pink-500",
                quote: "Endlich eine Zeiterfassung, die nicht nervt! Unsere Entwickler lieben die natürliche Spracheingabe.",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-300 mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className={`w-10 h-10 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="text-gray-400 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "98%", label: "Kundenzufriedenheit" },
              { value: "4.9/5", label: "Bewertung" },
              { value: "500+", label: "Aktive Teams" },
              { value: "24h", label: "Zeitersparnis/Woche" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50/50 to-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 mb-6">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Transparente Preise</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Wähle deinen Plan
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Keine versteckten Gebühren. 14 Tage kostenlos testen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {/* Einzellizenz */}
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-7 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Einzellizenz</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-gray-900">49€</span>
                  <span className="text-gray-400">/Monat</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Perfekt für Freelancer</p>
                <ul className="space-y-3 mb-8">
                  {["Vollständige Zeiterfassung", "KI-Spracheingabe", "Erweiterte KI-Analysen", "Export-Funktionen"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Jetzt starten
              </a>
            </div>

            {/* Team - Popular */}
            <div className="group relative rounded-2xl bg-white p-7 hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden"
              style={{ border: "2px solid transparent", backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <Star className="w-3 h-3 fill-white" />
                  Beliebt
                </div>
                <h3 className="text-lg font-bold mb-1 text-gray-900">Highperformer Team</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-gray-900">299€</span>
                  <span className="text-gray-400">/Monat</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Bis zu 10 Teammitglieder</p>
                <ul className="space-y-3 mb-8">
                  {["Alle Einzellizenz-Features", "Team-Dashboard", "Performance-Analysen", "Kollaborative Berichte", "Basis-Rollenverwaltung"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all glow-button"
              >
                Team starten
              </a>
            </div>

            {/* Organization */}
            <div className="group relative rounded-2xl border border-purple-200 bg-white p-7 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Organization</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-gray-900">599€</span>
                  <span className="text-gray-400">/Monat</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Bis zu 50 Mitarbeiter</p>
                <ul className="space-y-3 mb-8">
                  {["Alle Team-Features", "Erweiterte Team-Analytik", "Abteilungsberichte", "Erweiterte Rollenverwaltung", "Priority Support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Organization starten
              </a>
            </div>

            {/* Enterprise */}
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-7 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-gray-900">Auf Anfrage</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Individuelle Lösungen</p>
                <ul className="space-y-3 mb-8">
                  {["Alle Organization-Features", "Unbegrenzte Nutzer", "Custom Integrationen", "Dedizierter Account Manager", "SLA & 24/7 Support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="mailto:kontakt@timefocusai.de"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Kontakt aufnehmen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-gray-950 via-[#0a0f1e] to-gray-950 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Bereit, deine Produktivität zu{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                transformieren?
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Starte noch heute kostenlos und erlebe, wie KI-gestützte Zeiterfassung dein Team auf das nächste Level bringt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <a
                href="/dashboard"
                className="group inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl transition-all duration-300 text-lg font-semibold glow-button transform hover:-translate-y-0.5"
              >
                Kostenlos starten
                <ArrowUpRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-lg font-medium"
              >
                Preise ansehen
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Keine Kreditkarte</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>14 Tage kostenlos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Jederzeit kündbar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
