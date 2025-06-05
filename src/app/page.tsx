import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Mic,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Feature Sections with Alternating Layout */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Voice Recording Feature */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6">
                    <Mic className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                      <div className="w-3/4 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 italic">
                      "Heute 3 Stunden an Projekt Alpha gearbeitet..."
                    </p>
                    <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Clock className="w-4 h-4" />
                        <span>Automatisch kategorisiert: Entwicklung > Frontend > Implementierung</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="text-blue-600 mb-4">
                <Mic className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-6">Sprach-Zeiterfassung</h2>
              <p className="text-xl text-gray-600 mb-6">
                Erfassen Sie Ihre Arbeitszeit natürlich durch das Einsprechen
                von dem was Sie gemacht haben. Unsere KI-gestützte
                Spracherkennung versteht Sie perfekt und füllt automatisch alle
                Felder aus. Einfach und schnell - Sodass Zeiterfassung nicht zum
                Zeitaufwand wird...
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Präzise Genauigkeit bei der Spracherkennung</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Automatische Kategorisierung und Zeitberechnung</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>
                    Unterstützt natürliche Sprache in Deutsch und Englisch
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Analytics Feature - Reversed Layout */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mb-32">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl transform -rotate-3"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
                      <div className="text-sm text-gray-600">Projektzeit</div>
                      <div className="text-xl font-bold text-blue-600">24h</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Clock className="w-8 h-8 text-green-600 mb-2" />
                      <div className="text-sm text-gray-600">Diese Woche</div>
                      <div className="text-xl font-bold text-green-600">
                        42h
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Entwicklung</span>
                        <span>60%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Design</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg text-sm text-green-700">
                      <div className="font-medium">KI-Erkenntnis:</div>
                      <div>Produktivitätssteigerung von 15% im Vergleich zur Vorwoche</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="text-green-600 mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Entdecke das Optimierungspotenzial durch den Einsatz von KI
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Verstehen Sie, wie Ihre Zeit investiert wird und wo
                Verbesserungspotenzial liegt. KI-gestützte Auswertungen
                identifizieren Produktivitätsmuster, erkennen Kontextwechsel und
                geben konkrete Vorschläge zur Optimierung Ihrer Arbeitsabläufe.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tägliche und wöchentliche KI-Zusammenfassungen</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Erkennung von Kontextwechseln und Fokuszeiten</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>
                    Personalisierte Vorschläge zur Produktivitätssteigerung
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Team Management Feature */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl transform rotate-2"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Team Alpha</div>
                        <div className="text-sm text-gray-500">
                          5 Mitarbeiter
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        187h
                      </div>
                      <div className="text-sm text-gray-500">Diese Woche</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["Manager", "Entwickler", "Designer"].map((role, i) => (
                      <div
                        key={role}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{role}</span>
                        <span className="text-sm font-medium">
                          {[45, 38, 42][i]}h
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Manager-Ansicht</span>
                      </div>
                      <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        Vollzugriff
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Mitarbeiter-Ansicht</span>
                      </div>
                      <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        Eingeschränkt
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="text-purple-600 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Rollenbasierte Zugriffskontrolle
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Sichere und intelligente Zugriffskontrolle sorgt dafür, dass
                jeder die richtigen Informationen zur richtigen Zeit sieht.
                Manager erhalten Unternehmensübersichten, Mitarbeiter
                fokussieren sich auf ihre Arbeit.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Manager: Vollständige Unternehmensansicht</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>
                    Mitarbeiter: Persönliche Zeiterfassung und Statistiken
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Sichere Datentrennung und Compliance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Vertrauen Sie auf bewährte Ergebnisse
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Tausende von Teams weltweit nutzen bereits Zeitdreher für ihre
              Zeiterfassung
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-2">10.000+</div>
              <div className="text-blue-100">Täglich erfasste Stunden</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Spracherkennungsgenauigkeit</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Teams nutzen Zeitdreher</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support & Verfügbarkeit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Section - Redesigned */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200/50 mb-6">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">
                Schnelle Implementation
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Von der Anmeldung zur produktiven Nutzung
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Zeitdreher ist in wenigen Minuten einsatzbereit. Folgen Sie
              unserem bewährten Prozess für eine reibungslose Einführung.
            </p>
          </div>

          {/* Interactive Timeline */}
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Central timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full hidden lg:block"></div>

              {/* Step Cards */}
              <div className="space-y-16 lg:space-y-24">
                {/* Step 1 - Account Setup */}
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  <div className="lg:w-1/2 lg:pr-16">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            1
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Account erstellen
                          </h3>
                          <p className="text-blue-600 font-medium">2 Minuten</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Registrieren Sie sich kostenlos und erstellen Sie Ihr
                        Unternehmenskonto. Laden Sie Teammitglieder ein und
                        definieren Sie Rollen.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Kostenlos
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Team-Einladungen
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Rollenverwaltung
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 lg:pl-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl transform rotate-3"></div>
                      <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Ihr Unternehmen
                              </div>
                              <div className="text-sm text-gray-500">
                                5 Teammitglieder eingeladen
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-sm text-gray-600">
                                Manager
                              </div>
                              <div className="font-semibold text-blue-600">
                                2
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-sm text-gray-600">
                                Mitarbeiter
                              </div>
                              <div className="font-semibold text-green-600">
                                3
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 - Configuration */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16">
                  <div className="lg:w-1/2 lg:pl-16">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            2
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Struktur konfigurieren
                          </h3>
                          <p className="text-purple-600 font-medium">
                            5 Minuten
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Richten Sie Arbeitsbereiche, Felder und Aktivitäten ein.
                        Passen Sie die Kategorien an Ihre Unternehmensstruktur
                        an.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          Bereiche
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          Aktivitäten
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          Anpassbar
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 lg:pr-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl transform -rotate-3"></div>
                      <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <div className="font-semibold text-gray-900">
                              Projekt-Struktur
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="font-medium">Entwicklung</span>
                              <span className="ml-auto text-sm text-gray-500">
                                Frontend, Backend, Testing
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="font-medium">Design</span>
                              <span className="ml-auto text-sm text-gray-500">
                                UI, UX, Prototyping
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-medium">Management</span>
                              <span className="ml-auto text-sm text-gray-500">
                                Meetings, Planung
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 - Go Live */}
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  <div className="lg:w-1/2 lg:pr-16">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            3
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Sofort produktiv
                          </h3>
                          <p className="text-green-600 font-medium">
                            Sofort einsatzbereit
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Ihre Mitarbeiter können sofort mit der Zeiterfassung
                        beginnen. Spracheingabe oder manuell - alle Daten werden
                        automatisch visualisiert.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Spracheingabe
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Live-Dashboards
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Sofort nutzbar
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 lg:pl-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-3xl transform rotate-2"></div>
                      <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <div className="font-semibold text-gray-900">
                              Live Dashboard
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-blue-600">
                                24h
                              </div>
                              <div className="text-sm text-blue-700">
                                Diese Woche
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-green-600">
                                94%
                              </div>
                              <div className="text-sm text-green-700">
                                Produktivität
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                              <Mic className="w-4 h-4" />
                              <span>"Heute 3 Stunden React Development"</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bereit für den Start?
              </h3>
              <p className="text-gray-600 mb-6">
                Schließen Sie sich über 500 Teams an, die bereits mit Zeitdreher
                ihre Produktivität steigern.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-2xl transform hover:-translate-y-2 bg-size-200 hover:bg-pos-100"
                style={{
                  backgroundSize: "200% 100%",
                  backgroundPosition: "0% 0%",
                }}
              >
                Jetzt kostenlos starten
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </a>
              <p className="text-sm text-gray-500 mt-4">
                Keine Kreditkarte erforderlich • 14 Tage kostenlos testen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              So funktioniert Zeitdreher
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Einfache, intuitive Zeiterfassung, die sich an Ihren Arbeitsablauf
              anpasst
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Sprach- oder manuelle Eingabe
              </h3>
              <p className="text-gray-600 mb-4">
                Erfassen Sie Zeiteinträge durch natürliches Sprechen oder mit
                unserem intuitiven Formular mit kaskadierten Dropdown-Menüs.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• OpenAI Whisper Transkription</li>
                <li>• Bereich → Feld → Aktivität Struktur</li>
                <li>• Dauer, Datum und Beschreibungen</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Interaktive Analytik
              </h3>
              <p className="text-gray-600 mb-4">
                Visualisieren Sie die Zeitverteilung mit schönen Diagrammen und
                umfassenden Berichten.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Kreisdiagramme für Zeitaufschlüsselung</li>
                <li>• Balkendiagramme für Trends</li>
                <li>• Filter- und Sortieroptionen</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Rollenbasierte Zugriffskontrolle
              </h3>
              <p className="text-gray-600 mb-4">
                Sichere Zugriffskontrolle stellt sicher, dass die richtigen
                Personen die richtigen Daten sehen.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Manager: Unternehmensweite Ansicht</li>
                <li>• Mitarbeiter: Nur persönliche Einträge</li>
                <li>• Farbkodierte Übersichtstabellen</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Einfache, transparente Preise
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Wählen Sie den perfekten Plan für Ihre Bedürfnisse. Keine
              versteckten Gebühren.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Bereit, die Zeiterfassung zu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                revolutionieren?
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Schließen Sie sich über 500 Teams an, die ihren Arbeitsablauf mit
              sprachgestützter Zeiterfassung und intelligenter Analytik bereits
              revolutioniert haben. Starten Sie noch heute kostenlos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Kostenlos starten
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium shadow-md border border-gray-200"
              >
                Preise ansehen
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Keine Kreditkarte erforderlich</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>14 Tage kostenlos testen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
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
