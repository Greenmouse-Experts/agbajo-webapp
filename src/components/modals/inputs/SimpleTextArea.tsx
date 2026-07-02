import React, { forwardRef } from "react";
import { useFormContext } from "react-hook-form";

interface SimpleTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: React.ReactNode;
}

const SimpleTextArea = forwardRef<HTMLTextAreaElement, SimpleTextAreaProps>(
  ({ label, icon, name, ...props }, ref) => {
    // ✅ SAFE: prevents crash when no FormProvider exists
    let formState: any = null;
    try {
      formState = useFormContext()?.formState;
    } catch {
      formState = null;
    }

    const error = name && formState ? formState.errors?.[name] : undefined;

    return (
      <div className=" w-full space-y-2 ">
        {label && (
          <div className="fieldset-label font-semibold">
            <span className="text-sm">{label}</span>
          </div>
        )}
        <div
          className={`textarea textarea-bordered flex items-center gap-2 w-full ${
            error ? "textarea-error" : ""
          }`}
        >
          {icon}
          <textarea className="grow" {...props} name={name} ref={ref} />
        </div>
        {error && <p className="text-error text-sm mt-1">{error.message}</p>}
      </div>
    );
  },
);

SimpleTextArea.displayName = "SimpleTextArea";

export default SimpleTextArea;
