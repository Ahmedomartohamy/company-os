import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import { Project, ProjectSchema } from "../../types/project";
import DataTable from "../../components/table/DataTable";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useFormZod } from "../../hooks/useFormZod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { listProjects, createProject, updateProject, deleteProject } from "../../services/projectsService";

export default function ProjectsPage(){
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  const queryClient = useQueryClient();
  
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects
  });

  const createForm = useFormZod(ProjectSchema);
  const editForm = useFormZod(ProjectSchema);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      toast.success("تم إضافة المشروع بنجاح");
      createForm.reset();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة المشروع");
      console.error('Error creating project:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditOpen(false);
      setSelected(null);
      toast.success("تم تعديل المشروع بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تعديل المشروع");
      console.error('Error updating project:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("تم حذف المشروع بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف المشروع");
      console.error('Error deleting project:', error);
    }
  });

  function onCreate(values: Project){
    createMutation.mutate(values);
  }

  function onEdit(values: Project){
    if (!selected?.id) return;
    updateMutation.mutate({ id: selected.id, data: values });
  }

  function requestEdit(row: Project){
    setSelected(row);
    editForm.reset(row);
    setEditOpen(true);
  }

  function requestDelete(row: Project){
    setSelected(row);
    setDeleteOpen(true);
  }

  function onDelete(){
    if (!selected?.id) return;
    deleteMutation.mutate(selected.id);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="المشاريع">
        <Button onClick={()=>setOpen(true)}>مشروع جديد</Button>
      </PageHeader>

      <DataTable<Project>
        data={rows}
        columns={[
          { key: "name", header: "الاسم" },
          { key: "status", header: "الحالة" },
          { key: "budget", header: "الميزانية" },
          { key: "id", header: "إجراءات", render: (row) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={()=>requestEdit(row)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="danger" size="sm" onClick={()=>requestDelete(row)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ) },
        ]}
        searchableKeys={["name","status"]}
        loading={isLoading}
      />

      {/* Create Modal */}
      <Modal open={open} onClose={()=>setOpen(false)} title="إضافة مشروع">
        <form className="space-y-3" onSubmit={createForm.handleSubmit(onCreate)}>
          <Input placeholder="اسم المشروع" {...createForm.register("name")} />
          <Input placeholder="وصف المشروع" {...createForm.register("description")} />
          <Select
            {...createForm.register("status")}
            options={[
              { value: "active", label: "نشط" },
              { value: "completed", label: "مكتمل" },
              { value: "on_hold", label: "معلق" }
            ]}
            placeholder="اختر الحالة"
          />
          <Input placeholder="الميزانية" type="number" step="0.01" {...createForm.register("budget", { valueAsNumber: true })} />
          <Input placeholder="تاريخ البداية" type="date" {...createForm.register("start_date")} />
          <Input placeholder="تاريخ النهاية" type="date" {...createForm.register("end_date")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={()=>setOpen(false)}>إلغاء</Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="تعديل مشروع">
        <form className="space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
          <Input placeholder="اسم المشروع" {...editForm.register("name")} />
          <Input placeholder="وصف المشروع" {...editForm.register("description")} />
          <Select
            {...editForm.register("status")}
            options={[
              { value: "active", label: "نشط" },
              { value: "completed", label: "مكتمل" },
              { value: "on_hold", label: "معلق" }
            ]}
            placeholder="اختر الحالة"
          />
          <Input placeholder="الميزانية" type="number" step="0.01" {...editForm.register("budget", { valueAsNumber: true })} />
          <Input placeholder="تاريخ البداية" type="date" {...editForm.register("start_date")} />
          <Input placeholder="تاريخ النهاية" type="date" {...editForm.register("end_date")} />
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
        title="حذف مشروع"
        message={`سيتم حذف ${selected?.name ?? "هذا المشروع"}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
