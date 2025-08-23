import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useFormZod } from '@/hooks/useFormZod';

import { ContactSchema, createContact, updateContact, type Contact, type ContactWithClient } from '@/lib/contacts';
import { listClients } from '@/services/clientsService';
import { useAuthz } from '@/lib/useAuthz';

interface ContactFormProps {
  contact?: ContactWithClient | null; // For editing
  onSuccess: () => void;
  onCancel: () => void;
  defaultClientId?: string; // When creating from client details
}

export default function ContactForm({ 
  contact, 
  onSuccess, 
  onCancel, 
  defaultClientId 
}: ContactFormProps) {
  const queryClient = useQueryClient();
  const { can } = useAuthz();
  const isEditing = !!contact;

  // Form validation
  const form = useFormZod(ContactSchema, {
    defaultValues: {
      first_name: contact?.first_name || '',
      last_name: contact?.last_name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      position: contact?.position || '',
      client_id: contact?.client_id || defaultClientId || '',
      notes: contact?.notes || ''
    }
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients
  });

  // Create mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: createContact,
    onMutate: async (newContact) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      // Create optimistic contact
      const optimisticContact: ContactWithClient = {
        ...newContact,
        id: `temp-${Date.now()}`, // Temporary ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: clients.find(c => c.id === newContact.client_id) || undefined
      };
      
      // Add to all relevant queries
      queryClient.setQueriesData(
        { queryKey: ['contacts'] },
        (old: ContactWithClient[] = []) => [optimisticContact, ...old]
      );
      
      return { optimisticContact };
    },
    onError: (err, newContact, context) => {
      // Remove optimistic contact on error
      if (context?.optimisticContact) {
        queryClient.setQueriesData(
          { queryKey: ['contacts'] },
          (old: ContactWithClient[] = []) => 
            old.filter(c => c.id !== context.optimisticContact.id)
        );
      }
      toast.error('حدث خطأ أثناء إضافة جهة الاتصال');
    },
    onSuccess: () => {
      toast.success('تم إضافة جهة الاتصال بنجاح');
      onSuccess();
    },
    onSettled: () => {
      // Always refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) => 
      updateContact(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      // Snapshot previous value
      const previousContacts = queryClient.getQueriesData({ queryKey: ['contacts'] });
      
      // Optimistically update contact
      queryClient.setQueriesData(
        { queryKey: ['contacts'] },
        (old: ContactWithClient[] = []) => 
          old.map(c => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c)
      );
      
      return { previousContacts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('حدث خطأ أثناء تعديل جهة الاتصال');
    },
    onSuccess: () => {
      toast.success('تم تعديل جهة الاتصال بنجاح');
      onSuccess();
    },
    onSettled: () => {
      // Always refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      form.reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        position: contact.position || '',
        client_id: contact.client_id || '',
        notes: contact.notes || ''
      });
    }
  }, [contact, form]);

  const onSubmit = (values: Contact) => {
    // Check permissions
    if (isEditing && !can('update', 'contacts', contact)) {
      toast.error('ليس لديك صلاحية لتعديل جهة الاتصال هذه');
      return;
    }
    if (!isEditing && !can('create', 'contacts')) {
      toast.error('ليس لديك صلاحية لإضافة جهات اتصال');
      return;
    }

    if (isEditing && contact?.id) {
      updateMutation.mutate({ id: contact.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="الاسم الأول *"
            {...form.register('first_name')}
            error={form.formState.errors.first_name?.message}
          />
        </div>
        <div>
          <Input
            placeholder="الاسم الأخير"
            {...form.register('last_name')}
            error={form.formState.errors.last_name?.message}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="البريد الإلكتروني"
            type="email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
        </div>
        <div>
          <Input
            placeholder="رقم الهاتف"
            {...form.register('phone')}
            error={form.formState.errors.phone?.message}
          />
        </div>
      </div>

      {/* Company & Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="الشركة"
            {...form.register('company')}
            error={form.formState.errors.company?.message}
          />
        </div>
        <div>
          <Input
            placeholder="المنصب"
            {...form.register('position')}
            error={form.formState.errors.position?.message}
          />
        </div>
      </div>

      {/* Client Selection */}
      <div>
        <Select
          {...form.register('client_id')}
          error={form.formState.errors.client_id?.message}
        >
          <option value="">اختر العميل (اختياري)</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Notes */}
      <div>
        <Textarea
          placeholder="ملاحظات"
          rows={3}
          {...form.register('notes')}
          error={form.formState.errors.notes?.message}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'جاري الحفظ...' : (isEditing ? 'تعديل' : 'إضافة')}
        </Button>
      </div>
    </form>
  );
}