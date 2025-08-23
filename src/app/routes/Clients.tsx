import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import { Client, ClientSchema } from "../../types/client";
import DataTable from "../../components/table/DataTable";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useFormZod } from "../../hooks/useFormZod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { listClients, createClient, updateClient, deleteClient } from "../../services/clientsService";

export default function ClientsPage(){
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  
  const queryClient = useQueryClient();
  
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients
  });

  const createForm = useFormZod(ClientSchema);
  const editForm = useFormZod(ClientSchema);

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setOpen(false);
      toast.success("تم إضافة العميل بنجاح");
      createForm.reset();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة العميل");
      console.error('Error creating client:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditOpen(false);
      setSelected(null);
      toast.success("تم تعديل بيانات العميل");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تعديل العميل");
      console.error('Error updating client:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("تم حذف العميل بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف العميل");
      console.error('Error deleting client:', error);
    }
  });

  function onCreate(values: Client){
    createMutation.mutate(values);
  }

  function onEdit(values: Client){
    if (!selected?.id) return;
    updateMutation.mutate({ id: selected.id, data: values });
  }

  function requestEdit(row: Client){
    setSelected(row);
    editForm.reset(row);
    setEditOpen(true);
  }

  function requestDelete(row: Client){
    setSelected(row);
    setDeleteOpen(true);
  }

  function onDelete(){
    if (!selected?.id) return;
    deleteMutation.mutate(selected.id);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="العملاء">
        <Button onClick={()=>setOpen(true)}>عميل جديد</Button>
      </PageHeader>

      <DataTable
        data={rows}
        searchableKeys={['name', 'email', 'phone', 'company']}
        columns={[
          { key: "name", header: "الاسم" },
          { key: "email", header: "البريد الإلكتروني" },
          { key: "phone", header: "الهاتف" },
          { key: "company", header: "الشركة" },
          {
            key: "id" as keyof Client,
            header: "الإجراءات",
            render: (client: Client) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => requestEdit(client)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => requestDelete(client)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]}
        loading={isLoading}
      />

      {/* Create Modal */}
      <Modal open={open} onClose={()=>setOpen(false)} title="إضافة عميل">
        <form className="space-y-3" onSubmit={createForm.handleSubmit(onCreate)}>
          <Input placeholder="اسم العميل" {...createForm.register("name")} />
          <Input placeholder="البريد الإلكتروني" type="email" {...createForm.register("email")} />
          <Input placeholder="رقم الهاتف" {...createForm.register("phone")} />
          <Input placeholder="اسم الشركة" {...createForm.register("company")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={()=>setOpen(false)}>إلغاء</Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="تعديل عميل">
        <form className="space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
          <Input placeholder="اسم العميل" {...editForm.register("name")} />
          <Input placeholder="البريد الإلكتروني" type="email" {...editForm.register("email")} />
          <Input placeholder="رقم الهاتف" {...editForm.register("phone")} />
          <Input placeholder="اسم الشركة" {...editForm.register("company")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={()=>setEditOpen(false)}>إلغاء</Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={()=>setDeleteOpen(false)}
        onConfirm={onDelete}
        title="حذف عميل"
        message={`سيتم حذف ${selected?.name ?? "هذا العميل"}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
