import { Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import SignUpForm from "@/components/sign-up-form";

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

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <SignUpForm searchParams={searchParams} />
      </div>
    </>
  );
}
