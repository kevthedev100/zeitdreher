"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import TimeEntryForm from "@/components/time-entry-form";
import HierarchicalNavigation from "@/components/hierarchical-navigation";
import {
  Clock,
  BarChart3,
  Table,
  Plus,
  Settings,
  FolderPlus,
  Bot,
  UserCircle,
  Layers,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Menu,
  X,
  Home,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import AddEntryButton from "@/components/add-entry-button";
import { createClient } from "../../supabase/client";

interface DashboardTabsProps {
  userRole: "manager" | "employee" | "admin";
  isOnboarded?: boolean;
  children?: React.ReactNode;
}

export default function DashboardTabs({
  userRole,
  isOnboarded = false,
  children,
}: DashboardTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showHierarchicalNav, setShowHierarchicalNav] = useState<boolean>(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // State for tracking client-side mounting
  const [mounted, setMounted] = useState(false);

  // Determine active tab from pathname
  const getActiveTabFromPathname = () => {
    const path = pathname.split("/").pop();
    if (!path || path === "dashboard") return "overview";
    return path;
  };

  const activeTab = getActiveTabFromPathname();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if the device is mobile or tablet based on screen width
  useEffect(() => {
    if (!mounted) return;

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Consider devices with width < 1024px as mobile/tablet
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [mounted]);

  const handleActivitySelect = useCallback(
    (areaId: string, fieldId: string, activityId: string) => {
      console.log("Activity selected:", { areaId, fieldId, activityId });
      setSelectedAreaId(areaId);
      setSelectedFieldId(fieldId);
      setSelectedActivityId(activityId);

      // Navigate to new entry tab with URL parameters
      const params = new URLSearchParams({
        area: areaId,
        field: fieldId,
        activity: activityId,
      });

      console.log("Navigating to new-entry with params:", params.toString());
      router.replace(`/dashboard/new-entry?${params.toString()}`);
    },
    [router],
  );

  const handleEditSubmit = (data: any) => {
    // Close the dialog after submission
    setIsEditDialogOpen(false);
    setEditingEntry(null);

    // Dispatch the timeEntryUpdated event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryUpdated", { detail: data }));
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };

  const navigateToTab = (tab: string) => {
    console.log(`Navigating to tab: ${tab}`);
    // Use replace instead of push to avoid stacking history entries
    router.replace(`/dashboard/${tab}`);
  };

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Only show DashboardNavbar on desktop, rely on mobile menu for mobile */}
      <div className="hidden lg:block">
        <DashboardNavbar />
      </div>
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section - Only visible on desktop */}
          <header className="mb-8 hidden lg:block">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Zeitdreher Dashboard
                </h1>
                <p className="text-gray-600">
                  Zeit erfassen, Produktivität analysieren und Arbeitsstunden
                  verwalten
                </p>
              </div>
              <AddEntryButton
                onAddEntry={() => {
                  // This will be handled by the event listener
                  const event = new CustomEvent("openNewEntry");
                  window.dispatchEvent(event);
                }}
              />
            </div>
          </header>

          {/* Mobile Header - Completely isolated from main container */}
          <div className="lg:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b z-30 w-full">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h1 className="text-lg font-bold">Zeitdreher</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToTab("new-entry")}
                className="text-blue-600 px-2 py-1 h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Neu</span>
              </Button>
            </div>
          </div>

          <div className="relative pt-12 lg:pt-0">
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent
                side="left"
                className="w-full max-w-none p-0 border-0"
              >
                <div className="flex flex-col h-full bg-white">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">Zeitdreher</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Menu Content */}
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => {
                          navigateToTab("overview");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Clock className="w-5 h-5" />
                        Übersicht
                      </Button>
                      <Button
                        variant={
                          activeTab === "analytics" ? "secondary" : "ghost"
                        }
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => {
                          navigateToTab("analytics");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <BarChart3 className="w-5 h-5" />
                        Analytik
                      </Button>
                      <Button
                        variant={
                          activeTab === "new-entry" ? "secondary" : "ghost"
                        }
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => {
                          navigateToTab("new-entry");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Plus className="w-5 h-5" />
                        Neuer Eintrag
                      </Button>
                      <Button
                        variant={
                          activeTab === "entries" ? "secondary" : "ghost"
                        }
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => {
                          navigateToTab("entries");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Table className="w-5 h-5" />
                        Alle Einträge
                      </Button>
                      <Link
                        href="/dashboard/ai-chat"
                        passHref
                        className="w-full"
                      >
                        <Button
                          variant={
                            activeTab === "ai-chat" ? "secondary" : "ghost"
                          }
                          className="w-full justify-start gap-2 mb-4 text-left"
                        >
                          <Bot className="w-4 h-4" />
                          AI-Chat
                        </Button>
                      </Link>
                    </div>

                    {/* Categories Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Kategorien
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            setShowHierarchicalNav(!showHierarchicalNav)
                          }
                        >
                          {showHierarchicalNav ? "-" : "+"}
                        </Button>
                      </div>

                      {showHierarchicalNav && (
                        <div className="mb-4">
                          <HierarchicalNavigation
                            onSelectActivity={handleActivitySelect}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Link
                          href="/dashboard/categories"
                          passHref
                          className="w-full"
                        >
                          <Button
                            variant={
                              activeTab === "categories" ? "secondary" : "ghost"
                            }
                            className="w-full justify-start gap-2 mb-4 text-left"
                          >
                            <Layers className="w-4 h-4" />
                            Kategorien verwalten
                          </Button>
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          passHref
                          className="w-full"
                        >
                          <Button
                            variant={
                              activeTab === "profile" ? "secondary" : "ghost"
                            }
                            className="w-full justify-start gap-2 text-left"
                          >
                            <UserCircle className="w-4 h-4" />
                            Profil
                          </Button>
                        </Link>

                        {userRole === "admin" && (
                          <Link
                            href="/dashboard/admin"
                            passHref
                            className="w-full"
                          >
                            <Button
                              variant={
                                activeTab === "admin" ? "secondary" : "ghost"
                              }
                              className="w-full justify-start gap-2 text-left mt-2"
                            >
                              <Shield className="w-4 h-4" />
                              Admin
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Main container */}
            <div className="flex bg-gray-50 pt-0">
              {/* Desktop Sidebar */}
              <nav className="hidden lg:flex flex-col h-fit w-64 p-2 bg-white shadow-sm border-r">
                <Link href="/dashboard/overview" passHref className="w-full">
                  <Button
                    variant={activeTab === "overview" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-2 text-left"
                  >
                    <Clock className="w-4 h-4" />
                    Übersicht
                  </Button>
                </Link>
                <Link href="/dashboard/analytics" passHref className="w-full">
                  <Button
                    variant={activeTab === "analytics" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-2 text-left"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytik
                  </Button>
                </Link>
                <Link href="/dashboard/new-entry" passHref className="w-full">
                  <Button
                    variant={activeTab === "new-entry" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-2 text-left"
                  >
                    <Plus className="w-4 h-4" />
                    Neuer Eintrag
                  </Button>
                </Link>
                <Link href="/dashboard/entries" passHref className="w-full">
                  <Button
                    variant={activeTab === "entries" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-2 text-left"
                  >
                    <Table className="w-4 h-4" />
                    Alle Einträge
                  </Button>
                </Link>
                <Link href="/dashboard/ai-chat" passHref className="w-full">
                  <Button
                    variant={activeTab === "ai-chat" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-4 text-left"
                  >
                    <Bot className="w-4 h-4" />
                    AI-Chat
                  </Button>
                </Link>

                <div className="w-full border-t pt-4 mb-2">
                  <div className="flex items-center justify-between px-3">
                    <h3 className="text-sm font-medium text-gray-500">
                      KATEGORIEN
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setShowHierarchicalNav(!showHierarchicalNav)
                      }
                    >
                      {showHierarchicalNav ? "-" : "+"}
                    </Button>
                  </div>
                </div>

                {showHierarchicalNav && (
                  <div className="mb-4">
                    <HierarchicalNavigation
                      onSelectActivity={handleActivitySelect}
                    />
                  </div>
                )}

                <Link href="/dashboard/categories" passHref className="w-full">
                  <Button
                    variant={activeTab === "categories" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 mb-4 text-left"
                  >
                    <Layers className="w-4 h-4" />
                    Kategorien verwalten
                  </Button>
                </Link>

                <Link href="/dashboard/profile" passHref className="w-full">
                  <Button
                    variant={activeTab === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 text-left"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profil
                  </Button>
                </Link>

                {userRole === "admin" && (
                  <Link href="/dashboard/admin" passHref className="w-full">
                    <Button
                      variant={activeTab === "admin" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2 text-left mt-2"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              </nav>

              {/* Content area */}
              <div className="flex-1 overflow-auto pb-16 lg:pb-0 lg:min-h-screen mt-0">
                {children}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-1 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <Link href="/dashboard/overview" passHref className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
                >
                  <Clock
                    className={`h-5 w-5 ${activeTab === "overview" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[10px] mt-0.5 ${activeTab === "overview" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Übersicht
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/analytics" passHref className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
                >
                  <BarChart3
                    className={`h-5 w-5 ${activeTab === "analytics" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[10px] mt-0.5 ${activeTab === "analytics" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Analytik
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/new-entry" passHref className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none relative"
                >
                  <div
                    className={`absolute -top-3 rounded-full ${activeTab === "new-entry" ? "bg-blue-600" : "bg-blue-500"} p-1.5 shadow-md`}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div className="h-5 w-5"></div>
                  <span
                    className={`text-[10px] mt-0.5 ${activeTab === "new-entry" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Neu
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/entries" passHref className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
                >
                  <Table
                    className={`h-5 w-5 ${activeTab === "entries" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[10px] mt-0.5 ${activeTab === "entries" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Einträge
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/ai-chat" passHref className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
                >
                  <Bot
                    className={`h-5 w-5 ${activeTab === "ai-chat" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[10px] mt-0.5 ${activeTab === "ai-chat" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    AI-Chat
                  </span>
                </Button>
              </Link>
            </div>

            {/* Edit Dialog */}
            <Dialog
              open={isEditDialogOpen}
              onOpenChange={handleEditDialogClose}
            >
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
                </DialogHeader>
                {editingEntry && (
                  <TimeEntryForm
                    onSubmit={handleEditSubmit}
                    editingEntry={editingEntry}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </>
  );
}
