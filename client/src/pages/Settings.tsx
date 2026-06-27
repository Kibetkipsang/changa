import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { useAuthStore } from "../stores/authStore";
import { api } from "../lib/api";
import {
  Loader2,
  Save,
  Settings as SettingsIcon,
  Users,
  DollarSign,
  Calendar,
  Bell,
  Shield,
  Clock,
  Download,
  RefreshCw,
  CheckCircle,
  LogOut,
  AlertTriangle,
  X,
  ArrowLeft,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";

interface ChamaSettings {
  id?: string;
  chamaId: string;
  // General Settings
  allowMemberInvites: boolean;
  requireApprovalForJoin: boolean;
  // Contribution Settings
  contributionDay: number | null;
  gracePeriodDays: number;
  allowPartialPayment: boolean;
  // Loan Settings
  maxLoanAmount: number | null;
  minLoanAmount: number | null;
  defaultLoanPeriod: number;
  maxLoanPeriod: number;
  requireCollateral: boolean;
  loanApprovalThreshold: number | null;
  // Meeting Settings
  meetingFrequency: string | null;
  defaultMeetingDay: string | null;
  requireAttendance: boolean;
  // Notification Settings
  notifyOnContribution: boolean;
  notifyOnLoanRequest: boolean;
  notifyOnMeeting: boolean;
  notifyOnPayment: boolean;
}

interface EffectiveSettings {
  canMembersInvite: boolean;
  needsApproval: boolean;
  contributionDueDate: string | null;
  nextContributionDate: string;
  loanLimits: {
    min: number;
    max: number | null;
    defaultPeriod: number;
    maxPeriod: number;
  };
  requiresBothApprovals: (amount: number) => boolean;
  contributionDay: number | null;
  gracePeriodDays: number;
  allowPartialPayment: boolean;
  defaultLoanPeriod: number;
  maxLoanPeriod: number;
  requireCollateral: boolean;
  loanApprovalThreshold: number | null;
  meetingFrequency: string | null;
  defaultMeetingDay: string | null;
  requireAttendance: boolean;
  notifyOnContribution: boolean;
  notifyOnLoanRequest: boolean;
  notifyOnMeeting: boolean;
  notifyOnPayment: boolean;
}

interface DeletionRequestStatus {
  exists: boolean;
  request?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedBy: string;
    requestedAt: string;
    ownerApproved: boolean;
    secretaryApproved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
}

const defaultSettings: ChamaSettings = {
  chamaId: "",
  allowMemberInvites: true,
  requireApprovalForJoin: false,
  contributionDay: null,
  gracePeriodDays: 3,
  allowPartialPayment: false,
  maxLoanAmount: null,
  minLoanAmount: null,
  defaultLoanPeriod: 6,
  maxLoanPeriod: 12,
  requireCollateral: false,
  loanApprovalThreshold: null,
  meetingFrequency: null,
  defaultMeetingDay: null,
  requireAttendance: false,
  notifyOnContribution: true,
  notifyOnLoanRequest: true,
  notifyOnMeeting: true,
  notifyOnPayment: true,
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function Settings() {
  const { currentChama } = useChamaStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ChamaSettings>({
    ...defaultSettings,
    chamaId: currentChama?.id || "",
  });
  const [effectiveSettings, setEffectiveSettings] = useState<EffectiveSettings | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "contributions" | "loans" | "meetings" | "notifications"
  >("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectionInfoModal, setShowRejectionInfoModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionRequestStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Get user role
  const userRole = currentChama?.role;
  const isAdmin = userRole === "OWNER" || userRole === "TREASURER" || userRole === "SECRETARY";
  const isOwner = userRole === "OWNER";
  const isSecretary = userRole === "SECRETARY";

  // Fetch settings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["chama-settings", currentChama?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/settings/${currentChama?.id}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!currentChama?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch effective settings
  const { data: effectiveData, refetch: refetchEffective } = useQuery({
    queryKey: ["effective-settings", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/settings/effective/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch deletion request status
  const fetchDeletionStatus = async () => {
    if (!currentChama?.id) return;
    setIsCheckingStatus(true);
    try {
      const response = await api.get(`/chamas/${currentChama.id}/delete/status`);
      setDeletionStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch deletion status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Check deletion status on mount
  useEffect(() => {
    if (currentChama?.id && (isOwner || isSecretary)) {
      fetchDeletionStatus();
    }
  }, [currentChama?.id]);

  // Update settings when data loads
  useEffect(() => {
    if (data?.settings) {
      setSettings({
        ...defaultSettings,
        ...data.settings,
        chamaId: currentChama?.id || "",
      });
    } else if (data === null) {
      setSettings({
        ...defaultSettings,
        chamaId: currentChama?.id || "",
      });
    }
  }, [data, currentChama?.id]);

  // Update effective settings when data loads
  useEffect(() => {
    if (effectiveData?.settings) {
      setEffectiveSettings(effectiveData.settings);
    }
  }, [effectiveData]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ChamaSettings) => {
      const response = await api.post(`/settings/${currentChama?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chama-settings", currentChama?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["effective-settings", currentChama?.id],
      });
      toast.success("Settings saved successfully!");
      setIsSaving(false);
      refetch();
      refetchEffective();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to save settings");
      setIsSaving(false);
    },
  });

  // Leave Chama mutation
  const leaveChamaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/chamas/${currentChama?.id}/exit`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("You have left the chama successfully");
      const { userChamas, setUserChamas, setCurrentChama } = useChamaStore.getState();
      const updatedChamas = userChamas.filter((c: any) => c.id !== currentChama?.id);
      setUserChamas(updatedChamas);
      if (updatedChamas.length > 0) {
        setCurrentChama(updatedChamas[0]);
      } else {
        setCurrentChama(null);
      }
      setShowExitModal(false);
      setIsExiting(false);
      window.location.href = updatedChamas.length > 0 ? '/my-chamas' : '/dashboard';
    },
    onError: (error: any) => {
      console.error("Exit error:", error);
      if (error.response?.status === 403) {
        toast.error("The owner cannot exit the chama. You must delete the chama or transfer ownership first.");
      } else {
        toast.error(error.response?.data?.error || "Failed to leave chama");
      }
      setIsExiting(false);
    },
  });

  // Request chama deletion mutation (Owner) - Always use POST
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      // ✅ Always use POST to create/update deletion request
      const response = await api.post(`/chamas/${currentChama?.id}/delete/request`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Deletion request submitted. Waiting for Secretary approval.");
      setShowDeleteModal(false);
      setShowRejectionInfoModal(false);
      fetchDeletionStatus();
      if (data.secretary) {
        toast.info(`Secretary ${data.secretary.name} has been notified.`);
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        // If there's already a pending request, refresh status
        fetchDeletionStatus();
        if (deletionStatus?.exists && deletionStatus.request?.status === "PENDING") {
          toast.info("A deletion request is already pending. Waiting for Secretary approval.");
        } else if (deletionStatus?.exists && deletionStatus.request?.status === "REJECTED") {
          toast.error("The previous request was rejected. Please try again with a new request.");
        } else {
          toast.error("Failed to submit deletion request. Please refresh and try again.");
        }
      } else {
        toast.error(error.response?.data?.error || "Failed to request chama deletion");
      }
    },
  });

  // Approve chama deletion mutation (Secretary)
  const approveDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/chamas/${currentChama?.id}/delete/approve`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Chama deletion approved. Ready for confirmation.");
      setShowDeleteConfirmModal(true);
      fetchDeletionStatus();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve chama deletion");
    },
  });

  // Reject chama deletion mutation (Secretary)
  const rejectDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/chamas/${currentChama?.id}/delete/reject`, {
        reason: rejectionReason,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Chama deletion rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      fetchDeletionStatus();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reject chama deletion");
    },
  });

  // Confirm chama deletion mutation (Owner or Secretary)
  const confirmDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/chamas/${currentChama?.id}/delete/confirm`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Chama deleted successfully");
      setShowDeleteConfirmModal(false);
      setIsDeleting(false);
      const { userChamas, setUserChamas, setCurrentChama } = useChamaStore.getState();
      const updatedChamas = userChamas.filter((c: any) => c.id !== currentChama?.id);
      setUserChamas(updatedChamas);
      if (updatedChamas.length > 0) {
        setCurrentChama(updatedChamas[0]);
      } else {
        setCurrentChama(null);
      }
      window.location.href = updatedChamas.length > 0 ? '/my-chamas' : '/dashboard';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete chama");
      setIsDeleting(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(settings);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    await refetchEffective();
    await fetchDeletionStatus();
    setIsRefreshing(false);
    toast.success("Settings refreshed");
  };

  const handleLeaveChama = () => {
    setIsExiting(true);
    leaveChamaMutation.mutate();
  };

  const handleRequestDeletion = () => {
    setShowDeleteModal(false);
    requestDeletionMutation.mutate();
  };

  const handleApproveDeletion = () => {
    approveDeletionMutation.mutate();
  };

  const handleRejectDeletion = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectDeletionMutation.mutate();
  };

  const handleConfirmDeletion = () => {
    setIsDeleting(true);
    confirmDeletionMutation.mutate();
  };

  const handleSubmitNewRequest = () => {
    setShowRejectionInfoModal(false);
    setShowDeleteModal(true);
  };

  const updateSetting = <K extends keyof ChamaSettings>(
    key: K,
    value: ChamaSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Export settings to CSV
  const exportToCSV = () => {
    try {
      const rows = [
        ["Setting", "Value", "Effective Value"],
        ["Allow Member Invites", settings.allowMemberInvites ? "Yes" : "No", effectiveSettings?.canMembersInvite ? "Yes" : "No"],
        ["Require Approval for Join", settings.requireApprovalForJoin ? "Yes" : "No", effectiveSettings?.needsApproval ? "Yes" : "No"],
        ["Contribution Day", settings.contributionDay || "Not set", effectiveSettings?.contributionDay || "Not set"],
        ["Grace Period (Days)", settings.gracePeriodDays, effectiveSettings?.gracePeriodDays || 3],
        ["Allow Partial Payments", settings.allowPartialPayment ? "Yes" : "No", effectiveSettings?.allowPartialPayment ? "Yes" : "No"],
        ["Min Loan Amount (KSh)", settings.minLoanAmount || "Not set", effectiveSettings?.loanLimits.min || 0],
        ["Max Loan Amount (KSh)", settings.maxLoanAmount || "Not set", effectiveSettings?.loanLimits.max || "Unlimited"],
        ["Default Loan Period (Months)", settings.defaultLoanPeriod, effectiveSettings?.defaultLoanPeriod || 6],
        ["Max Loan Period (Months)", settings.maxLoanPeriod, effectiveSettings?.maxLoanPeriod || 12],
        ["Require Collateral", settings.requireCollateral ? "Yes" : "No", effectiveSettings?.requireCollateral ? "Yes" : "No"],
        ["Loan Approval Threshold (KSh)", settings.loanApprovalThreshold || "Not set", effectiveSettings?.loanApprovalThreshold || "Not set"],
        ["Meeting Frequency", settings.meetingFrequency || "Not set", effectiveSettings?.meetingFrequency || "Not set"],
        ["Default Meeting Day", settings.defaultMeetingDay || "Not set", effectiveSettings?.defaultMeetingDay || "Not set"],
        ["Require Attendance", settings.requireAttendance ? "Yes" : "No", effectiveSettings?.requireAttendance ? "Yes" : "No"],
        ["Next Contribution Date", "", effectiveSettings?.nextContributionDate ? format(new Date(effectiveSettings.nextContributionDate), "MMM d, yyyy") : "Not calculated"],
      ];

      const csvContent = rows.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `settings-${currentChama?.name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Settings exported successfully!");
    } catch (error) {
      toast.error("Failed to export settings");
      console.error("Export error:", error);
    }
  };

  // Modal close handlers
  const closeExitModal = () => setShowExitModal(false);
  const closeDeleteModal = () => setShowDeleteModal(false);
  const closeDeleteConfirmModal = () => setShowDeleteConfirmModal(false);
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };
  const closeRejectionInfoModal = () => setShowRejectionInfoModal(false);

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600">Please select a chama to manage settings.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "contributions", label: "Contributions", icon: DollarSign },
    { id: "loans", label: "Loans", icon: Shield },
    { id: "meetings", label: "Meetings", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  // Get deletion status display based on role
  const getDeletionStatusDisplay = () => {
    if (!deletionStatus || !deletionStatus.exists) return null;
    
    const request = deletionStatus.request;
    if (!request) return null;

    // If user is Secretary and status is PENDING, show action buttons
    if (isSecretary && request.status === "PENDING") {
      return {
        label: "Pending Your Approval",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        showActions: true,
      };
    }

    switch (request.status) {
      case "PENDING":
        return {
          label: "Pending Secretary Approval",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="w-4 h-4" />,
          showActions: false,
        };
      case "APPROVED":
        return {
          label: "Approved - Ready for Deletion",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="w-4 h-4" />,
          showActions: false,
        };
      case "REJECTED":
        return {
          label: "Rejected",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="w-4 h-4" />,
          showActions: false,
          isRejected: true,
          rejectionReason: request.rejectionReason,
        };
      default:
        return null;
    }
  };

  const statusDisplay = getDeletionStatusDisplay();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chama Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage settings for {currentChama.name}
            </p>
            {effectiveSettings?.nextContributionDate && (
              <p className="text-sm text-purple-600 mt-1">
                Next contribution: {format(new Date(effectiveSettings.nextContributionDate), "MMM d, yyyy")}
              </p>
            )}
            {statusDisplay && (
              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                {statusDisplay.icon}
                {statusDisplay.label}
              </span>
            )}
            {/* Show rejection reason and retry button for Owner */}
            {statusDisplay?.isRejected && isOwner && (
              <div className="mt-2 space-y-2">
                <button
                  onClick={() => setShowRejectionInfoModal(true)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  View rejection reason
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Submit New Request
                </button>
              </div>
            )}
            {statusDisplay?.showActions && isSecretary && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleApproveDeletion}
                  disabled={approveDeletionMutation.isPending}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {approveDeletionMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {isAdmin && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </>
            )}
            
            {/* Delete Chama - Only for Owner and Secretary */}
            {(isOwner || isSecretary) && (
              <button
                onClick={() => {
                  if (deletionStatus?.exists && deletionStatus.request?.status === "APPROVED") {
                    setShowDeleteConfirmModal(true);
                  } else if (deletionStatus?.exists && deletionStatus.request?.status === "PENDING") {
                    if (isSecretary) {
                      toast.info("Please review the deletion request using the buttons above.");
                    } else {
                      toast.info("A deletion request is already pending. Waiting for Secretary approval.");
                    }
                  } else if (deletionStatus?.exists && deletionStatus.request?.status === "REJECTED") {
                    // Allow Owner to request again
                    if (isOwner) {
                      setShowDeleteModal(true);
                    } else {
                      toast.error(`Deletion request was rejected. Reason: ${deletionStatus.request.rejectionReason || "No reason provided"}`);
                    }
                  } else {
                    setShowDeleteModal(true);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Chama
              </button>
            )}

            {/* Exit Chama - Available to all members except Owner */}
            {!isOwner && (
              <button
                onClick={() => setShowExitModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Exit Chama
              </button>
            )}
          </div>
        </div>

        {/* Admin Settings - Visible to Owner, Treasurer, and Secretary */}
        {isAdmin ? (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-1 sm:space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {effectiveSettings && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* General Settings */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Allow Member Invites
                        </p>
                        <p className="text-sm text-gray-500">
                          Members can invite others to join the chama
                        </p>
                        {effectiveSettings && (
                          <p className="text-xs text-gray-400 mt-1">
                            Effective: {effectiveSettings.canMembersInvite ? "Enabled" : "Disabled"}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("allowMemberInvites", !settings.allowMemberInvites)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.allowMemberInvites ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.allowMemberInvites ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Require Approval for Join
                        </p>
                        <p className="text-sm text-gray-500">
                          New members need approval from Owner/Treasurer
                        </p>
                        {effectiveSettings && (
                          <p className="text-xs text-gray-400 mt-1">
                            Effective: {effectiveSettings.needsApproval ? "Enabled" : "Disabled"}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          updateSetting(
                            "requireApprovalForJoin",
                            !settings.requireApprovalForJoin
                          )
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireApprovalForJoin ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireApprovalForJoin ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contribution Settings */}
              {activeTab === "contributions" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contribution Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contribution Day (Day of Month)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={settings.contributionDay || ""}
                        onChange={(e) =>
                          updateSetting(
                            "contributionDay",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="e.g., 5"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Day of the month (1-31) for contributions
                      </p>
                      {effectiveSettings?.contributionDueDate && (
                        <p className="text-xs text-purple-600 mt-1">
                          Next due: {format(new Date(effectiveSettings.contributionDueDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={settings.gracePeriodDays}
                        onChange={(e) =>
                          updateSetting("gracePeriodDays", parseInt(e.target.value) || 0)
                        }
                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Days after due date before penalty applies
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Allow Partial Payments
                        </p>
                        <p className="text-sm text-gray-500">
                          Members can make partial contribution payments
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("allowPartialPayment", !settings.allowPartialPayment)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.allowPartialPayment ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.allowPartialPayment ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Settings */}
              {activeTab === "loans" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Loan Settings
                    </h2>
                    {effectiveSettings && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ● Active
                      </span>
                    )}
                  </div>
                  
                  {/* Active Loan Settings Summary Card */}
                  {effectiveSettings && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Currently Active Loan Rules
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Min Amount:</span>
                          <span className="font-medium text-gray-700 ml-1">
                            KSh {effectiveSettings.loanLimits.min || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Amount:</span>
                          <span className="font-medium text-gray-700 ml-1">
                            {effectiveSettings.loanLimits.max ? `KSh ${effectiveSettings.loanLimits.max}` : "Unlimited"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Default Period:</span>
                          <span className="font-medium text-gray-700 ml-1">
                            {effectiveSettings.defaultLoanPeriod || 6} months
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Period:</span>
                          <span className="font-medium text-gray-700 ml-1">
                            {effectiveSettings.maxLoanPeriod || 12} months
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Collateral:</span>
                          <span className={`font-medium ml-1 ${effectiveSettings.requireCollateral ? "text-green-600" : "text-gray-400"}`}>
                            {effectiveSettings.requireCollateral ? "✅ Required" : "❌ Not Required"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Both Approvals:</span>
                          <span className="font-medium ml-1">
                            {effectiveSettings.loanApprovalThreshold ? `Above KSh ${effectiveSettings.loanApprovalThreshold}` : "Not Required"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loan Settings Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Loan Amount (KSh)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={settings.minLoanAmount || ""}
                        onChange={(e) =>
                          updateSetting(
                            "minLoanAmount",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="e.g., 1000"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Minimum amount a member can request
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Loan Amount (KSh)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={settings.maxLoanAmount || ""}
                        onChange={(e) =>
                          updateSetting(
                            "maxLoanAmount",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="e.g., 100000"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Maximum amount a member can request
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Loan Period (Months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={settings.defaultLoanPeriod}
                        onChange={(e) =>
                          updateSetting("defaultLoanPeriod", parseInt(e.target.value) || 6)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Default repayment period for new loans
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Loan Period (Months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={settings.maxLoanPeriod}
                        onChange={(e) =>
                          updateSetting("maxLoanPeriod", parseInt(e.target.value) || 12)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Maximum repayment period allowed
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Approval Threshold (KSh)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={settings.loanApprovalThreshold || ""}
                        onChange={(e) =>
                          updateSetting(
                            "loanApprovalThreshold",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="Amount requiring both approvals"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Loans above this amount require both Chair and Treasurer approval
                      </p>
                      {effectiveSettings && (
                        <p className="text-xs text-purple-600 mt-1">
                          {effectiveSettings.loanApprovalThreshold && settings.minLoanAmount && 
                           effectiveSettings.requiresBothApprovals(settings.minLoanAmount || 0) 
                            ? "⚠️ Both approvals required for all loans above threshold" 
                            : "✓ Single approval sufficient for loans below threshold"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg col-span-2">
                      <div>
                        <p className="font-medium text-gray-900">Require Collateral</p>
                        <p className="text-sm text-gray-500">
                          Loans require collateral to be provided
                        </p>
                        {effectiveSettings && (
                          <p className="text-xs text-gray-400 mt-1">
                            Current status: {effectiveSettings.requireCollateral ? "✅ Active" : "❌ Inactive"}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("requireCollateral", !settings.requireCollateral)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireCollateral ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireCollateral ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-4">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      These settings are automatically applied to all new loan requests. 
                      Changes will take effect immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Meeting Settings */}
              {activeTab === "meetings" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Meeting Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Frequency
                      </label>
                      <select
                        value={settings.meetingFrequency || ""}
                        onChange={(e) =>
                          updateSetting("meetingFrequency", e.target.value || null)
                        }
                        className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="">None</option>
                        {FREQUENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Meeting Day
                      </label>
                      <select
                        value={settings.defaultMeetingDay || ""}
                        onChange={(e) =>
                          updateSetting("defaultMeetingDay", e.target.value || null)
                        }
                        className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="">None</option>
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Require Attendance</p>
                        <p className="text-sm text-gray-500">
                          Meetings require attendance tracking
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSetting("requireAttendance", !settings.requireAttendance)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireAttendance ? "bg-purple-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireAttendance ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        key: "notifyOnContribution",
                        label: "Contribution Notifications",
                        description: "Notify when contributions are made",
                      },
                      {
                        key: "notifyOnLoanRequest",
                        label: "Loan Request Notifications",
                        description: "Notify when loan requests are submitted",
                      },
                      {
                        key: "notifyOnMeeting",
                        label: "Meeting Notifications",
                        description: "Notify about upcoming meetings",
                      },
                      {
                        key: "notifyOnPayment",
                        label: "Payment Notifications",
                        description: "Notify when payments are received",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() =>
                            updateSetting(
                              item.key as keyof ChamaSettings,
                              !settings[item.key as keyof ChamaSettings]
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings[item.key as keyof ChamaSettings]
                              ? "bg-purple-600"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings[item.key as keyof ChamaSettings]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Effective Settings Summary */}
            {effectiveSettings && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Active Settings Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Member Invites:</span>{" "}
                    {effectiveSettings.canMembersInvite ? "✅ Enabled" : "❌ Disabled"}
                  </div>
                  <div>
                    <span className="font-medium">Join Approval:</span>{" "}
                    {effectiveSettings.needsApproval ? "✅ Required" : "❌ Not Required"}
                  </div>
                  <div>
                    <span className="font-medium">Next Contribution:</span>{" "}
                    {effectiveSettings.nextContributionDate 
                      ? format(new Date(effectiveSettings.nextContributionDate), "MMM d")
                      : "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Grace Period:</span>{" "}
                    {effectiveSettings.gracePeriodDays} days
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center py-8">
              <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Chama Settings
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                You are viewing this page as a member. 
                Only the Owner, Treasurer, and Secretary can manage chama settings.
              </p>
              <div className="mt-4 text-sm text-gray-400">
                <p>Chama: <span className="font-medium text-gray-600">{currentChama.name}</span></p>
                <p>Your Role: <span className="font-medium text-gray-600">{userRole}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Chama Modal */}
      {showExitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeExitModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeExitModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeExitModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <LogOut className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Exit Chama
              </h2>
              
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Are you sure you want to leave <span className="font-semibold">{currentChama.name}</span>?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">What happens when you leave:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• You will lose access to this chama</li>
                  <li>• Your contributions and loans will be archived</li>
                  <li>• You can rejoin later with an invite code</li>
                </ul>
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
                ⚠️ This action cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleLeaveChama}
                  disabled={isExiting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isExiting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Leaving...</>
                  ) : (
                    <><LogOut className="w-4 h-4" /> Yes, Leave Chama</>
                  )}
                </button>
                <button
                  onClick={closeExitModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Chama Deletion Modal (Owner) */}
      {showDeleteModal && (
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
                {deletionStatus?.exists && deletionStatus.request?.status === "REJECTED" 
                  ? "Submit New Deletion Request" 
                  : "Delete Chama"}
              </h2>
              
              {deletionStatus?.exists && deletionStatus.request?.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full mb-3 text-left">
                  <p className="text-xs text-red-600 font-medium">Previous Request Rejected</p>
                  <p className="text-xs text-red-500 mt-1">
                    Reason: {deletionStatus.request.rejectionReason || "No reason provided"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    You can submit a new request for review.
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Are you sure you want to delete <span className="font-semibold">{currentChama.name}</span>?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">What happens when you delete:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• All members will lose access to this chama</li>
                  <li>• All contributions, loans, and meetings will be deleted</li>
                  <li>• <span className="font-semibold text-red-600">This action requires Secretary approval</span></li>
                </ul>
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
                ⚠️ This action requires approval from the Secretary.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleRequestDeletion}
                  disabled={requestDeletionMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {requestDeletionMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> {deletionStatus?.exists && deletionStatus.request?.status === "REJECTED" ? "Submit New Request" : "Request Deletion"}</>
                  )}
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Info Modal (Owner) */}
      {showRejectionInfoModal && deletionStatus?.request && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeRejectionInfoModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRejectionInfoModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeRejectionInfoModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Deletion Request Rejected
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 w-full mb-4 text-left">
                <p className="text-xs text-gray-500">Rejection Reason</p>
                <p className="text-sm text-gray-800 mt-1">
                  {deletionStatus.request.rejectionReason || "No reason provided"}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                You can submit a new deletion request after addressing the concerns raised.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleSubmitNewRequest}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Submit New Request
                </button>
                <button
                  onClick={closeRejectionInfoModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Deletion Modal (Secretary) */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeRejectModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRejectModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeRejectModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Reject Chama Deletion
              </h2>
              
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Provide a reason for rejecting the deletion request for <span className="font-semibold">{currentChama.name}</span>
              </p>
              
              <div className="w-full mb-3 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Explain why the deletion request is being rejected..."
                />
              </div>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleRejectDeletion}
                  disabled={rejectDeletionMutation.isPending || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {rejectDeletionMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Reject Deletion</>
                  )}
                </button>
                <button
                  onClick={closeRejectModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Chama Deletion Modal (Owner or Secretary) */}
      {showDeleteConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeDeleteConfirmModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDeleteConfirmModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDeleteConfirmModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Confirm Chama Deletion
              </h2>
              
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                <span className="font-semibold">{currentChama.name}</span> has been approved for deletion by both Owner and Secretary.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">Approval Status:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-green-600" />
                    <span>Owner: <span className="font-semibold text-green-600">Approved</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-green-600" />
                    <span>Secretary: <span className="font-semibold text-green-600">Approved</span></span>
                  </li>
                </ul>
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
                ⚠️ This action will permanently delete this chama and all its data.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleConfirmDeletion}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Yes, Delete Chama</>
                  )}
                </button>
                <button
                  onClick={closeDeleteConfirmModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
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