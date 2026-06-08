// hooks/useChamas.ts
import { useEffect, useState } from 'react';
import { useChamaStore } from '../stores/chamaStore';
import { useAuthStore } from '../stores/authStore';
import { chamaService } from '../services/chamaServices';

export const useChamas = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userChamas, setUserChamas } = useChamaStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const loadChamas = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const chamas = await chamaService.getMyChamas();
        console.log('Setting chamas in store:', chamas);
        setUserChamas(chamas);
      } catch (err) {
        console.error('Failed to load chamas:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chamas');
      } finally {
        setLoading(false);
      }
    };

    loadChamas();
  }, [isAuthenticated, user, setUserChamas]);

  return { userChamas, loading, error };
};