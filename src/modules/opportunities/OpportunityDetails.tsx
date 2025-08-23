import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ArrowRight,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  Target,
  TrendingUp,
  FileText,
  Plus,
} from 'lucide-react';
import { getOpportunity, deleteOpportunity, OpportunityWithDetails } from '@/lib/opportunities';
import { useAuthz } from '@/lib/useAuthz';
import { useAuth } from '@/app/auth/AuthProvider';
import { OpportunityForm } from './OpportunityForm';
import { useQueryClient } from '@tanstack/react-query';

export function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuthz();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('معرف الفرصة مطلوب');
      setLoading(false);
      return;
    }

    loadOpportunity();
  }, [id]);

  const loadOpportunity = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getOpportunity(id);

      if (!data) {
        setError('الفرصة غير موجودة');
        return;
      }

      setOpportunity(data);
    } catch (err) {
      console.error('Error loading opportunity:', err);
      setError('فشل في تحميل بيانات الفرصة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !opportunity) return;

    try {
      await deleteOpportunity(id);
      // Invalidate queries after successful deletion
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.removeQueries({ queryKey: ['opportunity', id] });
      navigate(-1); // Go back to previous page
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      setError('فشل في حذف الفرصة');
    }
  };

  const formatCurrency = (amount?: number, currency = 'EGP') => {
    if (!amount) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'open':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'won':
        return 'مكتملة';
      case 'lost':
        return 'مفقودة';
      case 'open':
      default:
        return 'مفتوحة';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-blue-600';
    if (probability >= 40) return 'text-yellow-600';
    if (probability >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'الفرصة غير موجودة'}</div>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          العودة
        </button>
      </div>
    );
  }

  const canUpdate = can('update', 'opportunities', opportunity);
  const canDelete = can('delete', 'opportunities', opportunity);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{opportunity.name}</h1>
            <p className="text-gray-600 mt-1">تفاصيل الفرصة التجارية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUpdate && (
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              تعديل
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">القيمة</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(opportunity.amount, opportunity.currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className={`h-5 w-5 ${getProbabilityColor(opportunity.probability)}`} />
                <div>
                  <p className="text-sm text-gray-600">احتمالية النجاح</p>
                  <p className={`font-semibold ${getProbabilityColor(opportunity.probability)}`}>
                    {opportunity.probability}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">تاريخ الإغلاق المتوقع</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(opportunity.close_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}
                  >
                    {getStatusText(opportunity.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Information */}
          {opportunity.stage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات المرحلة</h2>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">{opportunity.stage.name}</p>
                  <p className="text-sm text-gray-600">
                    احتمالية المرحلة: {opportunity.stage.probability}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {opportunity.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                الملاحظات
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{opportunity.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Related Information */}
        <div className="space-y-6">
          {/* Client Information */}
          {opportunity.client && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                العميل
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{opportunity.client.name}</p>
                <p className="text-sm text-gray-600">معرف العميل: {opportunity.client.id}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {opportunity.contact_id && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                جهة الاتصال
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">معرف جهة الاتصال: {opportunity.contact_id}</p>
              </div>
            </div>
          )}

          {/* Owner Information */}
          {opportunity.owner_id && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                المسؤول
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">معرف المسؤول: {opportunity.owner_id}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات إضافية</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">تاريخ الإنشاء</p>
                <p className="font-medium text-gray-900">{formatDate(opportunity.created_at)}</p>
              </div>
              {opportunity.updated_at && (
                <div>
                  <p className="text-gray-600">آخر تحديث</p>
                  <p className="font-medium text-gray-900">{formatDate(opportunity.updated_at)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">معرف الفرصة</p>
                <p className="font-mono text-xs text-gray-500">{opportunity.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <OpportunityForm
          opportunity={opportunity}
          onCancel={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            loadOpportunity();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف الفرصة "{opportunity.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpportunityDetails;
