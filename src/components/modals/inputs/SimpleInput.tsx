import { Eye } from "lucide-react";
import React, { forwardRef, useState } from "react";
import { useFormContext } from "react-hook-form";

interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const SimpleInput = forwardRef<HTMLInputElement, SimpleInputProps>(
  ({ label, icon, name, type, ...props }, ref) => {
    // ✅ SAFE: prevents crash when no FormProvider exists
    let formState: any = null;
    try {
      formState = useFormContext()?.formState;
    } catch {
      formState = null;
    }

    const error = name && formState ? formState.errors?.[name] : undefined;
    const [visibility, setVisibility] = useState(type || "text");

    return (
      <div className="w-full space-y-2">
        {label && (
          <div className="fieldset-label font-semibold">
            <span className="text-sm">{label}</span>
          </div>
        )}

        <div
          className={`input input-md text-sm  input-bordered flex items-center gap-2 w-full ${
            error ? "input-error" : ""
          }`}
        >
          {icon}
          <input
            {...props}
            name={name}
            ref={ref}
            type={visibility}
            className="grow"
          />

          {type === "password" && (
            <button
              type="button"
              onClick={() =>
                setVisibility(visibility === "password" ? "text" : "password")
              }
              className="btn btn-sm btn-square btn-ghost"
            >
              <Eye size={16} />
            </button>
          )}
        </div>

        {error && <p className="text-error text-sm mt-1">{error.message}</p>}
      </div>
    );
  },
);

SimpleInput.displayName = "SimpleInput";
export default SimpleInput;
