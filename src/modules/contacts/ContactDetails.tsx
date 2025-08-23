import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Pencil, Trash2, Mail, Phone, Building, User, Calendar } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';

import { useAuthz } from '@/lib/useAuthz';
import { getContact, deleteContact, type ContactWithClient } from '@/lib/contacts';
import ContactForm from './ContactForm';

type TabType = 'overview' | 'activities' | 'files';

export default function ContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuthz();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch contact details
  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id!),
    enabled: !!id
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      toast.success('تم حذف جهة الاتصال بنجاح');
      navigate('/contacts');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف جهة الاتصال');
    }
  });

  const handleEdit = () => {
    if (contact && can('update', 'contacts', contact)) {
      setShowEditForm(true);
    }
  };

  const handleDelete = () => {
    if (contact && can('delete', 'contacts', contact)) {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    if (contact?.id) {
      deleteMutation.mutate(contact.id);
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    // Invalidate contact query to refresh data
    queryClient.invalidateQueries({ queryKey: ['contact', id] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <EmptyState
        title="جهة الاتصال غير موجودة"
        description="لم يتم العثور على جهة الاتصال المطلوبة"
        action={
          <Button onClick={() => navigate('/contacts')}>
            العودة إلى جهات الاتصال
          </Button>
        }
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: User },
    { id: 'activities', label: 'الأنشطة', icon: Calendar },
    { id: 'files', label: 'الملفات', icon: Building }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title={`${contact.first_name} ${contact.last_name || ''}`}
        subtitle={contact.position || contact.company}
      >
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/contacts')}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
          
          {can('update', 'contacts', contact) && (
            <Button
              variant="secondary"
              onClick={handleEdit}
            >
              <Pencil className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          )}
          
          {can('delete', 'contacts', contact) && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 space-x-reverse">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4 ml-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="lg:col-span-2">
              <Card title="معلومات الاتصال">
                <div className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 ml-3" />
                      <div>
                        <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                        <div className="font-medium">
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 ml-3" />
                      <div>
                        <div className="text-sm text-gray-500">الهاتف</div>
                        <div className="font-medium">
                          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-gray-400 ml-3" />
                      <div>
                        <div className="text-sm text-gray-500">الشركة</div>
                        <div className="font-medium">{contact.company}</div>
                      </div>
                    </div>
                  )}
                  
                  {contact.position && (
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 ml-3" />
                      <div>
                        <div className="text-sm text-gray-500">المنصب</div>
                        <div className="font-medium">{contact.position}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              
              {contact.notes && (
                <Card title="ملاحظات" className="mt-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Info */}
              {contact.client && (
                <Card title="العميل">
                  <div className="text-center">
                    <div className="font-medium text-lg">{contact.client.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/clients/${contact.client?.id}`)}
                      className="mt-2"
                    >
                      عرض تفاصيل العميل
                    </Button>
                  </div>
                </Card>
              )}
              
              {/* Owner Info */}
              {contact.owner && (
                <Card title="المسؤول">
                  <div className="text-center">
                    <div className="font-medium">{contact.owner.full_name}</div>
                  </div>
                </Card>
              )}
              
              {/* Metadata */}
              <Card title="معلومات إضافية">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-500">تاريخ الإنشاء</div>
                    <div className="font-medium">
                      {contact.created_at ? new Date(contact.created_at).toLocaleDateString('ar-SA') : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">آخر تعديل</div>
                    <div className="font-medium">
                      {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('ar-SA') : '-'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <EmptyState
            title="الأنشطة"
            description="سيتم إضافة تتبع الأنشطة في إصدار لاحق"
          />
        )}

        {activeTab === 'files' && (
          <EmptyState
            title="الملفات"
            description="سيتم إضافة إدارة الملفات في إصدار لاحق"
          />
        )}
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <Modal
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          title="تعديل جهة الاتصال"
        >
          <ContactForm
            contact={contact}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="حذف جهة الاتصال"
        message={`سيتم حذف ${contact.first_name} ${contact.last_name || ''}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}