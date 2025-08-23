import Modal from '@/components/ui/Modal';

export default function ConfirmDialog({
  open,
  title = 'تأكيد',
  message = 'هل أنت متأكد؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm hover:bg-black/5">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
