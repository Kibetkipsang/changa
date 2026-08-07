import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { api } from "../lib/api";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  X,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  Filter,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Contribution {
  id: string;
  userId: string;
  amount: number;
  month: string;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
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
  const [editingContribution, setEditingContribution] =
    useState<Contribution | null>(null);
  const [deletingContribution, setDeletingContribution] =
    useState<Contribution | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get current month for filtering
  const currentMonth = format(new Date(), "yyyy-MM");

  // Fetch contributions - with proper cache configuration
  const { data, isLoading } = useQuery({
    queryKey: ["contributions", currentChama?.id, monthFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthFilter) params.append("month", monthFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await api.get(
        `/contribution/${currentChama?.id}?${params}`,
      );
      return response.data;
    },
    enabled: !!currentChama?.id,
    // Keep data in cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Keep cached data for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
  });

  // Fetch members for dropdown - with cache configuration
  const { data: chamaData, isLoading: membersLoading } = useQuery({
    queryKey: ["chama-members", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/chamas/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Get members from the correct path
  const members = chamaData?.members || [];

  // Record contribution mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(
        `/contribution/${currentChama?.id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate ALL contribution queries for this chama
      queryClient.invalidateQueries({
        queryKey: ["contributions", currentChama?.id],
      });
      toast.success("Contribution recorded successfully");
      setShowForm(false);
      window.dispatchEvent(new CustomEvent("contribution-updated"));
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to record contribution",
      );
    },
  });

  // Update contribution mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(
        `/contribution/${currentChama?.id}/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contributions", currentChama?.id],
      });
      toast.success("Contribution updated successfully");
      setEditingContribution(null);
      window.dispatchEvent(new CustomEvent("contribution-updated"));
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to update contribution",
      );
    },
  });

  // Delete contribution mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contribution/${currentChama?.id}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contributions", currentChama?.id],
      });
      toast.success("Contribution deleted successfully");
      setDeletingContribution(null);
      window.dispatchEvent(new CustomEvent("contribution-updated"));
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to delete contribution",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      userId: formData.get("userId"),
      amount: parseFloat(formData.get("amount") as string),
      month: formData.get("month"),
      paymentMethod: formData.get("paymentMethod"),
      notes: formData.get("notes"),
    };
    createMutation.mutate(data);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContribution) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: parseFloat(formData.get("amount") as string),
      status: formData.get("status"),
      paymentMethod: formData.get("paymentMethod"),
      notes: formData.get("notes"),
    };
    updateMutation.mutate({ id: editingContribution.id, data });
  };

  const handleDelete = () => {
    if (deletingContribution) {
      deleteMutation.mutate(deletingContribution.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PAID: "bg-green-100 text-green-800 border-green-200",
      PARTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PENDING: "bg-red-100 text-red-800 border-red-200",
      OVERDUE: "bg-orange-100 text-orange-800 border-orange-200",
    };
    const icons = {
      PAID: <CheckCircle className="w-3 h-3" />,
      PARTIAL: <Clock className="w-3 h-3" />,
      PENDING: <XCircle className="w-3 h-3" />,
      OVERDUE: <AlertCircle className="w-3 h-3" />,
    };
    const labels = {
      PAID: "Paid",
      PARTIAL: "Partial",
      PENDING: "Pending",
      OVERDUE: "Overdue",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const contributions = data?.contributions || [];
  // const summary = data?.summary || {};

  // Filter contributions based on search term (client-side filtering)
  const filteredContributions = contributions.filter((c: Contribution) =>
    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate this month's total from the contributions data
  const thisMonthContributions = contributions.filter((c: Contribution) => {
    const contributionMonth = format(new Date(c.month), "yyyy-MM");
    return contributionMonth === currentMonth && c.status === "PAID";
  });

  const thisMonthTotal = thisMonthContributions.reduce(
    (sum: number, c: Contribution) => sum + c.amount,
    0
  );

  // Calculate total collected (all time)
  const totalCollected = contributions
    .filter((c: Contribution) => c.status === "PAID")
    .reduce((sum: number, c: Contribution) => sum + c.amount, 0);

  // Calculate average contribution
  const paidContributions = contributions.filter((c: Contribution) => c.status === "PAID");
  const averageContribution = paidContributions.length > 0
    ? totalCollected / paidContributions.length
    : 0;

  const exportToCSV = () => {
    const headers = [
      "Member Name",
      "Amount",
      "Month",
      "Status",
      "Payment Method",
      "Date Recorded",
    ];
    const rows = contributions.map((c: Contribution) => [
      c.user?.name || "Unknown",
      c.amount,
      format(new Date(c.month), "MMMM yyyy"),
      c.status,
      c.paymentMethod || "CASH",
      format(new Date(c.createdAt), "dd/MM/yyyy"),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contributions-${currentChama?.name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete");
  };

  // Modal close handlers
  const closeFormModal = () => {
    setShowForm(false);
    setEditingContribution(null);
  };

  const closeDeleteModal = () => {
    setDeletingContribution(null);
  };

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">
            Please select a chama to manage contributions.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contributions</h1>
            <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">
              Track and manage member payments for {currentChama.name}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={exportToCSV}
              className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:inline">Record</span>
            </button>
          </div>
        </div>

        {/* Mobile: Chama name display */}
        <p className="text-sm text-gray-600 block sm:hidden">
          {currentChama.name}
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Total Collected</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">
              KSh {totalCollected.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">This Month</p>
            <p className="text-base sm:text-2xl font-bold text-purple-600 truncate">
              KSh {thisMonthTotal.toLocaleString()}
            </p>
            <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
              {format(new Date(), "MMM yyyy")}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Total</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">
              {contributions.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Average</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">
              KSh {averageContribution.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full sm:hidden"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {(statusFilter !== "all" || monthFilter) && (
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          <div className={`${showFilters ? "block" : "hidden"} sm:block mt-3 sm:mt-0`}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                  }}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-auto"
                  placeholder="Select month"
                />
              </div>
              {(statusFilter !== "all" || monthFilter) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setMonthFilter("");
                  }}
                  className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contributions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Member</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Month</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Payment</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : filteredContributions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== "all" || monthFilter 
                        ? "No contributions match your filters" 
                        : "No contributions found"}
                    </td>
                  </tr>
                ) : (
                  filteredContributions.map((contribution: any) => (
                    <tr key={contribution.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{contribution.user?.name}</p>
                          <p className="text-xs text-gray-500">{contribution.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">KSh {contribution.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{format(new Date(contribution.month), "MMM yyyy")}</td>
                      <td className="px-6 py-4">{getStatusBadge(contribution.status)}</td>
                      <td className="px-6 py-4 text-gray-600">{contribution.paymentMethod || "CASH"}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(contribution.createdAt), "dd/MM/yy")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingContribution(contribution)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => setDeletingContribution(contribution)} className="p-1 hover:bg-red-50 rounded transition-colors">
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

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <p>{searchTerm || statusFilter !== "all" || monthFilter 
                  ? "No contributions match your filters" 
                  : "No contributions found"}</p>
              </div>
            ) : (
              filteredContributions.map((contribution: any) => (
                <div key={contribution.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {contribution.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {contribution.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingContribution(contribution)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => setDeletingContribution(contribution)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-semibold text-gray-900 ml-1">KSh {contribution.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Month:</span>
                      <span className="text-gray-700 ml-1">{format(new Date(contribution.month), "MMM yyyy")}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 mt-1">
                      {getStatusBadge(contribution.status)}
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{contribution.paymentMethod || "CASH"}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{format(new Date(contribution.createdAt), "dd/MM/yy")}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with count */}
          <div className="border-t bg-gray-50 px-4 py-2 sm:px-6 sm:py-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {filteredContributions.length} of {contributions.length} contributions
              {(searchTerm || statusFilter !== "all" || monthFilter) && (
                <span className="text-purple-600"> (filtered)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showForm || editingContribution) && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeFormModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeFormModal}
          />
          
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={closeFormModal}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              
              <button
                onClick={closeFormModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {editingContribution ? "Edit Contribution" : "Record Contribution"}
            </h2>
            
            <form
              onSubmit={editingContribution ? handleUpdate : handleSubmit}
              className="space-y-4"
            >
              {!editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member *
                  </label>
                  <select
                    name="userId"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select member</option>
                    {members && members.length > 0 ? (
                      members.map((member: any) => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.role ? `(${member.role})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {membersLoading ? 'Loading members...' : 'No members available'}
                      </option>
                    )}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KSh) *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="100"
                  min="0"
                  defaultValue={editingContribution?.amount}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              
              {!editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <input
                    type="month"
                    name="month"
                    required
                    defaultValue={currentMonth}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
              
              {editingContribution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingContribution.status}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  defaultValue={editingContribution?.paymentMethod || "CASH"}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContribution?.notes}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Optional notes"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    editingContribution ? "Update" : "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContribution && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeDeleteModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />
          
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDeleteModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Delete Contribution
              </h2>
              
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Are you sure you want to delete this contribution?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">Member</p>
                <p className="font-medium text-gray-900">{deletingContribution.user?.name}</p>
                <p className="text-xs text-gray-500 mt-2">Amount</p>
                <p className="font-medium text-gray-900">KSh {deletingContribution.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Month</p>
                <p className="font-medium text-gray-900">{format(new Date(deletingContribution.month), "MMMM yyyy")}</p>
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
                ⚠️ This action cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}