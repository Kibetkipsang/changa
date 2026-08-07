import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  DollarSign,
  Calendar,
  HandCoins,
  PieChart,
  LineChart,
  Download,
} from "lucide-react";

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalContributions: number;
  averageContribution: number;
  monthlyContributionTotal: number;
  contributionCompliance: number;
  totalLoansDisbursed: number;
  activeLoans: number;
  totalRepayments: number;
  defaultRate: number;
  averageLoanAmount: number;
  totalMeetings: number;
  averageAttendance: number;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyRevenue: number;
  memberGrowthRate: number;
  contributionGrowth: number;
  loanGrowthRate: number;
  lastUpdated: string;
}

export function Analytics() {
  const { currentChama } = useChamaStore();

  const { data, isLoading } = useQuery({
    queryKey: ["chama-analytics", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/analytics/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  const analytics: AnalyticsData = data?.analytics || {};

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Define the data rows
      const rows = [
        ["Metric", "Value"],
        ["Total Members", analytics.totalMembers || 0],
        ["Active Members", analytics.activeMembers || 0],
        ["New Members This Month", analytics.newMembersThisMonth || 0],
        ["Member Growth Rate", `${(analytics.memberGrowthRate || 0).toFixed(1)}%`],
        ["Total Contributions", `KSh ${(analytics.totalContributions || 0).toLocaleString()}`],
        ["Average Contribution", `KSh ${(analytics.averageContribution || 0).toLocaleString()}`],
        ["Monthly Contribution Total", `KSh ${(analytics.monthlyContributionTotal || 0).toLocaleString()}`],
        ["Contribution Compliance", `${(analytics.contributionCompliance || 0).toFixed(1)}%`],
        ["Total Loans Disbursed", `KSh ${(analytics.totalLoansDisbursed || 0).toLocaleString()}`],
        ["Active Loans", analytics.activeLoans || 0],
        ["Total Repayments", `KSh ${(analytics.totalRepayments || 0).toLocaleString()}`],
        ["Default Rate", `${(analytics.defaultRate || 0).toFixed(1)}%`],
        ["Average Loan Amount", `KSh ${(analytics.averageLoanAmount || 0).toLocaleString()}`],
        ["Total Meetings", analytics.totalMeetings || 0],
        ["Average Attendance", `${(analytics.averageAttendance || 0).toFixed(1)}%`],
        ["Total Balance", `KSh ${(analytics.totalBalance || 0).toLocaleString()}`],
        ["Total Income", `KSh ${(analytics.totalIncome || 0).toLocaleString()}`],
        ["Total Expenses", `KSh ${(analytics.totalExpenses || 0).toLocaleString()}`],
        ["Monthly Revenue", `KSh ${(analytics.monthlyRevenue || 0).toLocaleString()}`],
        ["Contribution Growth", `${(analytics.contributionGrowth || 0).toFixed(1)}%`],
        ["Loan Growth Rate", `${(analytics.loanGrowthRate || 0).toFixed(1)}%`],
      ];

      // Create CSV content
      const csvContent = rows.map(row => row.join(",")).join("\n");
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${currentChama?.name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Analytics exported successfully!");
    } catch (error) {
      toast.error("Failed to export analytics");
      console.error("Export error:", error);
    }
  };

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600">Please select a chama to view analytics.</p>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Performance metrics for {currentChama.name}
            </p>
          </div>
          <div className="flex gap-3">
            {analytics.lastUpdated && (
              <p className="text-sm text-gray-400 flex items-center">
                Last updated: {format(new Date(analytics.lastUpdated), "MMM d, yyyy HH:mm")}
              </p>
            )}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Member Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Member Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalMembers || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Active Members</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.activeMembers || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">New This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics.newMembersThisMonth || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className={`text-2xl font-bold ${analytics.memberGrowthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(analytics.memberGrowthRate || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Contribution Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Contribution Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalContributions || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Average Contribution</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(analytics.averageContribution || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.monthlyContributionTotal || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Compliance Rate</p>
              <p className={`text-2xl font-bold ${analytics.contributionCompliance >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                {formatPercentage(analytics.contributionCompliance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Loan Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-yellow-600" />
            Loan Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Disbursed</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalLoansDisbursed || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.activeLoans || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Repayments</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalRepayments || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Default Rate</p>
              <p className={`text-2xl font-bold ${analytics.defaultRate <= 5 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(analytics.defaultRate || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Financial Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalBalance || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalIncome || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(analytics.totalExpenses || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(analytics.monthlyRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Meeting Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Meeting Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Meetings</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalMeetings || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Average Attendance</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatPercentage(analytics.averageAttendance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-purple-600" />
            Growth Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Member Growth</p>
              <p className={`text-2xl font-bold ${analytics.memberGrowthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(analytics.memberGrowthRate || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Contribution Growth</p>
              <p className={`text-2xl font-bold ${analytics.contributionGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(analytics.contributionGrowth || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Loan Growth</p>
              <p className={`text-2xl font-bold ${analytics.loanGrowthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(analytics.loanGrowthRate || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}