-- SEED DATA FOR LOCAL/STAGING DEVELOPMENT
-- 
-- How to run this file:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Go to your project
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- Note: This assumes tables already exist (run database-setup.sql first)
-- This will insert sample data for testing purposes

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM tasks;
-- DELETE FROM projects;
-- DELETE FROM clients;

-- Insert sample clients (~10 clients)
INSERT INTO clients (id, name, email, phone, company) VALUES
  (gen_random_uuid(), 'أحمد محمد', 'ahmed.mohamed@techcorp.com', '+966501234567', 'شركة التقنية المتقدمة'),
  (gen_random_uuid(), 'فاطمة علي', 'fatima.ali@innovate.sa', '+966502345678', 'مؤسسة الابتكار'),
  (gen_random_uuid(), 'محمد السعيد', 'mohammed.alsaeed@buildco.com', '+966503456789', 'شركة البناء والتطوير'),
  (gen_random_uuid(), 'نورا الأحمد', 'nora.alahmad@designstudio.sa', '+966504567890', 'استوديو التصميم الحديث'),
  (gen_random_uuid(), 'خالد الرشيد', 'khalid.alrashid@consulting.com', '+966505678901', 'مكتب الاستشارات الإدارية'),
  (gen_random_uuid(), 'سارة المطيري', 'sara.almutairi@marketing.sa', '+966506789012', 'وكالة التسويق الرقمي'),
  (gen_random_uuid(), 'عبدالله الغامدي', 'abdullah.alghamdi@logistics.com', '+966507890123', 'شركة الخدمات اللوجستية'),
  (gen_random_uuid(), 'ريم الزهراني', 'reem.alzahrani@healthcare.sa', '+966508901234', 'مجموعة الرعاية الصحية'),
  (gen_random_uuid(), 'يوسف الحربي', 'youssef.alharbi@education.com', '+966509012345', 'مؤسسة التعليم التقني'),
  (gen_random_uuid(), 'هند القحطاني', 'hind.alqahtani@retail.sa', '+966500123456', 'سلسلة متاجر الأزياء');

-- Insert sample projects (~5 projects linked to clients)
-- Note: We'll use subqueries to get client IDs since we used gen_random_uuid()
WITH client_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM clients LIMIT 10
)
INSERT INTO projects (id, name, description, status, budget, start_date, end_date, client_id) 
SELECT 
  gen_random_uuid(),
  project_name,
  project_desc,
  project_status,
  project_budget,
  project_start,
  project_end,
  client_id
FROM (
  VALUES 
    ('تطوير موقع إلكتروني متقدم', 'تصميم وتطوير موقع إلكتروني متجاوب مع لوحة تحكم إدارية', 'active', 75000.00, '2024-01-15'::date, '2024-04-15'::date),
    ('حملة تسويقية شاملة', 'تخطيط وتنفيذ حملة تسويقية رقمية متكاملة عبر منصات متعددة', 'active', 45000.00, '2024-02-01'::date, '2024-05-01'::date),
    ('نظام إدارة المخزون', 'تطوير نظام متكامل لإدارة المخزون والمبيعات', 'completed', 120000.00, '2023-10-01'::date, '2024-01-31'::date),
    ('تطبيق الهاتف المحمول', 'تصميم وتطوير تطبيق iOS و Android للتجارة الإلكترونية', 'active', 95000.00, '2024-01-20'::date, '2024-06-20'::date),
    ('استشارات تحول رقمي', 'دراسة وتخطيط عملية التحول الرقمي للمؤسسة', 'pending', 35000.00, '2024-03-01'::date, '2024-05-15'::date)
) AS project_data(project_name, project_desc, project_status, project_budget, project_start, project_end)
CROSS JOIN LATERAL (
  SELECT id as client_id FROM client_ids WHERE rn = (
    CASE 
      WHEN project_data.project_name = 'تطوير موقع إلكتروني متقدم' THEN 1
      WHEN project_data.project_name = 'حملة تسويقية شاملة' THEN 6
      WHEN project_data.project_name = 'نظام إدارة المخزون' THEN 7
      WHEN project_data.project_name = 'تطبيق الهاتف المحمول' THEN 10
      WHEN project_data.project_name = 'استشارات تحول رقمي' THEN 5
    END
  )
) client_mapping;

-- Insert sample tasks (~20 tasks linked to projects)
-- We'll create tasks for each project
WITH project_ids AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM projects LIMIT 5
)
INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee)
SELECT 
  gen_random_uuid(),
  task_title,
  task_desc,
  task_status,
  task_priority,
  task_due_date,
  project_ids.id,
  task_assignee
