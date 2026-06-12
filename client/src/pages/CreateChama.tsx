import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { Loader2, ArrowLeft } from "lucide-react";

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
    });
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
              Set up your savings group and invite members
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount (KSh)
                </label>
                <input
                  type="number"
                  step="100"
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
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Payment Penalty (KSh){" "}
                <span className="text-gray-400 text-xs">Optional</span>
              </label>
              <input
                type="number"
                step="100"
                value={formData.penaltyAmount}
                onChange={(e) =>
                  setFormData({ ...formData, penaltyAmount: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g., 200"
              />
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
