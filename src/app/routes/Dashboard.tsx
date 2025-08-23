import { KPI, Card, CardHeader } from "@/components/ui/Card";
import { Users, BriefcaseBusiness, AlertTriangle, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="العملاء" value={12} icon={<Users className="w-5 h-5" />} />
        <KPI label="المشاريع" value={5} icon={<BriefcaseBusiness className="w-5 h-5" />} />
        <KPI label="مهام متأخرة" value={8} icon={<AlertTriangle className="w-5 h-5" />} />
        <KPI label="نشاط اليوم" value={23} icon={<Activity className="w-5 h-5" />} />
      </div>
      <Card className="p-6">
        <CardHeader title="النشاط الأخير" icon={<Activity className="w-5 h-5" />} />
        <ul className="space-y-2 text-sm text-text-muted">
          <li className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-brand"/><span>إنشاء مهمة "تحضير العرض" في مشروع "إعادة تصميم الموقع"</span></li>
          <li className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-brand"/><span>تحديث حالة مشروع "تطبيق الموبايل" إلى مكتمل</span></li>
          <li className="flex items-center gap-2"><Users className="w-4 h-4 text-brand"/><span>إضافة عميل جديد "أكمي"</span></li>
        </ul>
      </Card>
    </div>
  );
}
