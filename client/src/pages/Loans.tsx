import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { useAuthStore } from "../stores/authStore";
import { api } from "../lib/api";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  Loader2,
  TrendingUp,
  DollarSign,
  Calendar,
  UserCheck,
  FileText,
} from "lucide-react";

interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  repaymentPeriod: number;
  balance: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "REJECTED";
  purpose: string;
  user: {
    name: string;
    email: string;
  };
  repayments: { amount: number; date: string }[];
  createdAt: string;
  approvedAt?: string;
}

export function Loans() {
  const { currentChama } = useChamaStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRepaymentForm, setShowRepaymentForm] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch loans
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["loans", currentChama?.id, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await api.get(`/loans/${currentChama?.id}?${params}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Request loan mutation
  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/loans/${currentChama?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan request submitted successfully");
      setShowRequestForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to submit loan request",
      );
    },
  });

  // Approve loan mutation
  const approveMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/approve/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan approved successfully");
      refetch();
    },
  });

  // Reject loan mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      loanId,
      reason,
    }: {
      loanId: string;
      reason: string;
    }) => {
      const response = await api.patch(
        `/loans/reject/${currentChama?.id}/${loanId}`,
        { rejectionReason: reason },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan rejected");
      refetch();
    },
  });

  // Activate loan mutation
  const activateMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/activate/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan activated successfully");
      refetch();
    },
  });

  // Record repayment mutation
  const repaymentMutation = useMutation({
    mutationFn: async ({
      loanId,
      amount,
      notes,
    }: {
      loanId: string;
      amount: number;
      notes: string;
    }) => {
      const response = await api.post(
        `/loans/repayment/${currentChama?.id}/${loanId}`,
        { amount, notes },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success(data.message || "Repayment recorded successfully");
      setShowRepaymentForm(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to record repayment");
    },
  });

  const handleRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    requestMutation.mutate({
      amount: parseFloat(formData.get("amount") as string),
      interestRate: parseFloat(formData.get("interestRate") as string) || 0,
      repaymentPeriod: parseInt(formData.get("repaymentPeriod") as string),
      purpose: formData.get("purpose"),
    });
  };

  const handleRepayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showRepaymentForm) return;
    const formData = new FormData(e.currentTarget);
    repaymentMutation.mutate({
      loanId: showRepaymentForm.id,
      amount: parseFloat(formData.get("amount") as string),
      notes: formData.get("notes") as string,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserCheck className="w-3 h-3" /> Approved
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case "DEFAULTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Defaulted
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const loans = data?.loans || [];
  const summary = data?.summary || {};
  const userRole = currentChama?.role;
  const canApprove = userRole === "OWNER" || userRole === "TREASURER";

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">
            Please select a chama to manage loans.
          </p>
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
            <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
            <p className="text-gray-600 mt-1">
              Request, approve, and track loans for {currentChama.name}
            </p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Loan
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Total Disbursed</p>
            <p className="text-2xl font-bold text-gray-900">
              KSh {summary.totalLoanAmount?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-yellow-600">
              KSh {summary.totalOutstandingBalance?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.activeCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Pending Requests</p>
            <p className="text-2xl font-bold text-orange-600">
              {summary.pendingCount || 0}
            </p>
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Borrower
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Interest
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Period
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Balance
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Requested
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : loans.filter((l: Loan) =>
                    l.user?.name
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                  ).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No loans found
                    </td>
                  </tr>
                ) : (
                  loans
                    .filter((l: Loan) =>
                      l.user?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )
                    .map((loan: Loan) => (
                      <tr
                        key={loan.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {loan.user?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {loan.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          KSh {loan.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {loan.interestRate}%
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {loan.repaymentPeriod} months
                        </td>
                        <td className="px-6 py-4 font-semibold text-yellow-600">
                          KSh {loan.balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(loan.status)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {format(new Date(loan.createdAt), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedLoan(loan)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {loan.status === "ACTIVE" && (
                              <button
                                onClick={() => setShowRepaymentForm(loan)}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                            {canApprove && loan.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() =>
                                    approveMutation.mutate(loan.id)
                                  }
                                  className="p-1 hover:bg-green-100 rounded transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt(
                                      "Reason for rejection:",
                                    );
                                    if (reason)
                                      rejectMutation.mutate({
                                        loanId: loan.id,
                                        reason,
                                      });
                                  }}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                            {canApprove && loan.status === "APPROVED" && (
                              <button
                                onClick={() => activateMutation.mutate(loan.id)}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                              >
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
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

      {/* Request Loan Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Request a Loan</h2>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KSh) *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  name="interestRate"
                  step="0.5"
                  defaultValue="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repayment Period (months) *
                </label>
                <select
                  name="repaymentPeriod"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">Select period</option>
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="4">4 months</option>
                  <option value="5">5 months</option>
                  <option value="6">6 months</option>
                  <option value="9">9 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="What will this loan be used for?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={requestMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {requestMutation.isPending
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {showRepaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Record Repayment</h2>
            <p className="text-sm text-gray-600 mb-4">
              Loan for {showRepaymentForm.user?.name} · Balance: KSh{" "}
              {showRepaymentForm.balance.toLocaleString()}
            </p>
            <form onSubmit={handleRepayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KSh) *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  max={showRepaymentForm.balance}
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Payment method, receipt number, etc."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={repaymentMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {repaymentMutation.isPending
                    ? "Recording..."
                    : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRepaymentForm(null)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Loan Details</h2>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Borrower</p>
                    <p className="font-medium">{selectedLoan.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Loan Amount</p>
                    <p className="font-medium">
                      KSh {selectedLoan.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Rate</p>
                    <p className="font-medium">{selectedLoan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Repayment Period</p>
                    <p className="font-medium">
                      {selectedLoan.repaymentPeriod} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining Balance</p>
                    <p className="font-medium text-yellow-600">
                      KSh {selectedLoan.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p>{getStatusBadge(selectedLoan.status)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Purpose</p>
                    <p className="text-sm">
                      {selectedLoan.purpose || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedLoan.repayments &&
                selectedLoan.repayments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Repayment History</h3>
                    <div className="space-y-2">
                      {selectedLoan.repayments.map((repayment, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              KSh {repayment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(repayment.date), "dd MMM yyyy")}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="pt-4">
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
