-- إنشاء مستخدمين تجريبيين بصلاحيات مختلفة
-- 
-- كيفية تشغيل هذا الملف:
-- 1. افتح Supabase Dashboard (https://supabase.com/dashboard)
-- 2. اذهب إلى مشروعك
-- 3. انتقل إلى SQL Editor
-- 4. انسخ والصق هذا الملف بالكامل
-- 5. اضغط "Run" للتنفيذ
--
-- ملاحظة: يجب تشغيل contacts-migration.sql أولاً لإنشاء جدول profiles
-- هذا الملف سينشئ مستخدمين تجريبيين مع كلمات مرور افتراضية

-- حذف البيانات الموجودة (اختياري - قم بإلغاء التعليق إذا لزم الأمر)
-- DELETE FROM auth.users WHERE email LIKE '%@test.company-os.com';
-- DELETE FROM public.profiles WHERE email LIKE '%@test.company-os.com';

-- إنشاء مستخدمين تجريبيين
-- ملاحظة: في بيئة الإنتاج، يجب إنشاء المستخدمين عبر واجهة التسجيل العادية
-- هذا الملف للتطوير والاختبار فقط

-- 1. مدير النظام (Admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.company-os.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@test.company-os.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "مدير النظام"}',
      false,
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- 2. مدير المبيعات (Sales Manager)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sales.manager@test.company-os.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sales.manager@test.company-os.com',
      crypt('Sales123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "أحمد المدير"}',
      false,
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- 3. مندوب مبيعات (Sales Rep)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sales.rep@test.company-os.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sales.rep@test.company-os.com',
      crypt('Rep123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "فاطمة المندوبة"}',
      false,
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- 4. مستخدم عادي (Viewer)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@test.company-os.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'viewer@test.company-os.com',
      crypt('View123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "محمد المشاهد"}',
      false,
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- إنشاء ملفات تعريف المستخدمين (Profiles) مع الأدوار
-- مدير النظام
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'مدير النظام',
  'admin'
FROM auth.users u 
WHERE u.email = 'admin@test.company-os.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- مدير المبيعات
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'أحمد المدير',
  'sales_manager'
FROM auth.users u 
WHERE u.email = 'sales.manager@test.company-os.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- مندوب مبيعات
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'فاطمة المندوبة',
  'sales_rep'
FROM auth.users u 
WHERE u.email = 'sales.rep@test.company-os.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- مستخدم عادي
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'محمد المشاهد',
  'viewer'
FROM auth.users u 
WHERE u.email = 'viewer@test.company-os.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- عرض ملخص المستخدمين المُنشأين
SELECT 
  'ملخص المستخدمين المُنشأين' as info,
  COUNT(*) as total_users
FROM auth.users 
WHERE email LIKE '%@test.company-os.com';

-- عرض تفاصيل المستخدمين والأدوار
SELECT 
  'تفاصيل المستخدمين' as table_name,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email LIKE '%@test.company-os.com'
ORDER BY 
  CASE p.role 
    WHEN 'admin' THEN 1
    WHEN 'sales_manager' THEN 2
    WHEN 'sales_rep' THEN 3
    WHEN 'viewer' THEN 4
    ELSE 5
  END;

-- معلومات تسجيل الدخول
SELECT 
  'معلومات تسجيل الدخول' as info,
  'استخدم البيانات التالية لتسجيل الدخول:' as instructions;

SELECT 
  p.role as "الدور",
  p.email as "البريد الإلكتروني",
  CASE p.role 
    WHEN 'admin' THEN 'Admin123!'
    WHEN 'sales_manager' THEN 'Sales123!'
    WHEN 'sales_rep' THEN 'Rep123!'
    WHEN 'viewer' THEN 'View123!'
    ELSE 'Unknown'
  END as "كلمة المرور",
  p.full_name as "الاسم الكامل"
FROM public.profiles p
WHERE p.email LIKE '%@test.company-os.com'
ORDER BY 
  CASE p.role 
    WHEN 'admin' THEN 1
    WHEN 'sales_manager' THEN 2
    WHEN 'sales_rep' THEN 3
    WHEN 'viewer' THEN 4
    ELSE 5
  END;