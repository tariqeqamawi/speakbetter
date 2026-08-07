import { RequireAccess } from "@/components/require-access";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <RequireAccess>{children}</RequireAccess>;
}
