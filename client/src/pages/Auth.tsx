import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChamaStore } from "@/stores/chamaStore";
import { useAuthStore } from "../stores/authStore";
import { api } from "../lib/api";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building2,
  Users,
  HandCoins,
  Calendar,
} from "lucide-react";

export function Auth() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Common state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", loginData);
      console.log(
        "🔐 FULL LOGIN RESPONSE:",
        JSON.stringify(response.data, null, 2),
      );

      const { user, chamas } = response.data;

      console.log("📊 CHAMAS ARRAY:", chamas);
      console.log("📊 CHAMAS LENGTH:", chamas?.length);

      if (chamas && chamas.length > 0) {
        chamas.forEach((chama: any, i: number) => {
          console.log(
            `  Chama ${i + 1}: ${chama.name} - Members: ${chama.memberCount}`,
          );
        });
      }

      setUser(user);
      setAuthenticated(true);

      // Hydrate store
      useChamaStore.getState().setUserChamas(chamas || []);

      // Check store after setting
      const storeState = useChamaStore.getState();
      console.log("🏪 Store after set:", {
        userChamasCount: storeState.userChamas.length,
        currentChama: storeState.currentChama,
      });

      // Decision logic
      if (!chamas || chamas.length === 0) {
        console.log("❌ No chamas, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }

      if (chamas.length === 1) {
        console.log("✅ Single chama, auto-selecting and going to dashboard");
        useChamaStore.getState().setCurrentChama(chamas[0]);
        navigate("/dashboard");
        return;
      }

      // Multiple chamas
      console.log(
        `🎯 ${chamas.length} chamas found, redirecting to /my-chamas`,
      );
      console.log("📍 Navigating to /my-chamas now...");
      navigate("/my-chamas");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", registerData);
      const { user } = response.data;
      setUser(user);
      setAuthenticated(true);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">Changa.com</h1>
            <p className="text-xl text-purple-100">
              Digital Chama Management System
            </p>
          </div>

          <div className="space-y-6 mt-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Multi-Chama Support</p>
                <p className="text-sm text-purple-200">
                  Manage multiple savings groups
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Loan Management</p>
                <p className="text-sm text-purple-200">
                  Track loans and repayments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Member Tracking</p>
                <p className="text-sm text-purple-200">
                  Real-time contribution tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Meeting Management</p>
                <p className="text-sm text-purple-200">
                  Schedule and track attendance
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-purple-200">
              Join thousands of chamas managing their finances digitally
            </p>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-700">Changa.com</h1>
            <p className="text-gray-600 mt-1">Digital Chama Management</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                }}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === "login"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setError("");
                }}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === "register"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Login Form */}
              {activeTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="wema@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="Wema Sineni"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="wema@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
