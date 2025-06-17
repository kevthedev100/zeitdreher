import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SignIn } from "@clerk/nextjs";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none p-0 border-0",
                header: "text-center",
                headerTitle: "text-3xl font-semibold tracking-tight",
                headerSubtitle: "text-sm text-muted-foreground",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                formFieldInput: "rounded-md border border-input bg-background",
                footerAction:
                  "text-primary font-medium hover:underline transition-all",
              },
            }}
            routing="path"
            path="/forgot-password"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </>
  );
}
