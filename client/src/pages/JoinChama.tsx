import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';
import { useChamaStore } from '../stores/chamaStore';
import { Loader2, ArrowLeft } from 'lucide-react';

export function JoinChama() {
  const navigate = useNavigate();
  const { setCurrentChama, setUserChamas, userChamas } = useChamaStore();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/chamas/join', { inviteCode: code });
      return response.data;
    },
    retry: false,
    onSuccess: (data) => {
  const newChama = data.chama;

  setUserChamas([
    ...userChamas,
    {
      ...newChama,
      role: "MEMBER",
      memberCount: newChama.memberCount || 0,
    },
  ]);

  setCurrentChama({
    ...newChama,
    role: "MEMBER",
    memberCount: newChama.memberCount || 0,
  });

  toast.success(data.message);
  navigate('/dashboard');
},
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Invalid invite code');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (isSubmitting) return;

  const code = inviteCode.trim().toUpperCase();
  if (!code) return;

  setIsSubmitting(true);

  joinMutation.mutate(code, {
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
};

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Join a Chama</h1>
            <p className="text-gray-600 mt-1">Enter the invite code shared by the chama owner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition uppercase text-center tracking-wider font-mono text-lg"
                placeholder="••••••••••"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the 10-character code you received from the chama organizer
              </p>
            </div>

            <button
              type="submit"
              disabled={joinMutation.isPending || isSubmitting || !inviteCode.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joinMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {joinMutation.isPending ? 'Joining...' : 'Join Chama'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/create-chama')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Create a new chama instead
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}