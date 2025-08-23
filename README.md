# Company OS — React + Vite + TypeScript + Tailwind (v2)

هذه النسخة تضيف:
- **Navbar علوي** + **Sidebar** مع أيقونات من **lucide-react**.
- زر **تسجيل الخروج** بمتغير `variant="sidebar"` لضمان التباين وعدم الاختفاء عند التحويم.
- نفس الألوان: brand #0D2A4B، accent #FF6B00، bg #F2F2F2.
- مكونات UI أساسية + Dashboard RTL.

## التشغيل
```bash
npm i
npm run dev
```

## المجلدات
- `src/app/layout/AppShell.tsx` : يحتوي Navbar + Sidebar + Main
- `src/components/ui/Button.tsx` : يدعم variant جديد `sidebar`


## Sidebar & Page Headers
- Global '+ إضافة مشروع' removed from AppShell. Each page now controls its own header/actions via `PageHeader`.
- AppShell renders only layout (Navbar + Sidebar). A default sidebar is provided if none is passed.

## Added in improved base

- Supabase client (`src/lib/supabaseClient.ts`) + services (clients/projects/tasks).
- Auth context + Login page, and wired `ProtectedRoute`.
- Basic RBAC utilities (`src/lib/rbac.ts`).
- Reusable form components: Select, Textarea, DatePicker, FileUpload.
- Common layout parts: Topbar, Sidebar.
- Tooling: ESLint, Prettier, Vitest, Husky hook (manual install needed).
- Env template for Supabase keys.

### Quick start
1. Copy `.env.example` to `.env` and set Supabase URL & anon key.
2. Install deps: `npm i`
3. Run dev server: `npm run dev`.
4. Tests: `npm run test`.

## 🚀 النشر على GitHub و Vercel

### تهيئة المشروع للرفع على GitHub:

1. **إنشاء repository جديد على GitHub**
2. **تهيئة Git في المشروع:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Company OS project"
   git branch -M main
   git remote add origin https://github.com/username/repository-name.git
   git push -u origin main
   ```

### النشر على Vercel:

#### الطريقة الأولى: من خلال Vercel Dashboard
1. اذهب إلى [vercel.com](https://vercel.com) وسجل دخول
2. اضغط "New Project"
3. اختر repository من GitHub
4. أضف متغيرات البيئة:
   - `VITE_SUPABASE_URL`: رابط مشروع Supabase
   - `VITE_SUPABASE_ANON_KEY`: مفتاح Supabase العام
5. اضغط "Deploy"

#### الطريقة الثانية: من خلال Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### إعداد قاعدة البيانات:
قبل النشر، تأكد من تشغيل الأوامر التالية في Supabase:

```sql
-- للمشاريع
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);

-- للمهام
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
```

### إضافة بيانات تجريبية (Seeding):
لإضافة بيانات تجريبية للتطوير والاختبار:

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `supabase/SEED.sql`
4. الصق المحتوى واضغط "Run"

سيتم إضافة:
- ~10 عملاء تجريبيين
- ~5 مشاريع مرتبطة بالعملاء
- ~20 مهمة مرتبطة بالمشاريع

### إنشاء حسابات تجريبية بصلاحيات مختلفة:
لاختبار نظام الصلاحيات (RBAC)، يمكنك إنشاء حسابات تجريبية:

1. تأكد من تشغيل `supabase/contacts-migration.sql` أولاً
2. افتح Supabase Dashboard → SQL Editor
3. انسخ محتوى ملف `supabase/users-seed.sql`
4. الصق المحتوى واضغط "Run"

سيتم إنشاء 4 حسابات:
- **مدير النظام**: `admin@test.company-os.com` / `Admin123!`
- **مدير المبيعات**: `sales.manager@test.company-os.com` / `Sales123!`
- **مندوب مبيعات**: `sales.rep@test.company-os.com` / `Rep123!`
- **مستخدم عادي**: `viewer@test.company-os.com` / `View123!`

لمزيد من التفاصيل، راجع ملف `TEST-USERS.md`

### ملفات مهمة تم إنشاؤها:
- `.gitignore`: لحماية الملفات الحساسة
- `vercel.json`: تكوين النشر على Vercel
- `update-projects-schema.sql`: تحديثات قاعدة بيانات المشاريع
- `update-tasks-schema.sql`: تحديثات قاعدة بيانات المهام
- `supabase/SEED.sql`: بيانات تجريبية للتطوير والاختبار