FROM (
  VALUES 
    -- Tasks for Project 1 (Website Development)
    ('تحليل المتطلبات', 'جمع وتحليل متطلبات العميل للموقع الإلكتروني', 'completed', 'high', '2024-01-25'::date, 1, 'أحمد المطور'),
    ('تصميم واجهة المستخدم', 'إنشاء تصاميم UI/UX للموقع', 'completed', 'high', '2024-02-10'::date, 1, 'سارة المصممة'),
    ('تطوير الواجهة الأمامية', 'برمجة الواجهة الأمامية باستخدام React', 'in_progress', 'high', '2024-03-15'::date, 1, 'محمد المطور'),
    ('تطوير الواجهة الخلفية', 'إنشاء APIs ونظام إدارة المحتوى', 'pending', 'medium', '2024-04-01'::date, 1, 'علي المطور'),
    
    -- Tasks for Project 2 (Marketing Campaign)
    ('دراسة السوق', 'تحليل السوق المستهدف والمنافسين', 'completed', 'high', '2024-02-15'::date, 2, 'نورا المسوقة'),
    ('إنشاء المحتوى', 'كتابة وتصميم المحتوى التسويقي', 'in_progress', 'medium', '2024-03-01'::date, 2, 'خالد الكاتب'),
    ('إدارة وسائل التواصل', 'تنفيذ الحملة عبر منصات التواصل الاجتماعي', 'pending', 'medium', '2024-03-20'::date, 2, 'فاطمة المسوقة'),
    ('تحليل النتائج', 'قياس وتحليل أداء الحملة التسويقية', 'pending', 'low', '2024-04-15'::date, 2, 'نورا المسوقة'),
    
    -- Tasks for Project 3 (Inventory System)
    ('تصميم قاعدة البيانات', 'تصميم هيكل قاعدة البيانات للنظام', 'completed', 'high', '2023-10-15'::date, 3, 'يوسف المحلل'),
    ('تطوير وحدة المخزون', 'برمجة وحدة إدارة المخزون', 'completed', 'high', '2023-11-30'::date, 3, 'ريم المطورة'),
    ('تطوير وحدة المبيعات', 'برمجة وحدة إدارة المبيعات', 'completed', 'high', '2023-12-15'::date, 3, 'عبدالله المطور'),
    ('اختبار النظام', 'إجراء اختبارات شاملة للنظام', 'completed', 'medium', '2024-01-15'::date, 3, 'هند المختبرة'),
    
    -- Tasks for Project 4 (Mobile App)
    ('تصميم تجربة المستخدم', 'تصميم UX للتطبيق المحمول', 'completed', 'high', '2024-02-05'::date, 4, 'لينا المصممة'),
    ('تطوير تطبيق iOS', 'برمجة التطبيق لنظام iOS', 'in_progress', 'high', '2024-04-30'::date, 4, 'سعد المطور'),
    ('تطوير تطبيق Android', 'برمجة التطبيق لنظام Android', 'in_progress', 'high', '2024-05-15'::date, 4, 'مريم المطورة'),
    ('اختبار التطبيقات', 'اختبار التطبيقات على الأجهزة المختلفة', 'pending', 'medium', '2024-06-01'::date, 4, 'أمل المختبرة'),
    
    -- Tasks for Project 5 (Digital Transformation)
    ('تقييم الوضع الحالي', 'دراسة الأنظمة والعمليات الحالية', 'pending', 'high', '2024-03-15'::date, 5, 'راشد الاستشاري'),
    ('وضع خطة التحول', 'إعداد خطة شاملة للتحول الرقمي', 'pending', 'high', '2024-04-01'::date, 5, 'منى الاستشارية'),
    ('تدريب الموظفين', 'تدريب الفريق على الأنظمة الجديدة', 'pending', 'medium', '2024-04-30'::date, 5, 'طارق المدرب'),
    ('متابعة التنفيذ', 'متابعة تطبيق خطة التحول الرقمي', 'pending', 'low', '2024-05-10'::date, 5, 'راشد الاستشاري')
) AS task_data(task_title, task_desc, task_status, task_priority, task_due_date, project_rn, task_assignee)
JOIN project_ids ON project_ids.rn = task_data.project_rn;

-- Display summary of inserted data
SELECT 
  'Data Summary' as info,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM tasks) as total_tasks;

-- Display sample data for verification
SELECT 'CLIENTS' as table_name, name, email, company FROM clients LIMIT 5;
SELECT 'PROJECTS' as table_name, name, status, budget FROM projects LIMIT 5;
SELECT 'TASKS' as table_name, title, status, priority, assignee FROM tasks LIMIT 10;