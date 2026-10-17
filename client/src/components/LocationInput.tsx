import { MapPin } from 'lucide-react';
import { useId, type ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Zusätzliches Bedienelement rechts im Feld, z. B. ein Ortungs-Button */
  action?: ReactNode;
  error?: string | null;
}

export default function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  action,
  error,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white py-1 pl-4 pr-1 focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/15">
        <MapPin size={19} className="shrink-0 text-wine" />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          // text-base auf Mobilgeräten verhindert das automatische Zoomen von iOS beim Fokussieren.
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-slate-400 sm:text-sm"
          required
        />
        {action}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
