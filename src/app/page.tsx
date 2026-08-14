import { HomeSwitch } from "@/components/home-switch";
import { Landing } from "@/components/landing";

// "/" serves whoever is standing there: the sales page to a visitor, the
// Today screen to a student. To see the sales page regardless of saved
// progress, use /landing.

export default function HomePage() {
  return <HomeSwitch landing={<Landing />} />;
}
