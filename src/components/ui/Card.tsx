import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("bg-surface rounded-2xl shadow-card p-4", props.className)} />;
}

export function CardHeader({ title, actions, icon }: { title: string; actions?: React.ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        <h2 className="text-lg font-semibold text-brand">{title}</h2>
      </div>
      {actions}
    </div>
  );
}

export function KPI({ label, value, icon }: { label: string; value: string | number; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-soft flex items-center gap-3">
      {icon && <span className="text-brand">{icon}</span>}
      <div>
        <div className="text-text-muted text-sm mb-1">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
