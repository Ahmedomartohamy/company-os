import { Button } from '@/components/ui/Button';
export default function Topbar() {
  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-white">
      <div className="font-semibold">Mannora CRM</div>
      <div className="space-x-2">
        <Button variant="outline">بحث</Button>
        <Button>إضافة</Button>
      </div>
    </div>
  );
}
