import Hero from "@/components/hero";
import LandingNavbar from "@/components/landing-navbar";
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
  Play,
  Quote,
  Star,
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
      <LandingNavbar />
      <Hero />

      {/* Feature Sections with Alternating Layout */}
      <section className="py-24 bg-[#F8FAFE]">
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
                      "Heute von 8 bis 11 mit Kunden telefoniert und dabei 53 Kontakte erreicht und 5 Termine gelegt. Hatte Schwierigkeiten mit der Erreichbarkeit."
                    </p>
                    <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Clock className="w-4 h-4" />
                        <span>Automatisch kategorisiert: Vertrieb > Kaltakquise > Telefonzeit</span>
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
                      <div className="text-xl font-bold text-blue-600">26h</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Clock className="w-8 h-8 text-green-600 mb-2" />
                      <div className="text-sm text-gray-600">Diese Woche</div>
                      <div className="text-xl font-bold text-green-600">
                        19h
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vertrieb</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Angebotserstellung</span>
                        <span>30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: "35%" }}
                        ></div>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fullfilment</span>
                        <span>40%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                    </div>
                
                    <div className="p-2 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                      <div className="font-medium">KI-Optimierungsvorschlag:</div>
                      <div>Vorschlag: Verwende einen Make.com Workflow für die erstellung von Angeboten. Hier zum Beispiel.</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg text-sm text-green-700">
                      <div className="font-medium">KI-Erkenntnis:</div>
                      <div>Produktivitätssteigerung von 15% im Vergleich zur Vorwoche durch den Einsatz von Chatgpt prompts für E-Mails</div>
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
                identifizieren Produktivitätsmuster, erkennen Potentiale und
                geben konkrete Vorschläge zur Optimierung Ihrer Arbeitsabläufe.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tägliche und wöchentliche KI-Zusammenfassungen</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Erkennung von Arbeitsabläufen</span>
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
                Für Einzelnutzer oder Teams mit rollenbasierter Zugriffskontrolle
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

      {/* Customer Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white relative overflow-hidden">
        {/* Logo icon in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <div className="w-[600px] h-[600px] rotate-12 flex items-center justify-center">
            <Clock className="w-[400px] h-[400px] text-white" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 mb-6">
              <Quote className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium text-blue-100">
                Kundenstimmen
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Das sagen Nutzer von Zeitdreher
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto text-lg">
              Erfahren Sie, wie unsere Kunden ihre Produktivität mit Zeitdreher revolutioniert haben
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Video Testimonial 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="relative mb-6">
                <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center group cursor-pointer hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">MS</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Maria Schmidt</h3>
                    <p className="text-blue-200 text-sm">Projektleiterin, TechStart GmbH</p>
                  </div>
                </div>
                <blockquote className="text-gray-300 italic">
                  "Zeitdreher hat unsere Zeiterfassung revolutioniert. Die Spracheingabe spart uns täglich 30 Minuten pro Mitarbeiter."
                </blockquote>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-yellow-400 text-sm ml-2">5.0</span>
                </div>
              </div>
            </div>

            {/* Video Testimonial 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="relative mb-6">
                <div className="aspect-video bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-xl flex items-center justify-center group cursor-pointer hover:from-green-600/30 hover:to-blue-600/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">TM</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Thomas Müller</h3>
                    <p className="text-blue-200 text-sm">CEO, DesignStudio Pro</p>
                  </div>
                </div>
                <blockquote className="text-gray-300 italic">
                  "Die KI-Analysen haben uns geholfen, unsere Produktivität um 25% zu steigern. Unglaublich wertvoll!"
                </blockquote>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-yellow-400 text-sm ml-2">5.0</span>
                </div>
              </div>
            </div>

            {/* Video Testimonial 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="relative mb-6">
                <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl flex items-center justify-center group cursor-pointer hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AK</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Anna Klein</h3>
                    <p className="text-blue-200 text-sm">Teamlead, DevCorp Solutions</p>
                  </div>
                </div>
                <blockquote className="text-gray-300 italic">
                  "Endlich eine Zeiterfassung, die nicht nervt! Unsere Entwickler lieben die natürliche Spracheingabe."
                </blockquote>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-yellow-400 text-sm ml-2">5.0</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-blue-200 text-sm">Kundenzufriedenheit</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">4.9/5</div>
              <div className="text-blue-200 text-sm">Durchschnittsbewertung</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">150+</div>
              <div className="text-blue-200 text-sm">Positive Bewertungen</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">24h</div>
              <div className="text-blue-200 text-sm">Durchschn. Zeitersparnis/Woche</div>
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
                              <span className="font-medium">Vertrieb</span>
                              <span className="ml-auto text-sm text-gray-500">
                                Kaltakquise, Angebotserstellung
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="font-medium">Fullfilment</span>
                              <span className="ml-auto text-sm text-gray-500">
                                Projektzeit, Produktion, Sonstiges
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-medium">Management</span>
                              <span className="ml-auto text-sm text-gray-500">
                                Meetings, Planung, E-Mails
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
                              <span>"Heute von 8 bis 12 am Projekt XY gearbeitet"</span>
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
      <section className="py-24 bg-white">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-xl transform rotate-2 translate-x-2 translate-y-2"></div>
              <div className="relative bg-white p-8 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Sprach- oder manuelle Eingabe
                </h3>
                <p className="text-gray-600 mb-4">
                  Erfassen Sie Zeiteinträge durch natürliches Sprechen und lassen sie ihre zeiteinträge automatisch zuordnen
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• OpenAI Whisper Transkription</li>
                  <li>• Bereich → Feld → Aktivität Struktur</li>
                  <li>• Dauer, Datum und Beschreibungen</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-green-600/30 rounded-xl transform -rotate-1 translate-x-1 translate-y-1"></div>
              <div className="relative bg-white p-8 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  KI-gestützte Produktivitätsanalyse
                </h3>
                <p className="text-gray-600 mb-4">
                  Intelligente KI-Analysen erkennen Arbeitsmuster und liefern konkrete Optimierungsvorschläge.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• KI-Zusammenfassungen</li>
                  <li>• Workflow-Optimierung</li>
                  <li>• Personalisierte Empfehlungen</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-purple-600/30 rounded-xl transform rotate-1 translate-x-1 translate-y-2"></div>
              <div className="relative bg-white p-8 rounded-xl shadow-md">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 relative hover:border-blue-300 transition-colors">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">0€</div>
                <p className="text-gray-600 mb-6">2 Wochen kostenlos testen</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Grundlegende Zeiterfassung</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Spracheingabe</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Basis-Analytik</span>
                  </li>
                </ul>
                <a
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Kostenlos testen
                </a>
              </div>
            </div>

            {/* Single User Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 relative hover:border-blue-300 transition-colors">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Single User</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">50€</div>
                <p className="text-gray-600 mb-6">Pro Monat für Einzelnutzer</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Alle Free-Features</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Erweiterte KI-Analysen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Unbegrenzte Zeiteinträge</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Export-Funktionen</span>
                  </li>
                </ul>
                <a
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Jetzt starten
                </a>
              </div>
            </div>

            {/* Team Plan */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 relative hover:border-blue-600 transition-colors">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Beliebt
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Team</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">299€</div>
                <p className="text-gray-600 mb-6">Pro Monat für bis zu 5 Mitarbeiter</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Alle Single User-Features</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Team-Dashboard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Kollaborative Berichte</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Basis-Rollenverwaltung</span>
                  </li>
                </ul>
                <a
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Team starten
                </a>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 relative hover:border-purple-300 transition-colors">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Auf Anfrage</div>
                <p className="text-gray-600 mb-6">Für größere Teams mit erweiterten Rollen</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Alle Team-Features</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Unbegrenzte Nutzer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Erweiterte Rollenverwaltung</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Dedizierter Support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Custom Integrationen</span>
                  </li>
                </ul>
                <a
                  href="mailto:kontakt@zeitdreher.de"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                >
                  Kontakt aufnehmen
                </a>
              </div>
            </div>
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
