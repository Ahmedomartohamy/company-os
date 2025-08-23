import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  Settings,
  Search,
  UserRound,
  Plus,
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '@/app/auth/AuthProvider';

function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/5">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand"></div>
          <span className="font-semibold text-brand">Company OS</span>
        </div>
        <div className="hidden md:flex items-center gap-2 w-[min(420px,40vw)]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              placeholder="ابحث عن عميل / مشروع / مهمة..."
              className="w-full rounded-xl border bg-white/70 pr-9 pl-3 text-sm h-9 focus:border-brand focus:ring-brand"
            />
          </div>
          <Button className="h-9">بحث</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="إشعارات">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="إعدادات">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="حساب">
            <UserRound className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function DefaultSidebar() {
  const link = 'flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors';
  const icon = 'w-4 h-4';
  return (
    <nav className="space-y-2">
      <a className={link} href="/">
        <LayoutDashboard className={icon} /> <span>لوحة التحكم</span>
      </a>
      <a className={link} href="/clients">
        <Users className={icon} /> <span>العملاء</span>
      </a>
      <a className={link} href="/projects">
        <BriefcaseBusiness className={icon} /> <span>المشاريع</span>
      </a>
      <a className={link} href="/tasks">
        <ListChecks className={icon} /> <span>المهام</span>
      </a>
    </nav>
  );
}

export function AppShell({ sidebar, children }: { sidebar?: ReactNode; children: ReactNode }) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-text">
      <Navbar />
      <div className="grid grid-cols-[260px_1fr]">
        <aside className="min-h-[calc(100dvh-56px)] bg-brand text-white p-4 flex flex-col gap-4">
          {sidebar ?? <DefaultSidebar />}
          <div className="mt-auto">
            <Button variant="sidebar" className="w-full" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </div>
        </aside>
        <main className="p-6">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
