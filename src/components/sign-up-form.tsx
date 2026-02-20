"use client";

import { useState } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signUpAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Users } from "lucide-react";

interface SignUpFormProps {
  searchParams: Message & {
    invitation?: string;
    role?: string;
    token?: string;
    email?: string;
    org?: string;
    admin_invitation?: string;
    full_name?: string;
  };
}

export default function SignUpForm({ searchParams }: SignUpFormProps) {
  const [usageType, setUsageType] = useState<"einzelnutzer" | "team" | null>(null);

  const isInvitation = searchParams.invitation;
  const invitationRole = searchParams.role || "member";
  const invitationToken = searchParams.token;
  const invitationEmail = searchParams.email;
  const organizationId = searchParams.org;
  const adminInvitationId = searchParams.admin_invitation;
  const adminInvitationFullName = searchParams.full_name;
  const isAdminInvitation = !!adminInvitationId;

  const isInvited = isInvitation || isAdminInvitation;

  return (
    <div className="w-full max-w-md">
      {isAdminInvitation && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Willkommen im Team!
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                Volle Lizenz
              </Badge>
            </CardTitle>
            <CardDescription>
              Ihr Administrator hat ein Konto für Sie erstellt.
              Schließen Sie die Registrierung ab, um Ihr Konto zu aktivieren.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {isInvitation && !isAdminInvitation && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Team-Einladung
              <Badge variant="secondary">{invitationRole === "member" ? "Mitglied" : invitationRole}</Badge>
            </CardTitle>
            <CardDescription>
              Sie wurden eingeladen, dem Team beizutreten.
              Schließen Sie die Registrierung ab, um zu starten.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form className="flex flex-col space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isAdminInvitation
                ? "Konto aktivieren"
                : isInvitation
                  ? "Einladung annehmen"
                  : "Registrieren"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdminInvitation ? (
                "Legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren."
              ) : isInvitation ? (
                "Schließen Sie Ihre Registrierung ab, um dem Team beizutreten."
              ) : (
                <>
                  Bereits ein Konto?{" "}
                  <Link
                    className="text-primary font-medium hover:underline transition-all"
                    href="/sign-in"
                  >
                    Anmelden
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Usage type selection — only for self-registering users */}
          {!isInvited && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Wie möchten Sie TimeFocusAI nutzen?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUsageType("einzelnutzer")}
                  className={`relative flex flex-col items-center gap-2.5 rounded-lg border-2 p-4 transition-all cursor-pointer text-center ${
                    usageType === "einzelnutzer"
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    usageType === "einzelnutzer" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${usageType === "einzelnutzer" ? "text-blue-900" : "text-gray-900"}`}>
                      Einzelnutzer
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Für mich allein
                    </p>
                  </div>
                  {usageType === "einzelnutzer" && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUsageType("team")}
                  className={`relative flex flex-col items-center gap-2.5 rounded-lg border-2 p-4 transition-all cursor-pointer text-center ${
                    usageType === "team"
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    usageType === "team" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${usageType === "team" ? "text-blue-900" : "text-gray-900"}`}>
                      Team
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mit Mitarbeitern
                    </p>
                  </div>
                  {usageType === "team" && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Team name — only for team sign-up */}
          {!isInvited && usageType === "team" && (
            <div className="space-y-2">
              <Label htmlFor="org_name" className="text-sm font-medium">
                Team- / Firmenname
              </Label>
              <Input
                id="org_name"
                name="org_name"
                type="text"
                placeholder="z.B. Mustermann GmbH"
                required
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Vollständiger Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Max Mustermann"
                defaultValue={adminInvitationFullName || ""}
                readOnly={!!adminInvitationFullName}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@beispiel.de"
                defaultValue={invitationEmail || ""}
                readOnly={!!(invitationEmail || isAdminInvitation)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Mindestens 6 Zeichen"
                minLength={6}
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Hidden fields */}
          {!isInvited && usageType && (
            <input type="hidden" name="usage_type" value={usageType} />
          )}

          {isAdminInvitation && (
            <>
              <input type="hidden" name="admin_invitation" value={adminInvitationId} />
              <input type="hidden" name="token" value={invitationToken || ""} />
              <input type="hidden" name="org" value={organizationId || ""} />
            </>
          )}
          {isInvitation && !isAdminInvitation && (
            <>
              <input type="hidden" name="invitation" value={isInvitation} />
              <input type="hidden" name="role" value={invitationRole} />
              <input type="hidden" name="org" value={organizationId || ""} />
              {invitationToken && (
                <input type="hidden" name="token" value={invitationToken} />
              )}
            </>
          )}

          <SubmitButton
            formAction={signUpAction}
            pendingText={
              isAdminInvitation
                ? "Konto wird aktiviert..."
                : isInvitation
                  ? "Trete bei..."
                  : "Registrierung läuft..."
            }
            className="w-full"
            disabled={!isInvited && !usageType}
          >
            {isAdminInvitation
              ? "Konto aktivieren"
              : isInvitation
                ? "Einladung annehmen"
                : usageType === "team"
                  ? "Team erstellen & registrieren"
                  : "Registrieren"}
          </SubmitButton>

          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
