import type { Metadata } from "next";
import CategoryPage, {
  generateStaticParams,
} from "@/app/(app)/skills/[category]/page";
import { DemoFrame } from "@/components/demo-frame";

// The category theater inside the preview, so clicking a color on the
// demo dial lands here instead of bouncing off the access gate.

export { generateStaticParams };

export const metadata: Metadata = {
  title: "Skills preview",
  robots: { index: false, follow: false },
};

export default function DemoCategoryPage(props: {
  params: Promise<{ category: string }>;
}) {
  return (
    <DemoFrame>
      <CategoryPage
        {...(props as unknown as PageProps<"/skills/[category]">)}
      />
    </DemoFrame>
  );
}
