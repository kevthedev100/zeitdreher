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
      admin_invitation?: string;
      full_name?: string;
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
  const adminInvitationId = searchParams.admin_invitation;
  const adminInvitationFullName = searchParams.full_name;
  const isAdminInvitation = !!adminInvitationId;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          {isAdminInvitation && (
            <Card className="mb-6 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Welcome to the Team!
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    Full License
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your administrator has created an account for you with{" "}
                  <strong>full license privileges</strong>. Complete your
                  registration below to activate your account!
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {isInvitation && !isAdminInvitation && (
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
                  {isAdminInvitation
                    ? "Activate Your Account"
                    : isInvitation
                      ? "Complete Your Invitation"
                      : "Sign up"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAdminInvitation ? (
                    "Set your password to activate your account with full license privileges."
                  ) : isInvitation ? (
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
                    defaultValue={adminInvitationFullName || ""}
                    readOnly={!!adminInvitationFullName}
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
                    readOnly={!!(invitationEmail || isAdminInvitation)}
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
              {isAdminInvitation && (
                <>
                  <input
                    type="hidden"
                    name="admin_invitation"
                    value={adminInvitationId}
                  />
                  <input
                    type="hidden"
                    name="token"
                    value={invitationToken || ""}
                  />
                  <input
                    type="hidden"
                    name="org"
                    value={organizationId || ""}
                  />
                </>
              )}
              {isInvitation && !isAdminInvitation && (
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
                pendingText={
                  isAdminInvitation
                    ? "Activating account..."
                    : isInvitation
                      ? "Joining team..."
                      : "Signing up..."
                }
                className="w-full"
              >
                {isAdminInvitation
                  ? "Activate Account"
                  : isInvitation
                    ? "Accept Invitation & Join Team"
                    : "Sign up"}
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
