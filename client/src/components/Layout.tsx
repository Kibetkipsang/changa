import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useChamaStore } from "../stores/chamaStore";
import { format } from "date-fns";
import {
  LayoutDashboard,
  Wallet,
  HandCoins,
  Calendar,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus,
  UserPlus,
  Building2,
  Clock,
  Calendar as CalendarIcon,
  DollarSign,
  ChevronRight,
  Home,
  Info,
  Layers,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contributions", href: "/contributions", icon: Wallet },
  { name: "Loans", href: "/loans", icon: HandCoins },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Members", href: "/members", icon: Users },
];

// Route name mapping for breadcrumbs
const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contributions": "Contributions",
  "/loans": "Loans",
  "/meetings": "Meetings",
  "/members": "Members",
  "/create-chama": "Create Chama",
  "/join-chama": "Join Chama",
  "/my-chamas": "My Chamas",
};

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { currentChama, userChamas, setCurrentChama } = useChamaStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chamaDropdownOpen, setChamaDropdownOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleChamaSelect = (chama: any) => {
    setCurrentChama(chama);
    setChamaDropdownOpen(false);
  };

  // Get current period (month/year)
  const currentPeriod = format(new Date(), "MMMM yyyy");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const breadcrumbs = [];
    
    breadcrumbs.push({ name: "Home", path: "/dashboard" });
    
    let currentPath = "";
    for (const pathname of pathnames) {
      currentPath += `/${pathname}`;
      const name = routeNames[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      breadcrumbs.push({ name, path: currentPath });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Toggle info dropdown
  const toggleInfoDropdown = () => {
    setInfoDropdownOpen(!infoDropdownOpen);
    setChamaDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r z-30 transition-transform duration-300 lg:translate-x-0 lg:w-64 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/dashboard" className="text-xl font-bold text-purple-700">
            Changa.com
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-3 sm:px-4 py-2">
            {/* First row: Menu, Chama switcher, Info dropdown, User */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Chama switcher */}
                {userChamas.length > 0 && (
                  <div className="relative flex items-center gap-1 flex-1 min-w-0">
                    <button
                      onClick={() => setChamaDropdownOpen(!chamaDropdownOpen)}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm flex-shrink-0"
                    >
                      <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium truncate max-w-[60px] sm:max-w-[80px] md:max-w-[120px]">
                        {currentChama?.name || "Select"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    </button>

                    {chamaDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setChamaDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border z-20">
                          <div className="p-2 max-h-80 overflow-y-auto">
                            {/* Chama list */}
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1.5">
                              Your Chamas
                            </div>
                            {userChamas.map((chama) => (
                              <button
                                key={chama.id}
                                onClick={() => handleChamaSelect(chama)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                  currentChama?.id === chama.id
                                    ? "bg-purple-50 border border-purple-200"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {chama.name}
                                  {currentChama?.id === chama.id && (
                                    <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Active</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                                  <span>{chama.role}</span>
                                  <span>•</span>
                                  <span className="capitalize">{chama.frequency}</span>
                                  <span>•</span>
                                  <span>{chama.memberCount || 0} members</span>
                                  <span>•</span>
                                  <span>{formatCurrency(chama.contributionAmount || 0)}</span>
                                </div>
                              </button>
                            ))}
                            
                            <hr className="my-2" />
                            
                            {/* My Chamas button */}
                            <Link
                              to="/my-chamas"
                              className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                              onClick={() => setChamaDropdownOpen(false)}
                            >
                              <Layers className="w-4 h-4" />
                              <span>View All My Chamas</span>
                            </Link>
                            
                            <hr className="my-2" />
                            
                            {/* Create and Join buttons */}
                            <Link
                              to="/create-chama"
                              className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                              onClick={() => setChamaDropdownOpen(false)}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Create New Chama</span>
                            </Link>
                            <Link
                              to="/join-chama"
                              className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                              onClick={() => setChamaDropdownOpen(false)}
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Join Existing Chama</span>
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Info Dropdown - Using "Chama Info" text instead of icon */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={toggleInfoDropdown}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-xs sm:text-sm"
                >
                  <span className="text-purple-700 font-medium">Chama Info</span>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 transition-transform duration-200 ${infoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {infoDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setInfoDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border z-20">
                      <div className="p-2 space-y-1">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-0.5">
                          Chama Details
                        </div>
                        
                        {/* Period */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Period</p>
                            <p className="text-xs font-medium text-gray-700">{currentPeriod}</p>
                          </div>
                        </div>

                        {/* Frequency */}
                        {currentChama?.frequency && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400">Frequency</p>
                              <p className="text-xs font-medium text-gray-700 capitalize">{currentChama.frequency}</p>
                            </div>
                          </div>
                        )}

                        {/* Contribution Amount */}
                        {currentChama?.contributionAmount !== undefined && currentChama?.contributionAmount !== null && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400">Contribution</p>
                              <p className="text-xs font-medium text-gray-700">{formatCurrency(currentChama.contributionAmount)} / member</p>
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t my-1"></div>

                        {/* Member Count */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Members</p>
                            <p className="text-xs font-medium text-gray-700">{currentChama?.memberCount || 0} total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-medium text-xs sm:text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium truncate max-w-[100px]">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Second row: Breadcrumbs */}
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 overflow-x-auto pb-0.5">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center flex-shrink-0">
                  {index === 0 ? (
                    <Link to={crumb.path} className="hover:text-purple-600 flex items-center gap-0.5">
                      <Home className="w-3 h-3" />
                      <span className="hidden xs:inline">{crumb.name}</span>
                    </Link>
                  ) : (
                    <>
                      <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      {index === breadcrumbs.length - 1 ? (
                        <span className="text-gray-700 font-medium truncate max-w-[100px] sm:max-w-[200px]">
                          {crumb.name}
                        </span>
                      ) : (
                        <Link to={crumb.path} className="hover:text-purple-600 truncate max-w-[80px] sm:max-w-[150px]">
                          {crumb.name}
                        </Link>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}