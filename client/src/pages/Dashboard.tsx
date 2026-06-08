import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Layout } from '../components/Layout';
import { useChamaStore } from '../stores/chamaStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { 
  Wallet, 
  Users, 
  HandCoins,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  UserPlus,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentChama } = useChamaStore();
  const [copied, setCopied] = useState(false);

  // Debug log to verify member count
  console.log('📊 Dashboard - Current Chama:', {
    name: currentChama?.name,
    memberCount: currentChama?.memberCount,
    role: currentChama?.role,
    id: currentChama?.id
  });

  // Only fetch data if a chama is selected
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['dashboard-stats', currentChama?.id],
    queryFn: async () => {
      if (!currentChama?.id) return null;
      const response = await api.get(`/contributions/stats/${currentChama.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { 
    data: meetingsData, 
    isLoading: meetingsLoading 
  } = useQuery({
    queryKey: ['upcoming-meetings', currentChama?.id],
    queryFn: async () => {
      if (!currentChama?.id) return null;
      const response = await api.get(`/meetings/upcoming/${currentChama.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { 
    data: activityData, 
    isLoading: activityLoading 
  } = useQuery({
    queryKey: ['recent-activity', currentChama?.id],
    queryFn: async () => {
      if (!currentChama?.id) return null;
      const [contributions, loans] = await Promise.all([
        api.get(`/contributions/${currentChama.id}?limit=5`),
        api.get(`/loans/${currentChama.id}?limit=5&status=ACTIVE`),
      ]);
      return { 
        contributions: contributions.data?.contributions || [], 
        loans: loans.data?.loans || [] 
      };
    },
    enabled: !!currentChama?.id,
    staleTime: 1 * 60 * 1000,
  });

  const copyInviteCode = () => {
    if (currentChama?.inviteCode) {
      navigator.clipboard.writeText(currentChama.inviteCode);
      setCopied(true);
      toast.success('Invite code copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // No chama selected - this shouldn't happen because of auth flow, but just in case
  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600">No chama selected. Please go back to My Chamas.</p>
          <button
            onClick={() => navigate('/my-chamas')}
            className="mt-4 text-purple-600 hover:underline"
          >
            View My Chamas →
          </button>
        </div>
      </Layout>
    );
  }

  const stats = statsData?.stats || {};
  const meetings = meetingsData?.meetings || [];
  const contributions = activityData?.contributions || [];
  const loans = activityData?.loans || [];
  const role = currentChama.role;
  const isLoading = statsLoading || meetingsLoading || activityLoading;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-purple-100">
                {currentChama.name} · Role: <span className="font-semibold">{role}</span>
              </p>
              {/* Member count displayed in welcome section */}
              <p className="text-purple-100 text-sm mt-2">
                👥 {currentChama.memberCount || 0} total members
              </p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-sm text-gray-600">Loading chama data...</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Members - Using currentChama.memberCount */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold mt-1">
                  {currentChama.memberCount || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-400">Your role: {currentChama.role}</span>
            </div>
          </div>

          {/* This Month's Collections */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month's Collections</p>
                <p className="text-2xl font-bold mt-1">
                  KSh {stats.currentMonthCollected?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.currentMonthCompliance || 0}% of expected
            </div>
          </div>

          {/* Active Loans */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Loans</p>
                <p className="text-2xl font-bold mt-1">{stats.activeLoans || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <HandCoins className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Outstanding: KSh {stats.outstandingLoans?.toLocaleString() || 0}
            </div>
          </div>

          {/* YTD Total */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">YTD Total</p>
                <p className="text-2xl font-bold mt-1">
                  KSh {stats.ytdTotal?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Progress Alert */}
        {stats.pendingCount > 0 && role !== 'MEMBER' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  {stats.pendingCount} member{stats.pendingCount !== 1 ? 's have' : ' has'} not paid this month
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Collection Progress</span>
                    <span>{stats.currentMonthCompliance || 0}%</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${stats.currentMonthCompliance || 0}%` }}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/contributions')}
                  className="text-sm text-yellow-700 hover:underline mt-3"
                >
                  Record payments →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {contributions.length === 0 && loans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributions.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.user?.name} paid contribution</p>
                          <p className="text-xs text-gray-500">{format(new Date(item.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-600">+KSh {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                  {loans.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <HandCoins className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.user?.name} requested a loan</p>
                          <p className="text-xs text-gray-500">Status: {item.status}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">KSh {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Upcoming Meetings & Invite */}
          <div className="space-y-6">
            {/* Invite Card */}
            {(role === 'OWNER' || role === 'TREASURER') && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <h2 className="font-semibold text-gray-900 mb-3">Invite Members</h2>
                <p className="text-sm text-gray-600 mb-2">Share this code with new members</p>
                <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-200">
                  <code className="flex-1 text-center font-mono text-lg font-bold text-purple-700">
                    {currentChama.inviteCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900">Upcoming Meetings</h2>
                <button 
                  onClick={() => navigate('/meetings')}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Schedule →
                </button>
              </div>
              
              {meetings.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No upcoming meetings</p>
                  <button 
                    onClick={() => navigate('/meetings')}
                    className="text-xs text-purple-600 hover:underline mt-2"
                  >
                    Schedule one now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting: any) => {
                    const daysUntil = differenceInDays(new Date(meeting.date), new Date());
                    return (
                      <div key={meeting.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{meeting.title}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(meeting.date), 'MMM d, h:mm a')}
                          </p>
                          {daysUntil === 0 && (
                            <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1">Today</span>
                          )}
                          {daysUntil === 1 && (
                            <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mt-1">Tomorrow</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => navigate('/contributions')}
              className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Wallet className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Record Payment</span>
            </button>
            <button
              onClick={() => navigate('/loans')}
              className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HandCoins className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Request Loan</span>
            </button>
            <button
              onClick={() => navigate('/meetings')}
              className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Schedule Meeting</span>
            </button>
            <button
              onClick={() => navigate('/members')}
              className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Manage Members</span>
            </button>
            {(role === 'OWNER' || role === 'TREASURER') && (
              <button
                onClick={copyInviteCode}
                className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Invite Members</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}