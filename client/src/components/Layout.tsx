import { ReactNode, useState, useEffect } from "react";
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
  Layers,
  Settings,
  BarChart3,
  ChevronLeft,
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

// Bottom navigation items (Settings & Analytics)
const bottomNav = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Route name mapping for breadcrumbs
const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contributions": "Contributions",
  "/loans": "Loans",
  "/meetings": "Meetings",
  "/members": "Members",
  "/analytics": "Analytics",
  "/settings": "Settings",
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chamaDropdownOpen, setChamaDropdownOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsCollapsed(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleChamaSelect = (chama: any) => {
    setCurrentChama(chama);
    setChamaDropdownOpen(false);
  };

  const toggleCollapse = () => {
    if (isDesktop) {
      setIsCollapsed(!isCollapsed);
    }
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

  // Check if route is active
  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  // FIX: Determine sidebar width - on mobile, sidebar is completely hidden
  const getSidebarWidth = () => {
    if (!isDesktop) {
      return sidebarOpen ? 'w-64' : 'w-0 overflow-hidden';
    }
    return isCollapsed ? 'w-20' : 'w-64';
  };

  // FIX: Main content margin - no margin on mobile
  const getMainMargin = () => {
    if (!isDesktop) {
      return 'ml-0';
    }
    return isCollapsed ? 'ml-20' : 'ml-64';
  };

  // Handle tooltip positioning
  const handleMouseEnter = (key: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCollapsed || !isDesktop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
    setHoveredItem(key);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // Render tooltip using fixed positioning
  const renderTooltip = (label: string) => {
    if (!hoveredItem || hoveredItem !== label) return null;
    if (!isCollapsed || !isDesktop) return null;
    
    return (
      <div
        className="fixed px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap z-[100] shadow-lg pointer-events-none transition-opacity duration-200"
        style={{
          top: tooltipPosition.top - 16,
          left: tooltipPosition.left,
          transform: 'translateY(-50%)',
        }}
      >
        {label}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1.5 border-r-4 border-r-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay - only shows when sidebar is open */}
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - completely hidden on mobile when closed */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r z-30 transition-all duration-300 flex flex-col ${
          getSidebarWidth()
        } ${!isDesktop && !sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
      >
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b min-h-[64px] flex-shrink-0">
          <Link 
            to="/dashboard" 
            className={`text-xl font-bold text-purple-700 whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed && isDesktop ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            Changa.com
          </Link>
          {isDesktop && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              )}
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <div
                key={item.name}
                onMouseEnter={(e) => handleMouseEnter(item.name, e)}
                onMouseLeave={handleMouseLeave}
                className="relative"
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed && isDesktop ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t space-y-1 flex-shrink-0">
          {bottomNav.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <div
                key={item.name}
                onMouseEnter={(e) => handleMouseEnter(item.name, e)}
                onMouseLeave={handleMouseLeave}
                className="relative"
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed && isDesktop ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
          <div
            onMouseEnter={(e) => handleMouseEnter('Logout', e)}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed && isDesktop ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Tooltips rendered with fixed positioning */}
      {renderTooltip('Dashboard')}
      {renderTooltip('Contributions')}
      {renderTooltip('Loans')}
      {renderTooltip('Meetings')}
      {renderTooltip('Members')}
      {renderTooltip('Analytics')}
      {renderTooltip('Settings')}
      {renderTooltip('Logout')}

      {/* Main content - full width on mobile */}
      <div className={`${getMainMargin()} transition-all duration-300`}>
        {/* Top bar */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-3 sm:px-4 py-2">
            {/* First row */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                {/* Hamburger menu - only visible on mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Chama switcher - visible on all screens */}
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
                            <Link
                              to="/my-chamas"
                              className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                              onClick={() => setChamaDropdownOpen(false)}
                            >
                              <Layers className="w-4 h-4" />
                              <span>View All My Chamas</span>
                            </Link>
                            <hr className="my-2" />
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

              {/* Info Dropdown */}
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
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Period</p>
                            <p className="text-xs font-medium text-gray-700">{currentPeriod}</p>
                          </div>
                        </div>
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
                        <div className="border-t my-1"></div>
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

            {/* Breadcrumbs */}
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