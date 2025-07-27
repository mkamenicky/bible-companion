import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProgressService, ProgressStats } from '@/services/progress/ProgressService';

export function useProgressData() {
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const progressService = useMemo(() => new ProgressService(), []);

    const fetchStats = useCallback(async (): Promise<void> => {
        try {
            const progressStats = await progressService.getProgressStats();
            setStats(progressStats);
        } catch (error) {
            console.error('Error fetching progress stats:', error);
        } finally {
            setLoading(false);
        }
    }, [progressService]);

    const onRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, [fetchStats]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        refreshing,
        onRefresh,
    };
}
