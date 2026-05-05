import { useState } from 'react';
import { SerialNumber, SerialNumberEntity } from '../../types/serial-numbers';
import { X } from 'lucide-react';

interface SerialNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<SerialNumber, 'id'>) => void;
  initialData?: SerialNumber;
  mode: 'create' | 'edit';
}

const ENTITIES: { value: SerialNumberEntity; label: string }[] = [
  { value: 'sales_invoices', label: 'Sales Invoices' },
  { value: 'purchase_invoices', label: 'Purchase Invoices' },
  { value: 'orders', label: 'Orders' },
];

export default function SerialNumberModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: SerialNumberModalProps) {
  const [formData, setFormData] = useState<Omit<SerialNumber, 'id'>>({
    entity: initialData?.entity || 'sales_invoices',
    name: initialData?.name || '',
    value: initialData?.value || '',
    last_num_value: initialData?.last_num_value || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.value.includes('%')) {
      newErrors.value = 'Pattern must contain at least one % (for number)';
    }
    if (formData.last_num_value < 0) {
      newErrors.last_num_value = 'Last number must be non-negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({
      entity: 'sales_invoices',
      name: '',
      value: '',
      last_num_value: 0,
    });
    setErrors({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create'
              ? 'Create Serial Number'
              : 'Edit Serial Number'}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="e.g., SI, PI, ORD"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Entity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Entity Type
            </label>
            <select
              value={formData.entity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entity: e.target.value as SerialNumberEntity,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {ENTITIES.map((entity) => (
                <option key={entity.value} value={entity.value}>
                  {entity.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Value */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pattern
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.value
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="e.g., SI-2026-%%%%"
            />
            {errors.value && (
              <p className="text-red-600 text-sm mt-1">{errors.value}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              Use % for number digits (e.g., SI-2026-%%)
            </p>
          </div>

          {/* Last Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Last Number Used
            </label>
            <input
              type="number"
              value={formData.last_num_value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  last_num_value: parseInt(e.target.value) || 0,
                })
              }
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.last_num_value
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.last_num_value && (
              <p className="text-red-600 text-sm mt-1">
                {errors.last_num_value}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              {mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
