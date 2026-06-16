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
  Loader2,
  DollarSign,
  UserCheck,
  X,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  Filter,
  Calendar as CalendarIcon,
  Users,
  User,
  Ban,
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
    | "APPROVED_BY_OWNER"
    | "APPROVED_BY_TREASURER"
    | "APPROVED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "REJECTED"
    | "CANCELLED";
  purpose: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  repayments: { amount: number; date: string }[];
  createdAt: string;
  approvedAt?: string;
  approvedByOwner?: boolean;
  approvedByTreasurer?: boolean;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export function Loans() {
  const { currentChama } = useChamaStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRepaymentForm, setShowRepaymentForm] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);
  const [rejectingLoan, setRejectingLoan] = useState<Loan | null>(null);
  const [cancellingLoan, setCancellingLoan] = useState<Loan | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");

  // Fixed loan periods
  const FIXED_LOAN_PERIODS = [1, 2, 3, 4, 5, 6, 9, 12];

  // Fetch loans
  const { data, isLoading } = useQuery({
    queryKey: ["loans", currentChama?.id, statusFilter, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (viewMode === "mine" && user?.id) {
        params.append("userId", user.id);
      }
      const response = await api.get(`/loans/${currentChama?.id}?${params}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Request loan mutation
  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/loans/${currentChama?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan request submitted successfully. Awaiting approval.");
      setShowRequestForm(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to submit loan request",
      );
    },
  });

  // Approve by Owner mutation
  const approveByOwnerMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/approve-owner/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan approved by Chairperson");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve loan");
    },
  });

  // Approve by Treasurer mutation
  const approveByTreasurerMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/approve-treasurer/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan approved by Treasurer");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve loan");
    },
  });

  // Disburse/Activate loan mutation (only when both approvals are done)
  const activateMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/activate/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan disbursed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to disburse loan");
    },
  });

  // Cancel loan mutation
  const cancelLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await api.patch(
        `/loans/cancel/${currentChama?.id}/${loanId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan request cancelled");
      setCancellingLoan(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to cancel loan");
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
      setRejectingLoan(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reject loan");
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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to record repayment");
    },
  });

  // Delete loan mutation - only for rejected or cancelled loans
  const deleteMutation = useMutation({
    mutationFn: async (loanId: string) => {
      await api.delete(`/loans/${currentChama?.id}/${loanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", currentChama?.id] });
      toast.success("Loan deleted successfully");
      setDeletingLoan(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete loan");
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

  const handleDelete = () => {
    if (deletingLoan) {
      deleteMutation.mutate(deletingLoan.id);
    }
  };

  const handleReject = () => {
    if (rejectingLoan && rejectionReason.trim()) {
      rejectMutation.mutate({
        loanId: rejectingLoan.id,
        reason: rejectionReason.trim(),
      });
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  const handleCancel = () => {
    if (cancellingLoan) {
      cancelLoanMutation.mutate(cancellingLoan.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED_BY_OWNER: "bg-blue-100 text-blue-800 border-blue-200",
      APPROVED_BY_TREASURER: "bg-blue-100 text-blue-800 border-blue-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
      DEFAULTED: "bg-red-100 text-red-800 border-red-200",
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      APPROVED_BY_OWNER: <UserCheck className="w-3 h-3" />,
      APPROVED_BY_TREASURER: <UserCheck className="w-3 h-3" />,
      APPROVED: <CheckCircle className="w-3 h-3" />,
      ACTIVE: <CheckCircle className="w-3 h-3" />,
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />,
      CANCELLED: <Ban className="w-3 h-3" />,
      DEFAULTED: <XCircle className="w-3 h-3" />,
    };
    const labels = {
      PENDING: "Pending",
      APPROVED_BY_OWNER: "Approved by Chair",
      APPROVED_BY_TREASURER: "Approved by Treasurer",
      APPROVED: "Approved",
      ACTIVE: "Active",
      COMPLETED: "Completed",
      REJECTED: "Rejected",
      CANCELLED: "Cancelled",
      DEFAULTED: "Defaulted",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const loans = data?.loans || [];
  const summary = data?.summary || {};
  const userRole = currentChama?.role;
  const isOwner = userRole === "OWNER";
  const isTreasurer = userRole === "TREASURER";
  const isMember = userRole === "MEMBER";
  const canApprove = isOwner || isTreasurer;

  // Filter loans based on search term
  const filteredLoans = loans.filter((l: Loan) =>
    l.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if loan is fully approved (both Owner and Treasurer approved)
  const isFullyApproved = (loan: Loan) => {
    return loan.status === "APPROVED" || 
           (loan.approvedByOwner && loan.approvedByTreasurer);
  };

  // Check if loan is ready for disbursement
  const isReadyForDisbursement = (loan: Loan) => {
    return loan.status === "APPROVED" || 
           (loan.approvedByOwner && loan.approvedByTreasurer);
  };

  // Modal close handlers
  const closeRequestModal = () => setShowRequestForm(false);
  const closeRepaymentModal = () => setShowRepaymentForm(null);
  const closeDetailsModal = () => setSelectedLoan(null);
  const closeDeleteModal = () => setDeletingLoan(null);
  const closeRejectModal = () => {
    setRejectingLoan(null);
    setRejectionReason("");
  };
  const closeCancelModal = () => setCancellingLoan(null);

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Loans</h1>
            <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">
              Request, approve, and track loans for {currentChama.name}
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                All
              </button>
              <button
                onClick={() => setViewMode("mine")}
                className={`px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "mine"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                My Loans
              </button>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Request Loan</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Total Disbursed</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">
              KSh {summary.totalLoanAmount?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Outstanding</p>
            <p className="text-base sm:text-2xl font-bold text-yellow-600 truncate">
              KSh {summary.totalOutstandingBalance?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Active Loans</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">
              {summary.activeCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Pending</p>
            <p className="text-base sm:text-2xl font-bold text-orange-600">
              {summary.pendingCount || 0}
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
              {statusFilter !== "all" && (
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED_BY_OWNER">Approved by Chair</option>
                <option value="APPROVED_BY_TREASURER">Approved by Treasurer</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DEFAULTED">Defaulted</option>
              </select>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loans Table - Desktop */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Borrower</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Period</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Balance</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== "all" 
                        ? "No loans match your filters" 
                        : viewMode === "mine" 
                          ? "You haven't requested any loans yet"
                          : "No loans found"}
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan: Loan) => {
                    const isOwnLoan = loan.userId === user?.id;
                    const canCancel = isOwnLoan && loan.status === "PENDING";
                    const canDelete = (loan.status === "REJECTED" || loan.status === "CANCELLED") && isOwner;
                    const canDisburse = (loan.status === "APPROVED" || (loan.approvedByOwner && loan.approvedByTreasurer)) && isOwner;
                    
                    return (
                      <tr key={loan.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{loan.user?.name}</p>
                            <p className="text-xs text-gray-500">{loan.user?.email}</p>
                            {isOwnLoan && (
                              <span className="text-[10px] text-purple-600 font-medium">(You)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">KSh {loan.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-600">{loan.repaymentPeriod}m</td>
                        <td className="px-6 py-4 font-semibold text-yellow-600">KSh {loan.balance.toLocaleString()}</td>
                        <td className="px-6 py-4">{getStatusBadge(loan.status)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(loan.createdAt), "dd/MM/yy")}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {/* View Details */}
                            <button onClick={() => setSelectedLoan(loan)} className="p-1 hover:bg-gray-100 rounded transition-colors" title="View Details">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            {/* PENDING - Approve by Owner */}
                            {loan.status === "PENDING" && isOwner && (
                              <button 
                                onClick={() => approveByOwnerMutation.mutate(loan.id)} 
                                className="p-1 hover:bg-blue-100 rounded transition-colors" 
                                title="Approve as Chairperson"
                              >
                                <UserCheck className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            
                            {/* PENDING - Approve by Treasurer */}
                            {loan.status === "PENDING" && isTreasurer && (
                              <button 
                                onClick={() => approveByTreasurerMutation.mutate(loan.id)} 
                                className="p-1 hover:bg-green-100 rounded transition-colors" 
                                title="Approve as Treasurer"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                            
                            {/* Cancel Loan - Only for the applicant when pending */}
                            {canCancel && (
                              <button 
                                onClick={() => setCancellingLoan(loan)} 
                                className="p-1 hover:bg-gray-100 rounded transition-colors" 
                                title="Cancel Loan Request"
                              >
                                <Ban className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                            
                            {/* Reject - Owner or Treasurer can reject */}
                            {loan.status === "PENDING" && canApprove && (
                              <button 
                                onClick={() => setRejectingLoan(loan)} 
                                className="p-1 hover:bg-red-100 rounded transition-colors" 
                                title="Reject Loan"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            )}
                            
                            {/* Disburse - Only when fully approved (both Owner and Treasurer) */}
                            {isReadyForDisbursement(loan) && isOwner && (
                              <button 
                                onClick={() => activateMutation.mutate(loan.id)} 
                                className="p-1 hover:bg-purple-100 rounded transition-colors" 
                                title="Disburse Loan"
                              >
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                              </button>
                            )}
                            
                            {/* ACTIVE - Record Repayment */}
                            {loan.status === "ACTIVE" && (
                              <button 
                                onClick={() => setShowRepaymentForm(loan)} 
                                className="p-1 hover:bg-green-100 rounded transition-colors" 
                                title="Record Repayment"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                            
                            {/* Delete - Only for REJECTED or CANCELLED loans */}
                            {canDelete && (
                              <button 
                                onClick={() => setDeletingLoan(loan)} 
                                className="p-1 hover:bg-red-50 rounded transition-colors" 
                                title="Delete Loan"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <p>{searchTerm || statusFilter !== "all" 
                  ? "No loans match your filters" 
                  : viewMode === "mine" 
                    ? "You haven't requested any loans yet"
                    : "No loans found"}</p>
              </div>
            ) : (
              filteredLoans.map((loan: Loan) => {
                const isOwnLoan = loan.userId === user?.id;
                const canCancel = isOwnLoan && loan.status === "PENDING";
                const canDelete = (loan.status === "REJECTED" || loan.status === "CANCELLED") && isOwner;
                
                return (
                  <div key={loan.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {loan.user?.name}
                          {isOwnLoan && (
                            <span className="text-[10px] text-purple-600 font-medium ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{loan.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => setSelectedLoan(loan)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        
                        {loan.status === "PENDING" && isOwner && (
                          <button onClick={() => approveByOwnerMutation.mutate(loan.id)} className="p-1.5 hover:bg-blue-100 rounded-lg">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        )}
                        
                        {loan.status === "PENDING" && isTreasurer && (
                          <button onClick={() => approveByTreasurerMutation.mutate(loan.id)} className="p-1.5 hover:bg-green-100 rounded-lg">
                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        )}
                        
                        {canCancel && (
                          <button onClick={() => setCancellingLoan(loan)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <Ban className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        )}
                        
                        {loan.status === "PENDING" && canApprove && (
                          <button onClick={() => setRejectingLoan(loan)} className="p-1.5 hover:bg-red-100 rounded-lg">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        )}
                        
                        {canDelete && (
                          <button onClick={() => setDeletingLoan(loan)} className="p-1.5 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-semibold text-gray-900 ml-1">KSh {loan.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Balance:</span>
                        <span className="font-semibold text-yellow-600 ml-1">KSh {loan.balance.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Period:</span>
                        <span className="text-gray-700 ml-1">{loan.repaymentPeriod}m</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(loan.status)}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">{format(new Date(loan.createdAt), "dd/MM/yy")}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-4 py-2 sm:px-6 sm:py-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {filteredLoans.length} of {loans.length} loans
              {(searchTerm || statusFilter !== "all" || viewMode === "mine") && <span className="text-purple-600"> (filtered)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Request Loan Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeRequestModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRequestModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={closeRequestModal} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button onClick={closeRequestModal} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-4">Request a Loan</h2>
            <p className="text-sm text-gray-500 mb-4">Submit your loan request for review and approval</p>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KSh) *</label>
                <input type="number" name="amount" required min="1" step="100" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input type="number" name="interestRate" step="0.5" defaultValue="0" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Period (months) *</label>
                <select
                  name="repaymentPeriod"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">Select period</option>
                  {FIXED_LOAN_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period} month{period > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Fixed loan periods set by the chama</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea name="purpose" rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="What will this loan be used for?" />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={requestMutation.isPending} className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium">
                  {requestMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : "Submit Request"}
                </button>
                <button type="button" onClick={closeRequestModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {showRepaymentForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeRepaymentModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRepaymentModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={closeRepaymentModal} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button onClick={closeRepaymentModal} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2">Record Repayment</h2>
            <p className="text-sm text-gray-600 mb-4">Loan for {showRepaymentForm.user?.name} · Balance: KSh {showRepaymentForm.balance.toLocaleString()}</p>
            <form onSubmit={handleRepayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KSh) *</label>
                <input type="number" name="amount" required min="1" max={showRepaymentForm.balance} step="100" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="Payment method, receipt number, etc." />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={repaymentMutation.isPending} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium">
                  {repaymentMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Recording...</span> : "Record Payment"}
                </button>
                <button type="button" onClick={closeRepaymentModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Loan Modal */}
      {rejectingLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeRejectModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRejectModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={closeRejectModal} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button onClick={closeRejectModal} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2">Reject Loan Request</h2>
            <p className="text-sm text-gray-600 mb-4">Provide a reason for rejecting {rejectingLoan.user?.name}'s loan request</p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">Loan Details</p>
              <p className="text-sm font-medium">KSh {rejectingLoan.amount.toLocaleString()} · {rejectingLoan.repaymentPeriod} months</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Explain why this loan request is being rejected..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleReject} 
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {rejectMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</span> : "Reject Loan"}
                </button>
                <button type="button" onClick={closeRejectModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Loan Modal */}
      {cancellingLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeCancelModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCancelModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeCancelModal} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Ban className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Cancel Loan Request</h2>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">Are you sure you want to cancel this loan request?</p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">Loan Details</p>
                <p className="font-medium text-gray-900">KSh {cancellingLoan.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Period</p>
                <p className="font-medium text-gray-900">{cancellingLoan.repaymentPeriod} months</p>
                <p className="text-xs text-gray-500 mt-2">Status</p>
                <p className="font-medium text-gray-900">Pending Approval</p>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">This action cannot be undone. You can always submit a new request later.</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={handleCancel} disabled={cancelLoanMutation.isPending} className="flex-1 bg-gray-600 text-white py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium">
                  {cancelLoanMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</> : <><Ban className="w-4 h-4" /> Cancel Request</>}
                </button>
                <button onClick={closeCancelModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Go Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeDetailsModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetailsModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Loan Details</h2>
              <button onClick={closeDetailsModal} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Borrower</p>
                    <p className="font-medium text-sm">{selectedLoan.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Loan Amount</p>
                    <p className="font-medium text-sm">KSh {selectedLoan.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Rate</p>
                    <p className="font-medium text-sm">{selectedLoan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Repayment Period</p>
                    <p className="font-medium text-sm">{selectedLoan.repaymentPeriod} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining Balance</p>
                    <p className="font-medium text-sm text-yellow-600">KSh {selectedLoan.balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p>{getStatusBadge(selectedLoan.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Chairperson Approval</p>
                    <p className="font-medium text-sm">{selectedLoan.approvedByOwner ? "✅ Approved" : "⏳ Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Treasurer Approval</p>
                    <p className="font-medium text-sm">{selectedLoan.approvedByTreasurer ? "✅ Approved" : "⏳ Pending"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Purpose</p>
                    <p className="text-sm">{selectedLoan.purpose || "Not specified"}</p>
                  </div>
                  {selectedLoan.rejectionReason && (
                    <div className="col-span-2">
                      <p className="text-xs text-red-500">Rejection Reason</p>
                      <p className="text-sm text-red-600">{selectedLoan.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedLoan.repayments && selectedLoan.repayments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Repayment History</h3>
                  <div className="space-y-2">
                    {selectedLoan.repayments.map((repayment, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">KSh {repayment.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{format(new Date(repayment.date), "dd MMM yyyy")}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <button onClick={closeDetailsModal} className="w-full border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Only for Rejected or Cancelled Loans */}
      {deletingLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeDeleteModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeDeleteModal} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Delete {deletingLoan.status === "CANCELLED" ? "Cancelled" : "Rejected"} Loan</h2>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">Are you sure you want to delete this {deletingLoan.status === "CANCELLED" ? "cancelled" : "rejected"} loan?</p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">Borrower</p>
                <p className="font-medium text-gray-900">{deletingLoan.user?.name}</p>
                <p className="text-xs text-gray-500 mt-2">Amount</p>
                <p className="font-medium text-gray-900">KSh {deletingLoan.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Status</p>
                <p className="font-medium text-gray-900">{deletingLoan.status}</p>
                {deletingLoan.rejectionReason && (
                  <>
                    <p className="text-xs text-red-500 mt-2">Rejection Reason</p>
                    <p className="text-sm text-red-600">{deletingLoan.rejectionReason}</p>
                  </>
                )}
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">⚠️ This action cannot be undone.</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium">
                  {deleteMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
                </button>
                <button onClick={closeDeleteModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}