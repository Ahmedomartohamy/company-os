import { KPI, Card, CardHeader } from "@/components/ui/Card";
import { Users, BriefcaseBusiness, AlertTriangle, Activity, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPipelineValue, getExpectedRevenue, getTasksDue } from "@/lib/dashboard";
import { toast } from "sonner";

export default function Dashboard() {
  // Query for pipeline value
  const { data: pipelineData, isLoading: pipelineLoading, error: pipelineError } = useQuery({
    queryKey: ['dashboard', 'pipeline-value'],
    queryFn: getPipelineValue,
    onError: (error: Error) => {
      toast.error(`خطأ في تحميل قيمة البايبلاين: ${error.message}`);
    }
  });

  // Query for expected revenue
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['dashboard', 'expected-revenue'],
    queryFn: getExpectedRevenue,
    onError: (error: Error) => {
      toast.error(`خطأ في تحميل الإيراد المتوقع: ${error.message}`);
    }
  });

  // Query for tasks due
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['dashboard', 'tasks-due'],
    queryFn: getTasksDue,
    onError: (error: Error) => {
      toast.error(`خطأ في تحميل المهام المستحقة: ${error.message}`);
    }
  });

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get display value with loading/error states
  const getDisplayValue = (data: any, isLoading: boolean, error: any, fallback: string = "—") => {
    if (isLoading) return "...";
    if (error) return fallback;
    return data;
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI 
          label="قيمة البايبلاين" 
          value={pipelineLoading ? "..." : pipelineError ? "—" : formatCurrency(pipelineData?.pipeline_value || 0)} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <KPI 
          label="الإيراد المتوقع" 
          value={revenueLoading ? "..." : revenueError ? "—" : formatCurrency(revenueData?.expected_revenue || 0)} 
          icon={<DollarSign className="w-5 h-5" />} 
        />
        <KPI 
          label="مهام اليوم" 
          value={getDisplayValue(tasksData?.due_today || 0, tasksLoading, tasksError)} 
          icon={<AlertTriangle className="w-5 h-5" />} 
        />
        <KPI 
          label="مهام الغد" 
          value={getDisplayValue(tasksData?.due_tomorrow || 0, tasksLoading, tasksError)} 
          icon={<Activity className="w-5 h-5" />} 
        />
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
