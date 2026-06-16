import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
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

  // Fetch effective settings (with business rules applied)
  const { data: effectiveData, refetch: refetchEffective } = useQuery({
    queryKey: ["effective-settings", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/settings/effective/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 5 * 60 * 1000,
  });

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

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(settings);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    await refetchEffective();
    setIsRefreshing(false);
    toast.success("Settings refreshed");
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

  // Helper to show effective status
  const getEffectiveStatus = (setting: boolean) => {
    return setting ? (
      <span className="text-green-600 text-xs flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    ) : (
      <span className="text-gray-400 text-xs flex items-center gap-1">
        <Clock className="w-3 h-3" /> Inactive
      </span>
    );
  };

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
          </div>
          <div className="flex gap-3 flex-wrap">
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
          </div>
        </div>

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
              <h2 className="text-lg font-semibold text-gray-900">
                Loan Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {effectiveSettings.requiresBothApprovals(settings.minLoanAmount || 0) 
                        ? "Both approvals required for all loans" 
                        : "Single approval sufficient for loans below threshold"}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg col-span-2">
                  <div>
                    <p className="font-medium text-gray-900">Require Collateral</p>
                    <p className="text-sm text-gray-500">
                      Loans require collateral to be provided
                    </p>
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
      </div>
    </Layout>
  );
}