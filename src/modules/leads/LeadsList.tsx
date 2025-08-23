import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, Plus, ArrowRightLeft } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/table/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

import { useAuthz } from '@/lib/useAuthz';
import { listLeads, deleteLead, type LeadWithOwner } from '@/lib/leads';
import LeadForm from './LeadForm';
import ConvertLeadDialog from './ConvertLeadDialog';

interface LeadsListProps {
  title?: string;
  showAddButton?: boolean;
}

export default function LeadsList({ 
  title = 'العملاء المحتملون', 
  showAddButton = true 
}: LeadsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithOwner | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<LeadWithOwner | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<LeadWithOwner | null>(null);
  const [page, setPage] = useState(1);
  const [allLeads, setAllLeads] = useState<LeadWithOwner[]>([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuthz();

  // Fetch leads with filters and pagination
  const { data: leads = [], isLoading, isFetching } = useQuery({
    queryKey: ['leads', { q: searchQuery, status: selectedStatus, source: selectedSource, ownerId: selectedOwnerId, page }],
    queryFn: () => listLeads({ 
      q: searchQuery || undefined, 
      status: selectedStatus || undefined,
      source: selectedSource || undefined,
      ownerId: selectedOwnerId || undefined,
      page,
      limit: 25
    })
  }) as { data: LeadWithOwner[], isLoading: boolean, isFetching: boolean };

  // Handle data updates when leads change
  useEffect(() => {
    if (leads) {
      if (page === 1) {
        setAllLeads(leads);
      } else {
        setAllLeads(prev => [...prev, ...leads]);
      }
    }
  }, [leads, page]);

  // Reset pagination when filters change
  const resetPagination = () => {
    setPage(1);
    setAllLeads([]);
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPagination();
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    resetPagination();
  };

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
    resetPagination();
  };

  const handleOwnerChange = (value: string) => {
    setSelectedOwnerId(value);
    resetPagination();
  };

  // Load more leads
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Check if there are more leads to load
  const hasMore = leads.length === 25;
  const displayLeads = page === 1 ? leads : allLeads;

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueryData(['leads', { q: searchQuery, status: selectedStatus, source: selectedSource, ownerId: selectedOwnerId }]);
      
      // Optimistically remove lead
      queryClient.setQueryData(
        ['leads', { q: searchQuery, status: selectedStatus, source: selectedSource, ownerId: selectedOwnerId }],
        (old: LeadWithOwner[] = []) => old.filter(l => l.id !== leadId)
      );
      
      return { previousLeads };
    },
    onError: (err, leadId, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(
          ['leads', { q: searchQuery, status: selectedStatus, source: selectedSource, ownerId: selectedOwnerId }],
          context.previousLeads
        );
      }
      toast.error('حدث خطأ أثناء حذف العميل المحتمل');
    },
    onSuccess: () => {
      toast.success('تم حذف العميل المحتمل بنجاح');
      setDeleteOpen(false);
      setLeadToDelete(null);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const handleView = (lead: LeadWithOwner) => {
    if (can('view', 'leads', lead)) {
      // Placeholder for lead details view
      toast.info('عرض تفاصيل العميل المحتمل - قريباً');
    }
  };

  const handleEdit = (lead: LeadWithOwner) => {
    if (can('update', 'leads', lead)) {
      setEditingLead(lead);
      setShowForm(true);
    }
  };

  const handleDelete = (lead: LeadWithOwner) => {
    if (can('delete', 'leads', lead)) {
      setLeadToDelete(lead);
      setDeleteOpen(true);
    }
  };

  const handleConvert = (lead: LeadWithOwner) => {
    if (can('update', 'leads', lead)) {
      setLeadToConvert(lead);
      setShowConvertDialog(true);
    }
  };

  const confirmDelete = () => {
    if (leadToDelete?.id) {
      deleteMutation.mutate(leadToDelete.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const handleConvertSuccess = (clientId: string) => {
    setShowConvertDialog(false);
    setLeadToConvert(null);
    // Navigate to client details
    navigate(`/clients/${clientId}`);
    // Refresh leads list
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'جديد', variant: 'default' as const },
      contacted: { label: 'تم التواصل', variant: 'secondary' as const },
      qualified: { label: 'مؤهل', variant: 'success' as const },
      unqualified: { label: 'غير مؤهل', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSourceLabel = (source: string) => {
    const sourceLabels = {
      website: 'الموقع الإلكتروني',
      referral: 'إحالة',
      ads: 'إعلانات',
      social: 'وسائل التواصل',
      cold_call: 'اتصال بارد',
      other: 'أخرى'
    };
    
    return sourceLabels[source as keyof typeof sourceLabels] || source;
  };

  return (
    <div className="space-y-4">
      <PageHeader title={title}>
        {showAddButton && can('create', 'leads') && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            عميل محتمل جديد
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="البحث في الأسماء والبريد الإلكتروني والشركة..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        <div className="min-w-[120px]">
          <Select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="new">جديد</option>
            <option value="contacted">تم التواصل</option>
            <option value="qualified">مؤهل</option>
            <option value="unqualified">غير مؤهل</option>
          </Select>
        </div>

        <div className="min-w-[120px]">
          <Select
            value={selectedSource}
            onChange={(e) => handleSourceChange(e.target.value)}
          >
            <option value="">جميع المصادر</option>
            <option value="website">الموقع الإلكتروني</option>
            <option value="referral">إحالة</option>
            <option value="ads">إعلانات</option>
            <option value="social">وسائل التواصل</option>
            <option value="cold_call">اتصال بارد</option>
            <option value="other">أخرى</option>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      <DataTable
        data={displayLeads}
        searchableKeys={[]} // Disable local search since we have server-side search
        columns={[
          {
            key: 'first_name',
            header: 'الاسم',
            render: (lead: LeadWithOwner) => (
              <div>
                <div className="font-medium">
                  {lead.first_name && lead.last_name 
                    ? `${lead.first_name} ${lead.last_name}`
                    : lead.first_name || lead.company || '-'
                  }
                </div>
                {lead.email && (
                  <div className="text-sm text-gray-500">{lead.email}</div>
                )}
              </div>
            )
          },
          {
            key: 'company',
            header: 'الشركة',
            render: (lead: LeadWithOwner) => lead.company || '-'
          },
          {
            key: 'source',
            header: 'المصدر',
            render: (lead: LeadWithOwner) => getSourceLabel(lead.source || 'other')
          },
          {
            key: 'status',
            header: 'الحالة',
            render: (lead: LeadWithOwner) => getStatusBadge(lead.status || 'new')
          },
          {
            key: 'owner',
            header: 'المسؤول',
            render: (lead: LeadWithOwner) => lead.owner?.full_name || '-'
          },
          {
            key: 'created_at',
            header: 'تاريخ الإنشاء',
            render: (lead: LeadWithOwner) => 
              lead.created_at ? new Date(lead.created_at).toLocaleDateString('ar-SA') : '-'
          },
          {
            key: 'id' as keyof LeadWithOwner,
            header: 'الإجراءات',
            render: (lead: LeadWithOwner) => (
              <div className="flex gap-2">
                {can('view', 'leads', lead) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleView(lead)}
                    title="عرض"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {can('update', 'leads', lead) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(lead)}
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {can('update', 'leads', lead) && lead.status !== 'qualified' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConvert(lead)}
                    title="تحويل إلى عميل"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>
                )}
                {can('delete', 'leads', lead) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(lead)}
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )
          }
        ]}
        loading={isLoading}
      />

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            onClick={loadMore}
            disabled={isFetching}
          >
            {isFetching ? 'جاري التحميل...' : 'عرض المزيد'}
          </Button>
        </div>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <Modal
          open={showForm}
          onClose={handleFormClose}
          title={editingLead ? 'تعديل العميل المحتمل' : 'إضافة عميل محتمل جديد'}
        >
          <LeadForm
            lead={editingLead}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {/* Convert Lead Dialog */}
      {showConvertDialog && leadToConvert && (
        <ConvertLeadDialog
          lead={leadToConvert}
          open={showConvertDialog}
          onClose={() => {
            setShowConvertDialog(false);
            setLeadToConvert(null);
          }}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="حذف العميل المحتمل"
        message={`سيتم حذف ${leadToDelete?.first_name || leadToDelete?.company || 'العميل المحتمل'}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}