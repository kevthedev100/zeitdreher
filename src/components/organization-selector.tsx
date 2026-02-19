"use client";

import { useState, useEffect } from "react";
import { getUserOrganizations } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Users, Calendar, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrganizationSelectorProps {
  onOrganizationSelected?: (organizationId: string) => void;
}

interface Organization {
  organization: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  role: string;
  joined_at: string;
}

export default function OrganizationSelector({
  onOrganizationSelected,
}: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getUserOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = (organizationId: string) => {
    if (onOrganizationSelected) {
      onOrganizationSelected(organizationId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="text-center text-gray-600">
            No Organizations
          </CardTitle>
          <CardDescription className="text-center">
            You don't have any organizations yet. Create one to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Organizations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizations.map((org) => (
          <Card
            key={org.organization.id}
            className="cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => handleSelectOrganization(org.organization.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  {org.organization.name}
                </CardTitle>
                <Badge
                  variant={org.role === "admin" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {org.role}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {org.organization.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(org.organization.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Joined: {new Date(org.joined_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrganizations}
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
