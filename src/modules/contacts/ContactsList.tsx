import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/table/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Modal from '@/components/ui/Modal';

import { useAuthz } from '@/lib/useAuthz';
import { listContacts, deleteContact, type ContactWithClient } from '@/lib/contacts';
import { listClients } from '@/services/clientsService';
import ContactForm from './ContactForm';

interface ContactsListProps {
  clientId?: string; // When used as a tab in client details
  title?: string;
  showAddButton?: boolean;
}

export default function ContactsList({ 
  clientId, 
  title = 'جهات الاتصال', 
  showAddButton = true 
}: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithClient | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ContactWithClient | null>(null);
  const [page, setPage] = useState(1);
  const [allContacts, setAllContacts] = useState<ContactWithClient[]>([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuthz();

  // Fetch contacts with filters and pagination
  const { data: contacts = [], isLoading, isFetching } = useQuery({
    queryKey: ['contacts', { q: searchQuery, clientId: selectedClientId, ownerId: selectedOwnerId, page }],
    queryFn: () => listContacts({ 
      q: searchQuery || undefined, 
      clientId: selectedClientId || undefined,
      ownerId: selectedOwnerId || undefined,
      page,
      limit: 25
    }),
    onSuccess: (newContacts) => {
      if (page === 1) {
        setAllContacts(newContacts);
      } else {
        setAllContacts(prev => [...prev, ...newContacts]);
      }
    }
  });

  // Reset pagination when filters change
  const resetPagination = () => {
    setPage(1);
    setAllContacts([]);
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPagination();
  };

  const handleClientChange = (value: string) => {
    setSelectedClientId(value);
    resetPagination();
  };

  const handleOwnerChange = (value: string) => {
    setSelectedOwnerId(value);
    resetPagination();
  };

  // Load more contacts
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Check if there are more contacts to load
  const hasMore = contacts.length === 25;
  const displayContacts = page === 1 ? contacts : allContacts;

  // Fetch clients for filter dropdown (only if not in client details)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
    enabled: !clientId // Only fetch if not filtering by specific client
  });

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onMutate: async (contactId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      // Snapshot previous value
      const previousContacts = queryClient.getQueryData(['contacts', { q: searchQuery, clientId: selectedClientId, ownerId: selectedOwnerId }]);
      
      // Optimistically remove contact
      queryClient.setQueryData(
        ['contacts', { q: searchQuery, clientId: selectedClientId, ownerId: selectedOwnerId }],
        (old: ContactWithClient[] = []) => old.filter(c => c.id !== contactId)
      );
      
      return { previousContacts };
    },
    onError: (err, contactId, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(
          ['contacts', { q: searchQuery, clientId: selectedClientId, ownerId: selectedOwnerId }],
          context.previousContacts
        );
      }
      toast.error('حدث خطأ أثناء حذف جهة الاتصال');
    },
    onSuccess: () => {
      toast.success('تم حذف جهة الاتصال بنجاح');
      setDeleteOpen(false);
      setContactToDelete(null);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  const handleView = (contact: ContactWithClient) => {
    if (can('view', 'contacts', contact)) {
      navigate(`/contacts/${contact.id}`);
    }
  };

  const handleEdit = (contact: ContactWithClient) => {
    if (can('update', 'contacts', contact)) {
      setEditingContact(contact);
      setShowForm(true);
    }
  };

  const handleDelete = (contact: ContactWithClient) => {
    if (can('delete', 'contacts', contact)) {
      setContactToDelete(contact);
      setDeleteOpen(true);
    }
  };

  const confirmDelete = () => {
    if (contactToDelete?.id) {
      deleteMutation.mutate(contactToDelete.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return (
    <div className="space-y-4">
      <PageHeader title={title}>
        {showAddButton && can('create', 'contacts') && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            جهة اتصال جديدة
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="البحث في الأسماء والبريد الإلكتروني..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        {!clientId && (
          <div className="min-w-[150px]">
            <Select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
            >
              <option value="">جميع العملاء</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <DataTable
        data={displayContacts}
        columns={[
          {
            key: 'first_name',
            header: 'الاسم',
            render: (contact: ContactWithClient) => (
              <div>
                <div className="font-medium">
                  {contact.first_name} {contact.last_name || ''}
                </div>
                {contact.position && (
                  <div className="text-sm text-gray-500">{contact.position}</div>
                )}
              </div>
            )
          },
          {
            key: 'client',
            header: 'العميل',
            render: (contact: ContactWithClient) => (
              <div>
                {contact.client?.name || '-'}
                {contact.company && contact.company !== contact.client?.name && (
                  <div className="text-sm text-gray-500">{contact.company}</div>
                )}
              </div>
            )
          },
          { key: 'email', header: 'البريد الإلكتروني' },
          { key: 'phone', header: 'الهاتف' },
          {
            key: 'owner',
            header: 'المسؤول',
            render: (contact: ContactWithClient) => contact.owner?.full_name || '-'
          },
          {
            key: 'created_at',
            header: 'تاريخ الإنشاء',
            render: (contact: ContactWithClient) => 
              contact.created_at ? new Date(contact.created_at).toLocaleDateString('ar-SA') : '-'
          },
          {
            key: 'id' as keyof ContactWithClient,
            header: 'الإجراءات',
            render: (contact: ContactWithClient) => (
              <div className="flex gap-2">
                {can('view', 'contacts', contact) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleView(contact)}
                    title="عرض"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {can('update', 'contacts', contact) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(contact)}
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {can('delete', 'contacts', contact) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(contact)}
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

      {/* Contact Form Modal */}
      {showForm && (
        <Modal
          open={showForm}
          onClose={handleFormClose}
          title={editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
        >
          <ContactForm
            contact={editingContact}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
            defaultClientId={clientId}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="حذف جهة الاتصال"
        message={`سيتم حذف ${contactToDelete?.first_name} ${contactToDelete?.last_name || ''}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}