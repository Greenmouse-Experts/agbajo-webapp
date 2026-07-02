import React, { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

interface LocalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const LocalSelect = forwardRef<HTMLSelectElement, LocalSelectProps>(
  ({ children, className, label, ...props }, ref) => {
    return (
      <div className="w-full flex-1 ">
        {label && (
          <div className="fieldset-label font-semibold  mb-2">
            <span className="text-sm">{label}</span>
          </div>
        )}
        <select
          ref={ref}
          className={`select flex-1 select-bordered w-full  ${className || ""}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  },
);

LocalSelect.displayName = "LocalSelect";

export default LocalSelect;
