import React, { useEffect, useMemo, useState } from 'react';
import { Quotation, QuotationItem } from '../../lib/supabase';
import { Plus, Trash2, Eye, Save } from 'lucide-react';

export interface QuotationFormData {
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  items: QuotationItem[];
}

interface QuotationFormProps {
  onSubmit: (data: QuotationFormData) => void;
  onPreview?: (data: QuotationFormData) => void;
  loading?: boolean;
  editMode?: boolean;
  editData?: Quotation; // when editing, prefill form
}

const emptyItem: QuotationItem = {
  particulars: '',
  length: 0,
  width: 0,
  total_sqft: 0,
  price_sqft: 0,
  amount: 0,
};

export default function QuotationForm({
  onSubmit,
  onPreview,
  loading = false,
  editMode = false,
  editData,
}: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationFormData>({
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    items: [ { ...emptyItem } ],
  });

  // Prefill when editMode
  useEffect(() => {
    if (editMode && editData) {
      setFormData({
        clientName: editData.client_name || '',
        clientCompany: editData.client_company || '',
        clientAddress: editData.client_address || '',
        clientEmail: editData.client_email || '',
        clientPhone: editData.client_phone || '',
        items: (editData.items && editData.items.length > 0) ? editData.items : [{ ...emptyItem }],
      });
    }
  }, [editMode, editData]);

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const removeItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, patch: Partial<QuotationItem>) => {
    setFormData((prev) => {
      const next = [...prev.items];
      const merged = { ...next[idx], ...patch };
      // Auto-calc total_sqft and amount if length/width/price_sqft provided
      const length = Number(merged.length) || 0;
      const width = Number(merged.width) || 0;
      const price = Number(merged.price_sqft) || 0;
      merged.total_sqft = Number((length * width).toFixed(2));
      merged.amount = Number((merged.total_sqft * price).toFixed(2));
      next[idx] = merged;
      return { ...prev, items: next };
    });
  };

  const subtotal = useMemo(
    () => formData.items.reduce((s, it) => s + (Number(it.amount) || 0), 0),
    [formData.items]
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* CLIENT DETAILS AT TOP */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Client Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Client full name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={formData.clientCompany}
              onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
              placeholder="Company name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              placeholder="name@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              rows={3}
              value={formData.clientAddress}
              onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              placeholder="Street, Suburb, State, Postcode"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Items</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-700">
                <th className="px-3 py-2 text-left w-[28%]">Particulars</th>
                <th className="px-3 py-2 text-right w-[12%]">Length</th>
                <th className="px-3 py-2 text-right w-[12%]">Width</th>
                <th className="px-3 py-2 text-right w-[14%]">Total Sqft</th>
                <th className="px-3 py-2 text-right w-[16%]">Price / Sqft</th>
                <th className="px-3 py-2 text-right w-[16%]">Amount</th>
                <th className="px-3 py-2 w-[8%]"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx} className="border-t text-sm">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => updateItem(idx, { particulars: e.target.value })}
                      className="w-full px-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.length}
                      onChange={(e) => updateItem(idx, { length: Number(e.target.value) })}
                      className="w-full text-right px-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.width}
                      onChange={(e) => updateItem(idx, { width: Number(e.target.value) })}
                      className="w-full text-right px-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.total_sqft}
                      readOnly
                      className="w-full text-right px-2 py-2 border border-gray-100 bg-gray-50 rounded-md"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.price_sqft}
                      onChange={(e) => updateItem(idx, { price_sqft: Number(e.target.value) })}
                      className="w-full text-right px-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      readOnly
                      className="w-full text-right px-2 py-2 border border-gray-100 bg-gray-50 rounded-md"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 rounded-md hover:bg-red-50 text-red-600"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 text-sm">
                <td colSpan={7} className="px-3 py-2">
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" /> Add item
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* TOTALS */}
      <div className="flex justify-end">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="font-medium">{(subtotal * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base py-2 border-t mt-2">
            <span className="font-semibold">Grand Total</span>
            <span className="font-semibold">{(subtotal * 1.1).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex items-center gap-3 justify-end">
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(formData)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => onSubmit(formData)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {editMode ? 'Update Quotation' : 'Save Quotation'}
        </button>
      </div>
    </div>
  );
}
