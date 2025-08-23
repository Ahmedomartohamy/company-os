interface EmptyStateProps {
  title?: string;
  hint?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'لا توجد بيانات',
  hint = 'ابدأ بإضافة سجل جديد.',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-xl font-semibold mb-2">{title}</div>
      {description && <div className="text-text-muted mb-2">{description}</div>}
      <div className="text-text-muted mb-4">{hint}</div>
      {action}
    </div>
  );
}
