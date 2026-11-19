import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
export default function SignUpPage() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/sign-in");
  return <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", background: "#f5f4ef", padding: 24 }}><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" /></main>;
}
