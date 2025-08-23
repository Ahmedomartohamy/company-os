import { PropsWithChildren } from "react";
type ModalProps = PropsWithChildren<{ open: boolean; onClose?: () => void; title?: string }>;
function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30" onClick={onClose}>
      <div className="w-[min(92vw,700px)] rounded-2xl bg-white p-6 shadow-card" onClick={(e)=>e.stopPropagation()}>
        {title ? <div className="mb-4 text-lg font-semibold">{title}</div> : null}
        <div>{children}</div>
        {onClose ? <div className="mt-4 flex justify-end"><button onClick={onClose} className="rounded-xl px-3 py-2 text-sm hover:bg-black/5">إغلاق</button></div> : null}
      </div>
    </div>
  );
}
export default Modal;
export { Modal };
