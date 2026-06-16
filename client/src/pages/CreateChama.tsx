import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { Loader2, ArrowLeft, Calendar, DollarSign, Clock } from "lucide-react";

export function CreateChama() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentChama, setUserChamas, userChamas } = useChamaStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    frequency: "monthly",
    penaltyAmount: "",
    startDate: "",
    loanInterestRate: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/chamas", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chamas"] });
      const newChama = data.chama;
      setUserChamas([...userChamas, newChama]);
      setCurrentChama(newChama);
      toast.success(`Chama "${newChama.name}" created successfully!`);
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create chama");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      contributionAmount: formData.contributionAmount
        ? parseFloat(formData.contributionAmount)
        : null,
      penaltyAmount: formData.penaltyAmount
        ? parseFloat(formData.penaltyAmount)
        : null,
      loanInterestRate: formData.loanInterestRate
        ? parseFloat(formData.loanInterestRate)
        : null,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
    });
  };

  // Get today's date for the min attribute
  const today = new Date().toISOString().split('T')[0];

  // Get frequency label
  const getFrequencyLabel = (freq: string) => {
    switch(freq) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-Weekly (Two Weeks)';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Create a New Chama
            </h1>
            <p className="text-gray-600 mt-1">
              Set up your savings group and configure settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Chama Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chama Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Unity Savings Group"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="Tell members about your chama's mission and rules..."
              />
            </div>

            {/* Contribution Amount & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount (KSh)
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contributionAmount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly (Two Weeks)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contribution Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  min={today}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                The date when contributions will start. Cannot be in the past.
              </p>
            </div>

            {/* Penalty Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Payment Penalty (KSh)
                <span className="text-gray-400 text-xs ml-1">Optional</span>
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={formData.penaltyAmount}
                onChange={(e) =>
                  setFormData({ ...formData, penaltyAmount: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g., 200"
              />
            </div>

            {/* Loan Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Loan Interest Rate (%)
                <span className="text-gray-400 text-xs ml-1">Optional</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.loanInterestRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loanInterestRate: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., 5"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Default interest rate for loans. Can be updated later in settings.
              </p>
            </div>

            {/* Settings Summary */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Chama Settings Summary
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Frequency:</span>{" "}
                  {getFrequencyLabel(formData.frequency)}
                </div>
                <div>
                  <span className="font-medium">Contribution:</span>{" "}
                  {formData.contributionAmount 
                    ? `KSh ${parseFloat(formData.contributionAmount).toLocaleString()}`
                    : "Not set"}
                </div>
                <div>
                  <span className="font-medium">Start Date:</span>{" "}
                  {formData.startDate 
                    ? new Date(formData.startDate).toLocaleDateString()
                    : "Not set"}
                </div>
                <div>
                  <span className="font-medium">Loan Interest:</span>{" "}
                  {formData.loanInterestRate 
                    ? `${formData.loanInterestRate}%`
                    : "Not set"}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Penalty:</span>{" "}
                  {formData.penaltyAmount 
                    ? `KSh ${parseFloat(formData.penaltyAmount).toLocaleString()}`
                    : "Not set"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {createMutation.isPending ? "Creating Chama..." : "Create Chama"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}