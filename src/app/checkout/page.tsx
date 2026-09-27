import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout-page";
import { isPlan } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Checkout",
};

// Choosing a tier anywhere on the site lands here (?plan=), and this
// page hands over to Stripe.

export default async function Checkout({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <CheckoutPage initial={isPlan(plan) ? plan : "coached"} />;
}
