import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useFormZod } from '@/hooks/useFormZod';

import { LeadSchema, createLead, updateLead, type Lead, type LeadWithOwner } from '@/lib/leads';
import { useAuthz } from '@/lib/useAuthz';

interface LeadFormProps {
  lead?: LeadWithOwner | null; // For editing
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LeadForm({ 
  lead, 
  onSuccess, 
  onCancel
}: LeadFormProps) {
  const queryClient = useQueryClient();
  const { can } = useAuthz();
  const isEditing = !!lead;

  // Form validation
  const form = useFormZod(LeadSchema, {
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    company: lead?.company || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    source: lead?.source || 'other',
    status: lead?.status || 'new',
    score: lead?.score || 0,
    notes: lead?.notes || ''
  });

  // Create mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: createLead,
    onMutate: async (newLead) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      
      // Create optimistic lead
      const optimisticLead: LeadWithOwner = {
        ...newLead,
        id: `temp-${Date.now()}`, // Temporary ID
        created_at: new Date().toISOString()
      };
      
      // Add to all relevant queries
      queryClient.setQueriesData(
        { queryKey: ['leads'] },
        (old: LeadWithOwner[] = []) => [optimisticLead, ...old]
      );
      
      return { optimisticLead };
    },
    onError: (err, newLead, context) => {
      // Remove optimistic lead on error
      if (context?.optimisticLead) {
        queryClient.setQueriesData(
          { queryKey: ['leads'] },
          (old: LeadWithOwner[] = []) => 
            old.filter(l => l.id !== context.optimisticLead.id)
        );
      }
      toast.error('حدث خطأ أثناء إضافة العميل المحتمل');
    },
    onSuccess: () => {
      toast.success('تم إضافة العميل المحتمل بنجاح');
      onSuccess();
    },
    onSettled: () => {
      // Always refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => 
      updateLead(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData({ queryKey: ['leads'] });
      
      // Optimistically update lead
      queryClient.setQueriesData(
        { queryKey: ['leads'] },
        (old: LeadWithOwner[] = []) => 
          old.map(l => l.id === id ? { ...l, ...data } : l)
      );
      
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('حدث خطأ أثناء تعديل العميل المحتمل');
    },
    onSuccess: () => {
      toast.success('تم تعديل العميل المحتمل بنجاح');
      onSuccess();
    },
    onSettled: () => {
      // Always refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      form.reset({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'other',
        status: lead.status || 'new',
        score: lead.score || 0,
        notes: lead.notes || ''
      });
    }
  }, [lead, form]);

  const onSubmit = (values: Lead) => {
    // Check permissions
    if (isEditing && !can('update', 'leads', lead)) {
      toast.error('ليس لديك صلاحية لتعديل هذا العميل المحتمل');
      return;
    }
    if (!isEditing && !can('create', 'leads')) {
      toast.error('ليس لديك صلاحية لإضافة عملاء محتملين');
      return;
    }

    if (isEditing && lead?.id) {
      updateMutation.mutate({ id: lead.id, data: values });
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
            placeholder="الاسم الأول"
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

      {/* Company */}
      <div>
        <Input
          placeholder="اسم الشركة"
          {...form.register('company')}
          error={form.formState.errors.company?.message}
        />
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

      {/* Source & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            {...form.register('source')}
            error={form.formState.errors.source?.message}
          >
            <option value="website">الموقع الإلكتروني</option>
            <option value="referral">إحالة</option>
            <option value="ads">إعلانات</option>
            <option value="social">وسائل التواصل</option>
            <option value="cold_call">اتصال بارد</option>
            <option value="other">أخرى</option>
          </Select>
        </div>
        <div>
          <Select
            {...form.register('status')}
            error={form.formState.errors.status?.message}
          >
            <option value="new">جديد</option>
            <option value="contacted">تم التواصل</option>
            <option value="qualified">مؤهل</option>
            <option value="unqualified">غير مؤهل</option>
          </Select>
        </div>
      </div>

      {/* Score */}
      <div>
        <Input
          placeholder="النقاط (0-100)"
          type="number"
          min="0"
          max="100"
          {...form.register('score', { valueAsNumber: true })}
          error={form.formState.errors.score?.message}
        />
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

      {/* Validation Message */}
      {form.formState.errors.root && (
        <div className="text-red-600 text-sm">
          {form.formState.errors.root.message}
        </div>
      )}

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