import type { Metadata } from "next";
import { SignIn } from "@/components/sign-in";

// Where a student says who they are. One field, one link in an email -
// no password to forget, which is the right trade for a course people
// open on a phone every day.

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignIn />;
}
