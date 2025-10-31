import React from 'react';
import { Quotation } from '../../lib/supabase';
import { Eye, Trash2, Edit3 } from 'lucide-react';

interface Props {
  quotations: Quotation[];
  onView: (q: Quotation) => void;
  onDelete: (id: string) => void;
  onEdit: (q: Quotation) => void;
}

export default function QuotationHistory({ quotations, onView, onDelete, onEdit }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {quotations.map((q) => (
        <div key={q.id} className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Quotation</h3>
              <p className="text-lg font-semibold">{q.quotation_number}</p>
            </div>
            <span className="text-xs text-gray-500">
              {q.created_at && new Date(q.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <p><span className="text-gray-500">Client:</span> {q.client_name}</p>
            {q.project_name && <p><span className="text-gray-500">Project:</span> {q.project_name}</p>}
            {q.house_no && <p><span className="text-gray-500">House No:</span> {q.house_no}</p>}
            {q.survey_no && <p><span className="text-gray-500">Survey:</span> {q.survey_no}</p>}
            <p className="font-medium mt-1">Total: {Number(q.grand_total || 0).toFixed(2)}</p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={() => onEdit(q)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50 text-blue-600"
              title="Edit quotation"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onView(q)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-gray-50"
              title="View"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => onDelete(q.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-red-50 text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
