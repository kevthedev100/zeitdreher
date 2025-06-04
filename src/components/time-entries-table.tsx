"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Calendar, Clock } from "lucide-react";

interface TimeEntry {
  id: number;
  employee: string;
  area: string;
  field: string;
  activity: string;
  duration: number;
  date: string;
  description: string;
  status: "approved" | "pending" | "rejected";
}

interface TimeEntriesTableProps {
  userRole?: "manager" | "employee";
}

export default function TimeEntriesTable({
  userRole = "employee",
}: TimeEntriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock data
  const timeEntries: TimeEntry[] = [
    {
      id: 1,
      employee: "Max Mustermann",
      area: "Entwicklung",
      field: "Frontend",
      activity: "React Entwicklung",
      duration: 4.5,
      date: "2024-01-15",
      description:
        "Zeiterfassungsformular mit Spracheingabe-Funktionalität implementiert",
      status: "approved",
    },
    {
      id: 2,
      employee: "Anna Schmidt",
      area: "Design",
      field: "UI Design",
      activity: "Wireframing",
      duration: 3.0,
      date: "2024-01-15",
      description: "Wireframes für Dashboard-Analytik-Bereich erstellt",
      status: "pending",
    },
    {
      id: 3,
      employee: "Max Mustermann",
      area: "Entwicklung",
      field: "Backend",
      activity: "API Entwicklung",
      duration: 2.5,
      date: "2024-01-14",
      description: "REST-Endpunkte für Zeiteintrag-CRUD-Operationen erstellt",
      status: "approved",
    },
    {
      id: 4,
      employee: "Michael Weber",
      area: "Management",
      field: "Meetings",
      activity: "Team Standup",
      duration: 0.5,
      date: "2024-01-14",
      description: "Tägliches Team-Standup-Meeting",
      status: "approved",
    },
    {
      id: 5,
      employee: "Sarah Müller",
      area: "Marketing",
      field: "Content",
      activity: "Blog Schreiben",
      duration: 2.0,
      date: "2024-01-13",
      description:
        "Blog-Artikel über Zeiterfassungs-Best-Practices geschrieben",
      status: "rejected",
    },
    {
      id: 6,
      employee: "Max Mustermann",
      area: "Entwicklung",
      field: "Testing",
      activity: "Unit Testing",
      duration: 1.5,
      date: "2024-01-13",
      description: "Unit-Tests für Zeiteintrag-Validierung hinzugefügt",
      status: "pending",
    },
  ];

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      Entwicklung: "bg-blue-100 text-blue-800",
      Design: "bg-purple-100 text-purple-800",
      Marketing: "bg-green-100 text-green-800",
      Management: "bg-orange-100 text-orange-800",
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Filter entries based on user role
  const filteredEntries = timeEntries
    .filter((entry) => {
      if (userRole === "employee") {
        // Employee only sees their own entries
        return entry.employee === "Max Mustermann";
      }
      return true; // Manager sees all entries
    })
    .filter((entry) => {
      const matchesSearch =
        entry.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.employee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = filterArea === "all" || entry.area === filterArea;
      return matchesSearch && matchesArea;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "duration":
          aValue = a.duration;
          bValue = b.duration;
          break;
        case "employee":
          aValue = a.employee;
          bValue = b.employee;
          break;
        default:
          aValue = a.activity;
          bValue = b.activity;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalHours = filteredEntries.reduce(
    (sum, entry) => sum + entry.duration,
    0,
  );
  const areas = [...new Set(timeEntries.map((entry) => entry.area))];

  return (
    <div className="bg-white p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Zeiteinträge Übersicht
              </CardTitle>
              <CardDescription>
                {userRole === "manager"
                  ? "Alle Team-Zeiteinträge mit Filter- und Sortierfunktionen"
                  : "Ihre Zeiteinträge mit Filter- und Sortierfunktionen"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {totalHours.toFixed(1)}h gesamt
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Aktivitäten, Beschreibungen oder Mitarbeiter suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Nach Bereich filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Bereiche</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Datum</SelectItem>
                <SelectItem value="duration">Dauer</SelectItem>
                <SelectItem value="activity">Aktivität</SelectItem>
                {userRole === "manager" && (
                  <SelectItem value="employee">Mitarbeiter</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Aktivität</th>
                  <th className="text-left py-3 font-medium">Bereich</th>
                  {userRole === "manager" && (
                    <th className="text-left py-3 font-medium">Mitarbeiter</th>
                  )}
                  <th className="text-left py-3 font-medium">Dauer</th>
                  <th className="text-left py-3 font-medium">Datum</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{entry.activity}</div>
                        <div className="text-sm text-gray-500">
                          {entry.field}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge
                        variant="secondary"
                        className={getAreaColor(entry.area)}
                      >
                        {entry.area}
                      </Badge>
                    </td>
                    {userRole === "manager" && (
                      <td className="py-4 font-medium">{entry.employee}</td>
                    )}
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{entry.duration}h</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{entry.date}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(entry.status)}
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-4 max-w-xs">
                      <p
                        className="text-sm text-gray-600 truncate"
                        title={entry.description}
                      >
                        {entry.description}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Keine Zeiteinträge gefunden, die Ihren Kriterien entsprechen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
