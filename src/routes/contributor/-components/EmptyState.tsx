import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body items-center text-center py-16">
        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-2">
          <Icon className="w-8 h-8 text-base-content" />
        </div>
        <h3 className="text-lg font-medium text-base-content">{title}</h3>
        {description && (
          <p className="text-base-content text-base">{description}</p>
        )}
      </div>
    </div>
  );
}
