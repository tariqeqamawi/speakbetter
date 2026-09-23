import {
  BookIcon,
  BrushIcon,
  EyeIcon,
  FlatlineIcon,
  HandIcon,
  ListenIcon,
  RepeatIcon,
  SkillsIcon,
  SpectrumIcon,
  ZapIcon,
} from "@/components/icons";
import { CategoryIcon } from "@/components/category-icons";
import type { CategoryId } from "@/data/categories";

// The symbol for one thing Coach saw.
//
// A color tells a student which shelf a technique came from; it does
// not tell them what they did. A hand rising as their hands move, an
// eye rising as they hold the lens, a brush as they paint a picture in
// words - that they can read at a glance while their own face is
// talking on the screen behind it, which is the entire point of
// putting it there.
//
// Anything Coach names that isn't in this list falls back to the
// color's own icon, so a new kind of moment is never a missing square.

const BY_KIND: Record<string, (p: { className?: string }) => React.ReactNode> = {
  gesture: HandIcon,
  posture: SpectrumIcon,
  "eye-contact": EyeIcon,
  expression: ZapIcon,
  metaphor: BrushIcon,
  imagery: BrushIcon,
  story: BookIcon,
  scene: BookIcon,
  pause: FlatlineIcon,
  voice: ListenIcon,
  question: ZapIcon,
  callback: RepeatIcon,
  structure: SkillsIcon,
  humour: ZapIcon,
};

export function MomentIcon({
  kind,
  category,
  className = "size-5",
}: {
  kind?: string;
  category: CategoryId;
  className?: string;
}) {
  const Icon = kind ? BY_KIND[kind] : undefined;
  if (Icon) return <Icon className={className} />;
  return <CategoryIcon category={category} className={className} />;
}
