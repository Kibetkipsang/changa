import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChamaStore } from '../stores/chamaStore';
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
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contributions', href: '/contributions', icon: Wallet },
  { name: 'Loans', href: '/loans', icon: HandCoins },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Members', href: '/members', icon: Users },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { currentChama, userChamas, setCurrentChama } = useChamaStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chamaDropdownOpen, setChamaDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleChamaSelect = (chama: any) => {
    setCurrentChama(chama);
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
    sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'
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
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
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
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              {/* Chama switcher */}
              {userChamas.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setChamaDropdownOpen(!chamaDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{currentChama?.name || 'Select Chama'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {chamaDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setChamaDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                        <div className="p-2">
                          {userChamas.map((chama) => (
                            <button
                              key={chama.id}
                              onClick={() => handleChamaSelect(chama)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="font-medium">{chama.name}</div>
                              <div className="text-xs text-gray-500">{chama.role}</div>
                            </button>
                          ))}
                          <hr className="my-2" />
                          <Link
                            to="/create-chama"
                            className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            onClick={() => setChamaDropdownOpen(false)}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create New Chama</span>
                          </Link>
                          <Link
                            to="/join-chama"
                            className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}