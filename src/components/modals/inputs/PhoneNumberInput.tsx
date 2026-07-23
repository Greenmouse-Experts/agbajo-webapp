import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export { isValidPhoneNumber };

export default function PhoneNumberInput({
  value,
  onChange,
  onBlur,
  label = "Phone Number",
  error,
  required,
  className,
}: PhoneNumberInputProps) {
  return (
    <fieldset className="fieldset">
      {label && <legend className="fieldset-legend">{label}</legend>}
      <PhoneInput
        international
        defaultCountry="NG"
        countryCallingCodeEditable={false}
        placeholder="801 234 5678"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onBlur={onBlur}
        required={required}
        className={`input w-full items-center gap-2 ${error ? "input-error" : ""} ${className ?? ""}`}
      />
      {error && (
        <p className="fieldset-label text-error flex items-center gap-1 mt-1">
          <span className="w-3.5 h-3.5">!</span>
          {error}
        </p>
      )}
    </fieldset>
  );
}
