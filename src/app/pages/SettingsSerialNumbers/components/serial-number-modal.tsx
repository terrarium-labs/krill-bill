import { useState } from 'react';
import { SerialNumber, SerialNumberEntity } from '../../types/serial-numbers';
import { X } from 'lucide-react';
import { validatePattern, generateNextDocumentNumber } from '../../../utils/serial-number-patterns';

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

    const patternValidation = validatePattern(formData.value);
    if (!patternValidation.valid) {
      newErrors.value = patternValidation.error || 'Invalid pattern';
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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create'
              ? 'Create Serial Number'
              : 'Edit Serial Number'}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.name
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
              }`}
              placeholder="e.g., SI, PI, ORD"
            />
            {errors.name && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Entity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Pattern
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.value
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
              }`}
              placeholder="e.g., INV-[YYYY]-%%%%%"
            />
            {errors.value && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.value}</p>
            )}
            
            {/* Helper text with examples */}
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Pattern Format:</p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-3">
                <li>• Use <code className="bg-white dark:bg-gray-800 px-1 rounded">%%%%</code> for number digits (each % = one digit)</li>
                <li>• Use <code className="bg-white dark:bg-gray-800 px-1 rounded">[YYYY]</code> for year (2026)</li>
                <li>• Use <code className="bg-white dark:bg-gray-800 px-1 rounded">[YY]</code> for short year (26)</li>
                <li>• Use <code className="bg-white dark:bg-gray-800 px-1 rounded">[MM]</code> for month (01-12)</li>
                <li>• Use <code className="bg-white dark:bg-gray-800 px-1 rounded">[DD]</code> for day (01-31)</li>
              </ul>
            </div>

            {/* Real-time preview */}
            {formData.value && validatePattern(formData.value).valid && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
                  Next example (starting from {formData.last_num_value}):
                </p>
                <p className="text-sm font-mono font-semibold text-green-900 dark:text-green-200">
                  {generateNextDocumentNumber(formData.value, formData.last_num_value)}
                </p>
              </div>
            )}
          </div>

          {/* Last Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.last_num_value
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
              }`}
            />
            {errors.last_num_value && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.last_num_value}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
