import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type PropsWithChildren,
} from "react";
import { Toaster } from "sonner";
import { X } from "lucide-react"; // Import the X icon

interface ModalProps extends PropsWithChildren {
  actions?: any;
  actionName?: string;
  title?: string; // Added title prop for better UI
}

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

const Modal = forwardRef<ModalHandle, ModalProps>(
  ({ children, actions, actionName, title }, ref) => {
    const modalRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        modalRef.current?.showModal();
      },
      close: () => {
        modalRef.current?.close();
      },
    }));

    return (
      <dialog ref={modalRef} className="modal modal-middle sm:modal-middle">
        <Toaster theme="dark" richColors />
        <div className="modal-box bg-white max-w-2xl flex flex-col max-h-[90vh]  rounded-lg shadow-xl relative p-0">
          <div className="flex border-b fade py-4 items-center px-4">
            {title && <h3 className="font-bold text-lg ">{title}</h3>}
            <form method="dialog" className="ml-auto">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:text-gray-700"
                onClick={() => modalRef.current?.close()}
              >
                <X size={20} />
              </button>
            </form>
          </div>
          {children && <div className="my-3 p-4">{children}</div>}
          {actions && (
            <div className=" flex justify-end gap-2 fade sticky bottom-0 p-4 bg-white border-t">
              {actions}
            </div>
          )}
        </div>
      </dialog>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
