"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
} from "@/components/ui/select";
import { createClient } from "../../supabase/client";
import {
  UserCircle,
  Mail,
  Briefcase,
  Check,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategorySetupWizard from "./category-setup-wizard";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Benutzer nicht gefunden");

      // Get profile data from users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Combine auth user data with profile data
      setProfile({
        id: user.id,
        full_name: data?.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || null,
        role: data?.role || "member",
        department: data?.department || "",
        position: data?.position || "",
        phone: data?.phone || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      setErrorMessage("Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
        },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          user_id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          department: profile.department,
          position: profile.position,
          phone: profile.phone,
        })
        .eq("user_id", profile.id);

      if (profileError) throw profileError;

      setSuccessMessage("Profil erfolgreich aktualisiert");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setErrorMessage(error.message || "Fehler beim Speichern des Profils");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Kategorien einrichten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={
                      profile?.avatar_url ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                        profile?.email
                    }
                    alt={profile?.full_name || ""}
                  />
                  <AvatarFallback>
                    {profile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl text-gray-900">
                  {profile?.full_name || "Dein Profil"}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {profile?.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {successMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="flex items-center gap-2 text-gray-900"
                >
                  <UserCircle className="w-4 h-4 text-gray-500" /> Name
                </Label>
                <Input
                  id="full_name"
                  value={profile?.full_name || ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="Dein vollständiger Name"
                  className="border-gray-200 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-gray-900"
                >
                  <Mail className="w-4 h-4 text-gray-500" /> E-Mail
                </Label>
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-gray-50 border-gray-200 rounded-md"
                />
                <p className="text-xs text-gray-500">
                  Die E-Mail-Adresse kann nicht geändert werden.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-900">
                  <Briefcase className="w-4 h-4 text-gray-500" /> Rolle
                </Label>
                <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                  {profile?.role === "admin" ? "Administrator" : "Mitglied"}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="department"
                  className="flex items-center gap-2 text-gray-900"
                >
                  <Briefcase className="w-4 h-4 text-gray-500" /> Abteilung
                </Label>
                <Input
                  id="department"
                  value={profile?.department || ""}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="Deine Abteilung"
                  className="border-gray-200 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="position"
                  className="flex items-center gap-2 text-gray-900"
                >
                  <Briefcase className="w-4 h-4 text-gray-500" /> Position
                </Label>
                <Input
                  id="position"
                  value={profile?.position || ""}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Deine Position"
                  className="border-gray-200 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-gray-900"
                >
                  <Briefcase className="w-4 h-4 text-gray-500" /> Telefon
                </Label>
                <Input
                  id="phone"
                  value={profile?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Deine Telefonnummer"
                  className="border-gray-200 rounded-md"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Speichern...
                  </>
                ) : (
                  "Profil speichern"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <CategorySetupWizard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
