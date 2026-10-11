import { MapPin } from 'lucide-react';
interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}
export default function LocationInput({ label, value, onChange, placeholder }: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-blue-100">
        <MapPin size={19} className="text-brand" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          required
        />
      </span>
    </label>
  );
}
