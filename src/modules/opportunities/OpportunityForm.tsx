import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useFormZod } from '@/hooks/useFormZod';

import { 
  OpportunitySchema, 
  createOpportunity, 
  updateOpportunity, 
  type Opportunity, 
  type OpportunityWithDetails 
} from '@/lib/opportunities';
import { listClients } from '@/services/clientsService';
import { listContacts } from '@/lib/contacts';
import { useAuthz } from '@/lib/useAuthz';
import { useAuth } from '@/app/auth/AuthProvider';

interface OpportunityFormProps {
  opportunity?: OpportunityWithDetails | null; // For editing
  onSuccess: () => void;
  onCancel: () => void;
  defaultStageId?: string; // When creating from specific stage
  stages?: Array<{ id: string; name: string; probability: number }>; // Available stages
}

export function OpportunityForm({ 
  opportunity, 
  onSuccess, 
  onCancel, 
  defaultStageId,
  stages = []
}: OpportunityFormProps) {
  const queryClient = useQueryClient();
  const { can } = useAuthz();
  const { user } = useAuth();
  const isEditing = !!opportunity;

  // Form validation
  const form = useFormZod(OpportunitySchema, {
    defaultValues: {
      name: opportunity?.name || '',
      client_id: opportunity?.client_id || '',
      stage_id: opportunity?.stage_id || defaultStageId || '',
      amount: opportunity?.amount || 0,
      probability: opportunity?.probability || 0,
      close_date: opportunity?.close_date || '',
      owner_id: opportunity?.owner_id || user?.id || '',
      contact_id: opportunity?.contact_id || '',
      notes: opportunity?.notes || ''
    }
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients
  });

  // Fetch contacts for dropdown (filtered by selected client)
  const selectedClientId = form.watch('client_id');
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', { clientId: selectedClientId }],
    queryFn: () => listContacts({ clientId: selectedClientId || undefined }),
    enabled: !!selectedClientId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Opportunity) => createOpportunity(data, user?.id),
    onSuccess: () => {
      toast.success('تم إنشاء الفرصة بنجاح');
      // Invalidate pipeline and opportunities queries
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating opportunity:', error);
      toast.error('حدث خطأ أثناء إنشاء الفرصة');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Opportunity> }) => 
      updateOpportunity(id, data),
    onSuccess: (_, { id }) => {
      toast.success('تم تحديث الفرصة بنجاح');
      // Invalidate pipeline and opportunity queries
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating opportunity:', error);
      toast.error('فشل في تحديث الفرصة');
    },
  });

  const handleSubmit = (data: Opportunity) => {
    // Validate contact-client relationship if contact is selected
    if (data.contact_id && data.client_id) {
      const selectedContact = contacts.find(c => c.id === data.contact_id);
      if (selectedContact && selectedContact.client_id !== data.client_id) {
        toast.error('جهة الاتصال المختارة لا تنتمي للعميل المحدد');
        return;
      }
    }

    if (isEditing) {
      if (!can('update', 'opportunities', opportunity)) {
        toast.error('ليس لديك صلاحية لتحديث هذه الفرصة');
        return;
      }
      updateMutation.mutate({ id: opportunity.id!, data });
    } else {
      if (!can('create', 'opportunities')) {
        toast.error('ليس لديك صلاحية لإنشاء فرصة جديدة');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Currency options
  const currencyOptions = [
    { value: 'SAR', label: 'ريال سعودي (SAR)' },
    { value: 'USD', label: 'دولار أمريكي (USD)' },
    { value: 'EUR', label: 'يورو (EUR)' }
  ];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Opportunity Name */}
      <div>
        <Input
          label="اسم الفرصة *"
          placeholder="أدخل اسم الفرصة"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
          disabled={isLoading}
        />
      </div>

      {/* Client Selection */}
      <div>
        <Select
          label="العميل *"
          placeholder="اختر العميل"
          options={clients.map(client => ({
            value: client.id,
            label: client.name
          }))}
          {...form.register('client_id')}
          error={form.formState.errors.client_id?.message}
          disabled={isLoading}
        />
      </div>

      {/* Contact Selection */}
      {selectedClientId && (
        <div>
          <Select
            label="جهة الاتصال"
            placeholder="اختر جهة الاتصال (اختياري)"
            options={[
              { value: '', label: 'بدون جهة اتصال' },
              ...contacts.map(contact => ({
                value: contact.id!,
                label: `${contact.first_name} ${contact.last_name || ''}`.trim()
              }))
            ]}
            {...form.register('contact_id')}
            error={form.formState.errors.contact_id?.message}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Stage Selection */}
      {stages.length > 0 && (
        <div>
          <Select
            label="المرحلة *"
            placeholder="اختر المرحلة"
            options={stages.map(stage => ({
              value: stage.id,
              label: `${stage.name} (${stage.probability}%)`
            }))}
            {...form.register('stage_id')}
            error={form.formState.errors.stage_id?.message}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Amount and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            label="المبلغ"
            placeholder="0"
            min="0"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            error={form.formState.errors.amount?.message}
            disabled={isLoading}
          />
        </div>
        <div>
          <Select
            label="العملة"
            placeholder="اختر العملة"
            options={currencyOptions}
            defaultValue="SAR"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Probability */}
      <div>
        <Input
          type="number"
          label="الاحتمالية (%)"
          placeholder="0"
          min="0"
          max="100"
          {...form.register('probability', { valueAsNumber: true })}
          error={form.formState.errors.probability?.message}
          disabled={isLoading}
        />
      </div>

      {/* Close Date */}
      <div>
        <Input
          type="date"
          label="تاريخ الإغلاق المتوقع"
          {...form.register('close_date')}
          error={form.formState.errors.close_date?.message}
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div>
        <Textarea
          label="ملاحظات"
          placeholder="أدخل أي ملاحظات إضافية..."
          rows={4}
          {...form.register('notes')}
          error={form.formState.errors.notes?.message}
          disabled={isLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={!form.formState.isValid}
        >
          {isEditing ? 'تحديث الفرصة' : 'إنشاء الفرصة'}
        </Button>
      </div>
    </form>
  );
}