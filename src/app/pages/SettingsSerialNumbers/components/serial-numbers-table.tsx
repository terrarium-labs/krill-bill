import { SerialNumber } from '../../types/serial-numbers';
import { Edit2, Trash2 } from 'lucide-react';
import { generateNextDocumentNumber } from '../../../utils/serial-number-patterns';

interface SerialNumbersTableProps {
  data: SerialNumber[];
  onEdit: (serialNumber: SerialNumber) => void;
  onDelete: (id: string) => void;
}

export default function SerialNumbersTable({
  data,
  onEdit,
  onDelete,
}: SerialNumbersTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          No serial numbers found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Create your first serial number to get started</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Entity
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Pattern
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Next Number
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((sn) => (
          <tr key={sn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sn.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                {sn.entity.replace('_', ' ')}
              </span>
            </td>
            <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">
              {sn.value}
            </td>
            <td className="px-6 py-4 font-mono text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 inline-block">
              {generateNextDocumentNumber(sn.value, sn.last_num_value) || '-'}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(sn)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to delete this serial number?'
                      )
                    ) {
                      onDelete(sn.id);
                    }
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
