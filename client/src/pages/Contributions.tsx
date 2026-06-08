import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { useChamaStore } from '../stores/chamaStore';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Trash2,
  Edit,
  Loader2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface Contribution {
  id: string;
  userId: string;
  amount: number;
  month: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  paymentMethod: string;
  notes: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export function Contributions() {
  const { currentChama } = useChamaStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');

  // Fetch contributions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contributions', currentChama?.id, monthFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthFilter) params.append('month', monthFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/contributions/${currentChama?.id}?${params}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Fetch members for dropdown
  const { data: chamaData } = useQuery({
    queryKey: ['chama-members', currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/chamas/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Record contribution mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/contributions/${currentChama?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions', currentChama?.id] });
      toast.success('Contribution recorded successfully');
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record contribution');
    },
  });

  // Update contribution mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/contributions/${currentChama?.id}/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions', currentChama?.id] });
      toast.success('Contribution updated successfully');
      setEditingContribution(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update contribution');
    },
  });

  // Delete contribution mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contributions/${currentChama?.id}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions', currentChama?.id] });
      toast.success('Contribution deleted successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete contribution');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      userId: formData.get('userId'),
      amount: parseFloat(formData.get('amount') as string),
      month: formData.get('month'),
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes'),
    };
    createMutation.mutate(data);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContribution) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: parseFloat(formData.get('amount') as string),
      status: formData.get('status'),
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes'),
    };
    updateMutation.mutate({ id: editingContribution.id, data });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contribution? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Partial</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Pending</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const contributions = data?.contributions || [];
  const summary = data?.summary || {};
  const members = chamaData?.chama?.members || [];

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Member Name', 'Amount', 'Month', 'Status', 'Payment Method', 'Date Recorded'];
    const rows = contributions.map((c: Contribution) => [
      c.user?.name || 'Unknown',
      c.amount,
      format(new Date(c.month), 'MMMM yyyy'),
      c.status,
      c.paymentMethod || 'CASH',
      format(new Date(c.createdAt), 'dd/MM/yyyy'),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributions-${currentChama?.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export complete');
  };

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">Please select a chama to manage contributions.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
            <p className="text-gray-600 mt-1">Track and manage member payments for {currentChama.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Record Contribution
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold text-gray-900">KSh {summary.totalCollected?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-gray-900">KSh {summary.currentMonthCollected?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Total Contributions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalContributions || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Average Contribution</p>
            <p className="text-2xl font-bold text-gray-900">KSh {summary.averageContribution?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Contributions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Member</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Month</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Payment Method</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : contributions.filter((c: Contribution) => 
                  c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">No contributions found</td></tr>
                ) : (
                  contributions.filter((c: Contribution) => 
                    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((contribution: Contribution) => (
                    <tr key={contribution.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{contribution.user?.name}</p>
                          <p className="text-xs text-gray-500">{contribution.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">KSh {contribution.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{format(new Date(contribution.month), 'MMMM yyyy')}</td>
                      <td className="px-6 py-4">{getStatusBadge(contribution.status)}</td>
                      <td className="px-6 py-4 text-gray-600">{contribution.paymentMethod || 'CASH'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(contribution.createdAt), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingContribution(contribution)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(contribution.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showForm || editingContribution) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingContribution ? 'Edit Contribution' : 'Record Contribution'}
            </h2>
            <form onSubmit={editingContribution ? handleUpdate : handleSubmit} className="space-y-4">
              {!editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
                  <select
                    name="userId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select member</option>
                    {members.map((member: any) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KSh) *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="100"
                  defaultValue={editingContribution?.amount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              {!editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <input
                    type="month"
                    name="month"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
              {editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingContribution.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  defaultValue={editingContribution?.paymentMethod || 'CASH'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContribution?.notes}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (editingContribution ? 'Update' : 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingContribution(null); }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}