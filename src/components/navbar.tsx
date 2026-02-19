import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import UserProfile from "./user-profile";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-gray-950/70 border-b border-white/5">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link
          href="/"
          prefetch
          className="text-xl font-bold text-white flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            TimeFocusAI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
            So funktioniert{"'"}s
          </Link>
          <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
            Preise
          </Link>
        </div>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-lg px-5">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Anmelden
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-lg px-5 text-sm font-medium glow-button">
                  Kostenlos testen
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
