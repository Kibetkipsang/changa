// MyChamas.tsx - With comprehensive logging
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChamaStore } from '../stores/chamaStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { 
  Users, Plus, UserPlus, ChevronRight, Wallet, Calendar, 
  Crown, Shield, Users as UsersIcon, Loader2 
} from 'lucide-react';

export function MyChamas() {
  const navigate = useNavigate();
  const { userChamas, setUserChamas, setCurrentChama } = useChamaStore();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hoveredChama, setHoveredChama] = useState<string | null>(null);

  // Log initial render
  console.log('🎬 MyChamas component rendered', { 
    isAuthenticated, 
    userId: user?.id,
    storeChamasCount: userChamas.length 
  });

  // Load chamas when component mounts
  useEffect(() => {
    console.log('🔄 useEffect triggered', { isAuthenticated });
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping load');
      return;
    }
    
    const loadChamas = async () => {
      console.log('📡 Starting to load chamas...');
      try {
        setLoading(true);
        console.log('🔄 Making API call to /chamas');
        
        const response = await api.get('/chamas');
        console.log('✅ API Response received:', response);
        console.log('📦 Response data:', JSON.stringify(response.data, null, 2));
        
        // Check the structure
        if (response.data) {
          console.log('🔍 Response has data property:', Object.keys(response.data));
        }
        
        if (response.data.chamas) {
          console.log(`📊 Found ${response.data.chamas.length} chamas in response`);
          
          // Log each chama's details
          response.data.chamas.forEach((chama: any, index: number) => {
            console.log(`📋 Chama ${index + 1}:`, {
              id: chama.id,
              name: chama.name,
              role: chama.role,
              memberCount: chama.memberCount,
              memberCountType: typeof chama.memberCount,
              hasMemberCount: 'memberCount' in chama,
              allKeys: Object.keys(chama)
            });
          });
          
          console.log('💾 Setting userChamas in store...');
          setUserChamas(response.data.chamas);
          
          // Verify store was updated
          setTimeout(() => {
            const currentStore = useChamaStore.getState();
            console.log('🏪 Store after update:', {
              userChamasCount: currentStore.userChamas.length,
              firstChamaMemberCount: currentStore.userChamas[0]?.memberCount
            });
          }, 100);
        } else {
          console.warn('⚠️ No chamas array in response:', response.data);
        }
      } catch (error:any) {
        console.error('❌ Failed to load chamas:', error);
        if (error.response) {
          console.error('Response error status:', error.response.status);
          console.error('Response error data:', error.response.data);
        }
      } finally {
        setLoading(false);
        console.log('🏁 Loading complete');
      }
    };
    
    loadChamas();
  }, [isAuthenticated, setUserChamas]);

  // Log when userChamas changes
  useEffect(() => {
    console.log('📊 userChamas state changed:', {
      count: userChamas.length,
      chamas: userChamas.map(c => ({
        name: c.name,
        memberCount: c.memberCount,
        role: c.role
      }))
    });
  }, [userChamas]);

  const handleSelectChama = (chama: any) => {
    console.log('🎯 Selected chama:', {
      name: chama.name,
      memberCount: chama.memberCount,
      role: chama.role
    });
    setCurrentChama(chama);
    navigate('/dashboard');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'TREASURER': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'SECRETARY': return <UsersIcon className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: any = {
      OWNER: 'bg-yellow-100 text-yellow-800',
      TREASURER: 'bg-blue-100 text-blue-800',
      SECRETARY: 'bg-green-100 text-green-800',
      MEMBER: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.MEMBER}`}>{role}</span>;
  };

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  console.log('🎨 Rendering main content, chamas count:', userChamas.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-purple-700">Changa.com</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/create-chama')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" /> Create Chama
              </button>
              <button
                onClick={() => navigate('/join-chama')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
              >
                <UserPlus className="w-4 h-4" /> Join Chama
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Chamas</h1>
          <p className="text-gray-600 mt-1">Select a chama to continue</p>
          {/* Debug info */}
          
        </div>

        {userChamas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userChamas.map((chama, index) => {
              // Log each chama during render
              console.log(`🃏 Rendering card ${index + 1}:`, {
                name: chama.name,
                memberCount: chama.memberCount,
                memberCountType: typeof chama.memberCount,
                rawValue: JSON.stringify(chama.memberCount)
              });
              
              return (
                <div
                  key={chama.id}
                  onMouseEnter={() => setHoveredChama(chama.id)}
                  onMouseLeave={() => setHoveredChama(null)}
                  onClick={() => handleSelectChama(chama)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-purple-200"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{chama.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            {getRoleIcon(chama.role)}
                            {getRoleBadge(chama.role)}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${hoveredChama === chama.id ? 'translate-x-1 text-purple-600' : ''}`} />
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* memberCount display with extra debug info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>Members</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {chama.memberCount !== undefined ? chama.memberCount : 'undefined'}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            (type: {typeof chama.memberCount})
                          </span>
                        </div>
                      </div>
                      
                      {chama.contributionAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Wallet className="w-4 h-4" />
                            <span>Contribution</span>
                          </div>
                          <span className="font-medium text-gray-900">KSh {chama.contributionAmount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Frequency</span>
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{chama.frequency}</span>
                      </div>
                    </div>

                    {chama.role === 'OWNER' && chama.inviteCode && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500 mb-1">Invite Code</p>
                          <code className="text-sm font-mono font-semibold text-purple-700">{chama.inviteCode}</code>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Click to access</span>
                      <span className="text-purple-600">Go to dashboard →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Chamas Yet</h2>
            <p className="text-gray-600 mb-6">Create a new chama or join an existing one to get started</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/create-chama')}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" /> Create Chama
              </button>
              <button
                onClick={() => navigate('/join-chama')}
                className="flex items-center gap-2 px-6 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
              >
                <UserPlus className="w-4 h-4" /> Join Chama
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}