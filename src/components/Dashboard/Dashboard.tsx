import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Quotation, QuotationItem } from '../../lib/supabase';
import QuotationForm, { QuotationFormData } from './QuotationForm';
import QuotationPreview from './QuotationPreview';
import QuotationHistory from './QuotationHistory';
import { LogOut, FileText, Plus, RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'form' | 'history'>('form');

  // Top-level “header” fields
  const [surveyNo, setSurveyNo] = useState('');
  const [projectName, setProjectName] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations((data as Quotation[]) || []);
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  const generateQuotationNumber = () => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `QT-${dateStr}-${randomStr}`;
  };

  const resetHeaderFields = () => {
    setSurveyNo('');
    setProjectName('');
    setHouseNo('');
    setDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setClientPhone('');
  };

  const handleSubmit = async (formData: QuotationFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      const items: QuotationItem[] = formData.items.map((it) => ({
        particulars: it.particulars,
        length: it.length,
        width: it.width,
        total_sqft: it.total_sqft,
        price_sqft: it.price_sqft,
        amount: it.amount,
      }));

      const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
      const taxRate = 10;
      const taxAmount = subtotal * (taxRate / 100);
      const grandTotal = subtotal + taxAmount;

      const validUntil = new Date(date);
      validUntil.setDate(validUntil.getDate() + 15);

      const payload = {
        user_id: user.id,
        quotation_number: editMode && editingQuotation ? editingQuotation.quotation_number : generateQuotationNumber(),
        survey_no: surveyNo || null,
        project_name: projectName || null,
        house_no: houseNo || null,
        client_name: clientName || formData.clientName,
        client_company: formData.clientCompany || null,
        client_address: formData.clientAddress || null,
        client_email: formData.clientEmail || null,
        client_phone: clientPhone || formData.clientPhone,
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        valid_until: validUntil.toISOString().split('T')[0],
      };

      if (editMode && editingQuotation) {
        const { data, error } = await supabase
          .from('quotations')
          .update(payload)
          .eq('id', editingQuotation.id)
          .select()
          .single();
        if (error) throw error;

        setQuotations((prev) => prev.map((q) => (q.id === editingQuotation.id ? (data as Quotation) : q)));
        setSelectedQuotation(data as Quotation);
      } else {
        const { data, error } = await supabase
          .from('quotations')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;

        setQuotations((prev) => [data as Quotation, ...prev]);
        setSelectedQuotation(data as Quotation);
      }

      // Reset states
      setEditMode(false);
      setEditingQuotation(null);
      resetHeaderFields();
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation: ' + error.message);
    }
  };

  const handleEdit = (quotation: Quotation) => {
    // Fill the "header" fields
    setSurveyNo(quotation.survey_no || '');
    setProjectName(quotation.project_name || '');
    setHouseNo(quotation.house_no || '');
    setDate(quotation.created_at ? quotation.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setClientName(quotation.client_name || '');
    setClientPhone(quotation.client_phone || '');

    // Pass the whole quotation to the form to prefill client fields & items
    setEditingQuotation(quotation);
    setEditMode(true);
    setView('form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Mabric Logo"
              className="w-20 h-20 object-contain bg-white rounded-full p-2 shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold text-purple-700">Mabric</h1>
              <p className="text-xs text-gray-600">Quotation Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <p className="text-xs text-gray-500">Logged in</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top buttons */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEditMode(false);
                setEditingQuotation(null);
                resetHeaderFields();
                setView('form');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                view === 'form'
                  ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-5 h-5" />
              {editMode ? 'Edit Quotation' : 'New Quotation'}
            </button>

            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                view === 'history'
                  ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              History ({quotations.length})
            </button>
          </div>

          <button
            onClick={loadQuotations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm hover:shadow-md rounded-lg disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Header fields above the form (Survey/Project/House/Date/Client quick) */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey No.</label>
              <input
                type="text"
                value={surveyNo}
                onChange={(e) => setSurveyNo(e.target.value)}
                placeholder="Enter survey number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="Enter house number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Mr/Mrs/Ms"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {view === 'form' ? (
          <QuotationForm
            onSubmit={handleSubmit}
            loading={loading}
            editMode={editMode}
            editData={editingQuotation ?? undefined}
            onPreview={(formDraft) => {
              // Build a preview quotation object
              const subtotal = formDraft.items.reduce((s, it) => s + (it.amount || 0), 0);
              const taxRate = 10;
              const tax_amount = subtotal * (taxRate / 100);
              const grand_total = subtotal + tax_amount;

              const preview: Quotation = {
                id: 'preview',
                user_id: user?.id || '',
                quotation_number: (editingQuotation?.quotation_number) || `PREVIEW-${Date.now()}`,
                survey_no: surveyNo || null,
                project_name: projectName || null,
                house_no: houseNo || null,
                client_name: clientName || formDraft.clientName,
                client_company: formDraft.clientCompany || null,
                client_address: formDraft.clientAddress || null,
                client_email: formDraft.clientEmail || null,
                client_phone: clientPhone || formDraft.clientPhone,
                items: formDraft.items.map((i) => ({ ...i })),
                subtotal,
                tax_rate: taxRate,
                tax_amount,
                grand_total,
                created_at: new Date().toISOString(),
                valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              } as any;

              setSelectedQuotation(preview);
            }}
          />
        ) : (
          <QuotationHistory
            quotations={quotations}
            onView={setSelectedQuotation}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </main>

      {selectedQuotation && (
        <QuotationPreview
          quotation={selectedQuotation}
          userName={user?.email || 'Admin'}
          userSignatureUrl="/images/signature.png" // replace with your actual signature path
          onClose={() => setSelectedQuotation(null)}
        />
      )}
    </div>
  );
}
