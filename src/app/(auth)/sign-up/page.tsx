import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Signup(props: {
  searchParams: Promise<
    Message & {
      invitation?: string;
      role?: string;
      token?: string;
      email?: string;
      org?: string;
    }
  >;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  const isInvitation = searchParams.invitation;
  const invitationRole = searchParams.role || "member";
  const invitationToken = searchParams.token;
  const invitationEmail = searchParams.email;
  const organizationId = searchParams.org;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          {isInvitation && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Team Invitation
                  <Badge variant="secondary">{invitationRole}</Badge>
                </CardTitle>
                <CardDescription>
                  You've been invited to join our team on TimeFocusAI as a{" "}
                  <strong>{invitationRole}</strong>. Complete your signup below
                  to get started!
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {isInvitation ? "Complete Your Invitation" : "Sign up"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isInvitation ? (
                    `You've been invited to join as a ${invitationRole}. Complete your registration below.`
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link
                        className="text-primary font-medium hover:underline transition-all"
                        href="/sign-in"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    defaultValue={invitationEmail || ""}
                    readOnly={!!invitationEmail}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Your password"
                    minLength={6}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Hidden fields for invitation data */}
              {isInvitation && (
                <>
                  <input type="hidden" name="invitation" value={isInvitation} />
                  <input type="hidden" name="role" value={invitationRole} />
                  <input
                    type="hidden"
                    name="org"
                    value={organizationId || ""}
                  />
                  {invitationToken && (
                    <input type="hidden" name="token" value={invitationToken} />
                  )}
                </>
              )}

              <SubmitButton
                formAction={signUpAction}
                pendingText={isInvitation ? "Joining team..." : "Signing up..."}
                className="w-full"
              >
                {isInvitation ? "Accept Invitation & Join Team" : "Sign up"}
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
