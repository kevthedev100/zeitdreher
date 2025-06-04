"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  PieChart,
  Clock,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

interface AnalyticsDashboardProps {
  userRole?: "manager" | "employee";
}

export default function TimeAnalyticsDashboard({
  userRole = "employee",
}: AnalyticsDashboardProps) {
  // Mock data for demonstration
  const timeData = {
    totalHours: 42.5,
    thisWeek: 38.25,
    lastWeek: 35.75,
    avgDaily: 7.5,
    topActivity: "React Development",
    productivity: 94,
  };

  const areaBreakdown = [
    { name: "Entwicklung", hours: 28.5, percentage: 67, color: "bg-blue-500" },
    { name: "Meetings", hours: 8.0, percentage: 19, color: "bg-green-500" },
    { name: "Planung", hours: 4.0, percentage: 9, color: "bg-purple-500" },
    { name: "Testing", hours: 2.0, percentage: 5, color: "bg-orange-500" },
  ];

  const weeklyTrend = [
    { day: "Mon", hours: 8.5 },
    { day: "Tue", hours: 7.25 },
    { day: "Wed", hours: 8.0 },
    { day: "Thu", hours: 6.75 },
    { day: "Fri", hours: 7.75 },
  ];

  const recentEntries = [
    {
      id: 1,
      activity: "React Entwicklung",
      duration: 3.5,
      date: "2024-01-15",
      area: "Entwicklung",
    },
    {
      id: 2,
      activity: "Team Meeting",
      duration: 1.0,
      date: "2024-01-15",
      area: "Meetings",
    },
    {
      id: 3,
      activity: "Code Review",
      duration: 2.0,
      date: "2024-01-14",
      area: "Entwicklung",
    },
    {
      id: 4,
      activity: "Sprint Planung",
      duration: 1.5,
      date: "2024-01-14",
      area: "Planung",
    },
    {
      id: 5,
      activity: "Bug Fixing",
      duration: 2.5,
      date: "2024-01-13",
      area: "Entwicklung",
    },
  ];

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      Entwicklung: "bg-blue-100 text-blue-800",
      Meetings: "bg-green-100 text-green-800",
      Planung: "bg-purple-100 text-purple-800",
      Testing: "bg-orange-100 text-orange-800",
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zeit-Analytik</h1>
            <p className="text-gray-600 mt-1">
              {userRole === "manager"
                ? "Unternehmensweite Zeiterfassungsübersicht"
                : "Ihr persönliches Zeiterfassungs-Dashboard"}
            </p>
          </div>
          <Badge
            variant={userRole === "manager" ? "default" : "secondary"}
            className="text-sm"
          >
            {userRole === "manager" ? "Manager-Ansicht" : "Mitarbeiter-Ansicht"}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamtstunden
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timeData.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Dieser Monat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timeData.thisWeek}h</div>
              <p className="text-xs text-green-600">
                +{(timeData.thisWeek - timeData.lastWeek).toFixed(2)}h seit
                letzter Woche
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tagesdurchschnitt
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timeData.avgDaily}h</div>
              <p className="text-xs text-muted-foreground">Pro Arbeitstag</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top-Aktivität
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {timeData.topActivity}
              </div>
              <p className="text-xs text-muted-foreground">
                Meiste Zeit verbracht
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Zeitverteilung nach Bereichen
              </CardTitle>
              <CardDescription>
                Aufschlüsselung der Stunden nach verschiedenen Arbeitsbereichen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {areaBreakdown.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${area.color}`}></div>
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{area.hours}h</div>
                      <div className="text-sm text-gray-500">
                        {area.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simple visual representation */}
              <div className="mt-6">
                <div className="flex h-4 rounded-full overflow-hidden">
                  {areaBreakdown.map((area, index) => (
                    <div
                      key={index}
                      className={area.color}
                      style={{ width: `${area.percentage}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trend Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Wöchentlicher Stunden-Trend
              </CardTitle>
              <CardDescription>
                Täglich gearbeitete Stunden diese Woche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyTrend.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(day.hours / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12">
                          {day.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Zeiteinträge</CardTitle>
            <CardDescription>
              {userRole === "manager"
                ? "Neueste Einträge aller Teammitglieder"
                : "Ihre letzten Zeiteinträge"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Aktivität</th>
                    <th className="text-left py-2 font-medium">Bereich</th>
                    <th className="text-left py-2 font-medium">Dauer</th>
                    <th className="text-left py-2 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{entry.activity}</td>
                      <td className="py-3">
                        <Badge
                          variant="secondary"
                          className={getAreaColor(entry.area)}
                        >
                          {entry.area}
                        </Badge>
                      </td>
                      <td className="py-3">{entry.duration}h</td>
                      <td className="py-3 text-gray-600">{entry.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
