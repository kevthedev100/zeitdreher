"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import TimeEntryForm from "@/components/time-entry-form";
import HierarchicalNavigation from "@/components/hierarchical-navigation";
import {
  Clock,
  BarChart3,
  Table,
  Plus,
  Bot,
  UserCircle,
  Layers,
  Menu,
  X,
  Home,
  Users,
  CreditCard,
  ChevronDown,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface DashboardTabsProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer";
  isOnboarded?: boolean;
  children?: React.ReactNode;
}

const navItems = [
  { id: "overview", label: "Übersicht", icon: Home, href: "/dashboard/overview" },
  { id: "new-entry", label: "Neuer Eintrag", icon: Plus, href: "/dashboard/new-entry" },
  { id: "analytics", label: "Analytik", icon: BarChart3, href: "/dashboard/analytics" },
  { id: "entries", label: "Alle Einträge", icon: Table, href: "/dashboard/entries" },
  { id: "ai-chat", label: "AI-Buddy", icon: Bot, href: "/dashboard/ai-chat" },
];

const categoryItems = [
  { id: "categories", label: "Kategorien", icon: Layers, href: "/dashboard/categories" },
];

const adminItems = [
  { id: "team", label: "Mitglieder", icon: Users, href: "/dashboard/team" },
  { id: "team-performance", label: "Performance", icon: TrendingUp, href: "/dashboard/team-performance" },
];

const settingsItems = [
  { id: "profile", label: "Profil", icon: UserCircle, href: "/dashboard/profile" },
  { id: "plan", label: "Abonnement", icon: CreditCard, href: "/dashboard/plan" },
];

export default function DashboardTabs({
  userRole,
  isOnboarded = false,
  children,
}: DashboardTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHierarchicalNav, setShowHierarchicalNav] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const activeTab = (() => {
    const path = pathname.split("/").pop();
    if (!path || path === "dashboard") return "overview";
    return path;
  })();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data } = await supabase
          .from("users")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (data) setUserName(data.full_name || "");
      }
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const handleOpenNewEntry = () => {
      router.push("/dashboard/new-entry");
    };

    const handleOpenEditDialog = async (event: CustomEvent) => {
      const { entryId } = event.detail;
      if (!entryId) return;

      try {
        const { data: entry, error } = await supabase
          .from("time_entries")
          .select(`*, areas(id, name, color), fields(id, name), activities(id, name), users(full_name, email)`)
          .eq("id", entryId)
          .single();

        if (error) throw error;
        if (entry) {
          setEditingEntry(entry);
          setIsEditDialogOpen(true);
        }
      } catch (error) {
        console.error("Error loading time entry:", error);
      }
    };

    window.addEventListener("openNewEntry", handleOpenNewEntry);
    window.addEventListener("openTimeEntryEditDialog", handleOpenEditDialog as unknown as EventListener);
    document.addEventListener("openTimeEntryEditDialog", handleOpenEditDialog as unknown as EventListener);

    return () => {
      window.removeEventListener("openNewEntry", handleOpenNewEntry);
      window.removeEventListener("openTimeEntryEditDialog", handleOpenEditDialog as unknown as EventListener);
      document.removeEventListener("openTimeEntryEditDialog", handleOpenEditDialog as unknown as EventListener);
    };
  }, [router, supabase]);

  const handleActivitySelect = useCallback(
    (areaId: string, fieldId: string, activityId: string) => {
      const params = new URLSearchParams({ area: areaId, field: fieldId, activity: activityId });
      router.push(`/dashboard/new-entry?${params.toString()}`);
    },
    [router],
  );

  const handleEditSubmit = (data: any) => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    window.dispatchEvent(new CustomEvent("timeEntryUpdated", { detail: data }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const renderNavLink = (item: { id: string; label: string; icon: any; href: string }, closeMobile?: boolean) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={closeMobile ? () => setIsMobileMenuOpen(false) : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? "text-gray-900" : "text-gray-400"}`} />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 flex-shrink-0">
        {mobile && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="mr-1 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">TimeFocusAI</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => renderNavLink(item, mobile))}
        </div>

        {/* Categories */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Kategorien</span>
            <button
              onClick={() => setShowHierarchicalNav(!showHierarchicalNav)}
              className="text-xs text-gray-400 hover:text-gray-600 p-0.5"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHierarchicalNav ? "" : "-rotate-90"}`} />
            </button>
          </div>
          {showHierarchicalNav && (
            <div className="mb-2 px-1">
              <HierarchicalNavigation onSelectActivity={handleActivitySelect} />
            </div>
          )}
          {categoryItems.map((item) => renderNavLink(item, mobile))}
        </div>

        {/* Admin / Geschäftsführer section */}
        {(userRole === "admin" || userRole === "geschaeftsfuehrer") && (
          <div className="mt-6">
            <span className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Team</span>
            <div className="mt-2 space-y-1">
              {adminItems.map((item) => renderNavLink(item, mobile))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-6">
          <span className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Einstellungen</span>
          <div className="mt-2 space-y-1">
            {settingsItems.map((item) => renderNavLink(item, mobile))}
          </div>
        </div>
      </div>

      {/* User section at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{userName || "Benutzer"}</div>
            <div className="text-xs text-gray-400 truncate">{userEmail}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 flex-col border-r border-gray-200 bg-white flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">TimeFocusAI</span>
          </div>
        </div>
        <Link
          href="/dashboard/new-entry"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neu
        </Link>
      </div>

      {/* Mobile Sheet Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-gray-200">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex items-center justify-around h-14">
          {[
            { id: "overview", icon: Home, label: "Home" },
            { id: "analytics", icon: BarChart3, label: "Analytik" },
            { id: "new-entry", icon: Plus, label: "Neu" },
            { id: "entries", icon: Table, label: "Einträge" },
            { id: "ai-chat", icon: Bot, label: "AI-Buddy" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={`/dashboard/${item.id}`}
                className="flex flex-col items-center justify-center flex-1 py-1"
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                <span className={`text-[10px] mt-0.5 ${isActive ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={() => { setIsEditDialogOpen(false); setEditingEntry(null); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <TimeEntryForm onSubmit={handleEditSubmit} editingEntry={editingEntry} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
