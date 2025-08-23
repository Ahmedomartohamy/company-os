import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listPipelines } from '@/lib/opportunities';
import { Loader2, ExternalLink } from 'lucide-react';

export function PipelineDebug() {
  const {
    data: pipelines,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pipelines'],
    queryFn: listPipelines,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">جاري تحميل الأنابيب...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">خطأ في تحميل الأنابيب</h2>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'خطأ غير معروف'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">اختبار الأنابيب - Pipeline Debug</h1>

      {!pipelines || pipelines.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">لا توجد أنابيب</h2>
          <p className="text-yellow-700 mb-4">
            لم يتم العثور على أي أنابيب في قاعدة البيانات. يرجى تشغيل سكريبت البذر أولاً.
          </p>
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold mb-2">لتشغيل سكريبت البذر:</h3>
            <code className="text-sm">
              -- في قاعدة البيانات، قم بتشغيل محتوى ملف:
              <br />
              supabase/SEED_PIPELINE.sql
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            تم العثور على {pipelines.length} أنبوب(ة). اختر أحدها لعرض لوحة Kanban:
          </p>

          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{pipeline.name}</h3>
                  <p className="text-sm text-gray-500">ID: {pipeline.id}</p>
                  <p className="text-sm text-gray-500">المراحل: {pipeline.stages?.length || 0}</p>
                </div>
                <Link
                  to={`/pipeline/${pipeline.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  عرض اللوحة
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {pipeline.stages && pipeline.stages.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">المراحل:</h4>
                  <div className="flex flex-wrap gap-2">
                    {pipeline.stages.map((stage) => (
                      <span
                        key={stage.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {stage.name} ({stage.probability}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">معلومات التطوير</h2>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>المسار الحالي:</strong> /pipeline-debug
          </p>
          <p>
            <strong>مسار لوحة Kanban:</strong> /pipeline/:pipelineId
          </p>
          <p>
            <strong>مثال على مسار صحيح:</strong> /pipeline/[UUID من الجدول أعلاه]
          </p>
        </div>
      </div>
    </div>
  );
}

export default PipelineDebug;
