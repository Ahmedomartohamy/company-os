import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Plus } from 'lucide-react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';

import { convertLead, type LeadWithOwner } from '@/lib/leads';
import { listClients } from '@/services/clientsService';
import { useAuthz } from '@/lib/useAuthz';

interface ConvertLeadDialogProps {
  lead: LeadWithOwner;
  open: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

export default function ConvertLeadDialog({
  lead,
  open,
  onClose,
  onSuccess,
}: ConvertLeadDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [createNewClient, setCreateNewClient] = useState(false);
  const [createContact, setCreateContact] = useState(true);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const { can } = useAuthz();

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
    enabled: !createNewClient,
  });

  // Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: convertLead,
    onSuccess: (result) => {
      if (result.client_id) {
        toast.success('تم تحويل العميل المحتمل بنجاح');
        onSuccess(result.client_id);
      } else {
        toast.error('حدث خطأ أثناء التحويل');
      }
    },
    onError: (error) => {
      console.error('Convert lead error:', error);
      toast.error('حدث خطأ أثناء تحويل العميل المحتمل');
    },
  });

  const handleConvert = () => {
    // Validation
    if (!createNewClient && !selectedClientId) {
      toast.error('يرجى اختيار عميل أو تفعيل إنشاء عميل جديد');
      return;
    }

    if (createNewClient && !lead.company) {
      toast.error('يجب أن يحتوي العميل المحتمل على اسم شركة لإنشاء عميل جديد');
      return;
    }

    // Check permissions
    if (!can('update', 'leads', lead)) {
      toast.error('ليس لديك صلاحية لتحويل هذا العميل المحتمل');
      return;
    }

    convertMutation.mutate({
      leadId: lead.id!,
      clientId: createNewClient ? undefined : selectedClientId,
      createClient: createNewClient,
      createContact,
    });
  };

  const handleClose = () => {
    if (!convertMutation.isPending) {
      onClose();
    }
  };

  const isLoading = convertMutation.isPending;

  return (
    <Modal open={open} onClose={handleClose} title="تحويل العميل المحتمل">
      <div className="space-y-6">
        {/* Lead Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">معلومات العميل المحتمل</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">الاسم:</span>{' '}
              {lead.first_name && lead.last_name
                ? `${lead.first_name} ${lead.last_name}`
                : lead.first_name || lead.company || '-'}
            </div>
            {lead.company && (
              <div>
                <span className="font-medium">الشركة:</span> {lead.company}
              </div>
            )}
            {lead.email && (
              <div>
                <span className="font-medium">البريد الإلكتروني:</span> {lead.email}
              </div>
            )}
            {lead.phone && (
              <div>
                <span className="font-medium">الهاتف:</span> {lead.phone}
              </div>
            )}
          </div>
        </div>

        {/* Client Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="create-new-client"
              checked={createNewClient}
              onCheckedChange={(checked) => {
                setCreateNewClient(checked as boolean);
                if (checked) {
                  setSelectedClientId('');
                }
              }}
            />
            <label htmlFor="create-new-client" className="text-sm font-medium">
              إنشاء عميل جديد من اسم الشركة
            </label>
          </div>

          {createNewClient ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                سيتم إنشاء عميل جديد باسم:{' '}
                <span className="font-medium">{lead.company || 'غير محدد'}</span>
              </p>
              {!lead.company && (
                <p className="text-sm text-red-600 mt-2">
                  تحذير: لا يحتوي العميل المحتمل على اسم شركة
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث عن عميل..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              <Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">اختر عميل موجود</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Contact Creation Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="create-contact"
              checked={createContact}
              onCheckedChange={(checked) => setCreateContact(checked as boolean)}
            />
            <label htmlFor="create-contact" className="text-sm font-medium">
              إنشاء جهة اتصال من معلومات العميل المحتمل
            </label>
          </div>

          {createContact && (
            <div className="bg-green-50 p-3 rounded text-sm text-green-800">
              سيتم إنشاء جهة اتصال جديدة بالمعلومات المتوفرة من العميل المحتمل
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isLoading || (!createNewClient && !selectedClientId)}
          >
            {isLoading ? 'جاري التحويل...' : 'تحويل إلى عميل'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
