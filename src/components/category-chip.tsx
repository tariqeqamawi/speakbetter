import { categoryById, type CategoryId } from "@/data/categories";

export function CategoryDot({ category, className = "" }: { category: CategoryId; className?: string }) {
  const cat = categoryById.get(category);
  if (!cat) return null;
  return <span className={`inline-block size-2 rounded-full ${cat.bgClass} ${className}`} aria-hidden />;
}

export function CategoryChip({ category }: { category: CategoryId }) {
  const cat = categoryById.get(category);
  if (!cat) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 bg-navy-800 px-2.5 py-1 text-xs font-medium text-ink-muted">
      <CategoryDot category={category} />
      {cat.name}
    </span>
  );
}
