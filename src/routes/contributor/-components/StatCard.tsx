import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface StatCardProps {
  icon: LucideIcon;
  iconClass: string;
  value: string | number;
  label: string;
  trend?: ReactNode;
  link?: { to: string; label: string; colorClass: string };
}

export function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  trend,
  link,
}: StatCardProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-5 gap-3">
        <div className="flex items-center justify-between">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {trend && <span className="text-sm font-medium">{trend}</span>}
        </div>
        <div>
          <p className="text-xl font-bold text-base-content">{value}</p>
          <p className="text-sm text-base-content mt-0.5">{label}</p>
        </div>
        {link && (
          <Link
            to={link.to as any}
            className={`text-sm hover:underline -mt-1 ${link.colorClass}`}
          >
            {link.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
