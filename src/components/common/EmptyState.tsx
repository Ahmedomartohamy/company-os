export default function EmptyState({ title = "لا توجد بيانات", hint = "ابدأ بإضافة سجل جديد.", action }: { title?: string; hint?: string; action?: React.ReactNode; }) {
  return (
    <div className="text-center py-16">
      <div className="text-xl font-semibold mb-2">{title}</div>
      <div className="text-text-muted mb-4">{hint}</div>
      {action}
    </div>
  );
}
