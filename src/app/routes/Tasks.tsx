import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import { Task, TaskSchema } from "../../types/task";
import DataTable from "../../components/table/DataTable";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useFormZod } from "../../hooks/useFormZod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { listTasks, createTask, updateTask, deleteTask } from "../../services/tasksService";

export default function TasksPage(){
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: listTasks
  });

  const createForm = useFormZod(TaskSchema);
  const editForm = useFormZod(TaskSchema);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      toast.success("تم إضافة المهمة بنجاح");
      createForm.reset();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة المهمة");
      console.error('Error creating task:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditOpen(false);
      setSelected(null);
      toast.success("تم تعديل المهمة بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تعديل المهمة");
      console.error('Error updating task:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("تم حذف المهمة بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف المهمة");
      console.error('Error deleting task:', error);
    }
  });

  function onCreate(values: Task){
    createMutation.mutate(values);
  }

  function onEdit(values: Task){
    if (!selected?.id) return;
    updateMutation.mutate({ id: selected.id, data: values });
  }

  function requestEdit(row: Task){
    setSelected(row);
    editForm.reset(row);
    setEditOpen(true);
  }

  function requestDelete(row: Task){
    setSelected(row);
    setDeleteOpen(true);
  }

  function onDelete(){
    if (!selected?.id) return;
    deleteMutation.mutate(selected.id);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="المهام">
        <Button onClick={()=>setOpen(true)}>مهمة جديدة</Button>
      </PageHeader>

      <DataTable<Task>
        data={rows}
        columns={[
          { key: "title", header: "العنوان" },
          { key: "assignee", header: "المسند إليه" },
          { key: "status", header: "الحالة" },
          { key: "dueDate", header: "تاريخ الاستحقاق" },
          { key: "id", header: "إجراءات", render: (row) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={()=>requestEdit(row)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="danger" size="sm" onClick={()=>requestDelete(row)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ) },
        ]}
        searchableKeys={["title","assignee","status"]}
        loading={isLoading}
      />

      {/* Create Modal */}
      <Modal open={open} onClose={()=>setOpen(false)} title="إضافة مهمة">
        <form className="space-y-3" onSubmit={createForm.handleSubmit(onCreate)}>
          <Input placeholder="عنوان المهمة" {...createForm.register("title")} />
          <Input placeholder="وصف المهمة" {...createForm.register("description")} />
          <Input placeholder="المسند إليه" {...createForm.register("assignee")} />
          <Select
            {...createForm.register("status")}
            options={[
              { value: "pending", label: "معلقة" },
              { value: "in_progress", label: "قيد التنفيذ" },
              { value: "completed", label: "مكتملة" }
            ]}
            placeholder="اختر الحالة"
          />
          <Select
            {...createForm.register("priority")}
            options={[
              { value: "low", label: "منخفضة" },
              { value: "medium", label: "متوسطة" },
              { value: "high", label: "عالية" }
            ]}
            placeholder="اختر الأولوية"
          />
          <Input placeholder="تاريخ الاستحقاق" type="date" {...createForm.register("due_date")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={()=>setOpen(false)}>إلغاء</Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="تعديل مهمة">
        <form className="space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
          <Input placeholder="عنوان المهمة" {...editForm.register("title")} />
          <Input placeholder="وصف المهمة" {...editForm.register("description")} />
          <Input placeholder="المسند إليه" {...editForm.register("assignee")} />
          <Select
            {...editForm.register("status")}
            options={[
              { value: "pending", label: "معلقة" },
              { value: "in_progress", label: "قيد التنفيذ" },
              { value: "completed", label: "مكتملة" }
            ]}
            placeholder="اختر الحالة"
          />
          <Select
            {...editForm.register("priority")}
            options={[
              { value: "low", label: "منخفضة" },
              { value: "medium", label: "متوسطة" },
              { value: "high", label: "عالية" }
            ]}
            placeholder="اختر الأولوية"
          />
          <Input placeholder="تاريخ الاستحقاق" type="date" {...editForm.register("due_date")} />
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
        title="حذف مهمة"
        message={`سيتم حذف ${selected?.title ?? "هذه المهمة"}. لا يمكن التراجع عن هذه العملية.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
