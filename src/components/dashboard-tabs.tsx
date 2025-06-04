"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/time-entry-form";
import TimeAnalyticsDashboard from "@/components/time-analytics-dashboard";
import TimeEntriesTable from "@/components/time-entries-table";
import CategoryManagement from "@/components/category-management";
import {
  Clock,
  BarChart3,
  Table,
  Plus,
  Settings,
  FolderPlus,
} from "lucide-react";
import { useCallback } from "react";

interface DashboardTabsProps {
  userRole: "manager" | "employee";
}

export default function DashboardTabs({ userRole }: DashboardTabsProps) {
  const handleTimeEntrySubmit = useCallback((data: any) => {
    console.log("Time entry submitted:", data);
    // In a real app, this would save to the database
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Tabs
        defaultValue="analytics"
        className="flex w-full"
        orientation="vertical"
      >
        <TabsList className="flex flex-col h-fit w-64 p-2 bg-white shadow-sm border-r">
          <TabsTrigger
            value="analytics"
            className="w-full justify-start gap-2 mb-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytik
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="w-full justify-start gap-2 mb-4"
          >
            <Clock className="w-4 h-4" />
            Übersicht
          </TabsTrigger>

          <div className="w-full border-t pt-4 mb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-3">
              BEREICHE
            </h3>
          </div>

          <TabsTrigger
            value="development"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Entwicklung
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="w-full justify-start gap-2 mb-4"
          >
            <Settings className="w-4 h-4" />
            Management
          </TabsTrigger>

          <TabsTrigger
            value="categories"
            className="w-full justify-start gap-2 mb-4"
          >
            <FolderPlus className="w-4 h-4" />
            Kategorien verwalten
          </TabsTrigger>

          <TabsTrigger
            value="new-entry"
            className="w-full justify-start gap-2 mb-2"
          >
            <Plus className="w-4 h-4" />
            Neuer Eintrag
          </TabsTrigger>
          <TabsTrigger value="entries" className="w-full justify-start gap-2">
            <Table className="w-4 h-4" />
            Alle Einträge
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="analytics" className="p-6">
            <TimeAnalyticsDashboard userRole={userRole} />
          </TabsContent>

          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Schnellstatistiken
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Heutige Stunden</span>
                    <span className="font-semibold text-2xl">7,5h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Diese Woche</span>
                    <span className="font-semibold text-2xl">38,25h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dieser Monat</span>
                    <span className="font-semibold text-2xl">142,5h</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Letzte Aktivitäten
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">React Entwicklung</p>
                      <p className="text-sm text-gray-600">vor 2 Stunden</p>
                    </div>
                    <span className="text-blue-600 font-semibold">3,5h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Team Meeting</p>
                      <p className="text-sm text-gray-600">vor 4 Stunden</p>
                    </div>
                    <span className="text-green-600 font-semibold">1,0h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium">Code Review</p>
                      <p className="text-sm text-gray-600">Gestern</p>
                    </div>
                    <span className="text-purple-600 font-semibold">2,0h</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="development" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">
                Entwicklung - Bereiche
              </h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den
                Entwicklungsbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="development"
              />
            </div>
          </TabsContent>

          <TabsContent value="design" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Design - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Designbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="design"
              />
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Marketing - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Marketingbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="marketing"
              />
            </div>
          </TabsContent>

          <TabsContent value="management" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Management - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Managementbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="management"
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-0">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="new-entry" className="p-6">
            <TimeEntryForm onSubmit={handleTimeEntrySubmit} />
          </TabsContent>

          <TabsContent value="entries" className="p-6">
            <TimeEntriesTable userRole={userRole} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
