import { AlertTriangle } from 'lucide-react';
import { DISRUPTION_TYPES } from '@plan-b/shared';
import type { DisruptionType } from '../types';

interface Props {
  value: DisruptionType;
  onChange: (value: DisruptionType) => void;
}

export default function DisruptionSelect({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">Störung simulieren</span>
      <span className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle size={19} className="text-amber-600" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DisruptionType)}
          className="w-full bg-transparent text-base font-medium outline-none sm:text-sm"
        >
          {DISRUPTION_TYPES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </span>
    </label>
  );
}
