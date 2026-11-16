import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {progressService} from '@/services';
import {logger} from '@/utils/(utils)/logger';

/**
 * Reading activity (verses read per day) for the calendar screen.
 */
export const useCalendarData = () => {
    const [readingDays, setReadingDays] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

    const loadReadingActivity = useCallback(async (year: number) => {
        try {
            setReadingDays(await progressService.getReadingActivity(year));
        } catch (error) {
            logger.error('Error loading reading activity', error);
            setReadingDays(new Map());
        } finally {
            setLoading(false);
        }
    }, []);

    // Reload on focus and whenever another year is selected.
    useFocusEffect(
        useCallback(() => {
            loadReadingActivity(currentYear);
        }, [loadReadingActivity, currentYear])
    );

    return {
        readingDays,
        loading,
        currentYear,
        currentMonth,
        handleYearChange: setCurrentYear,
        handleMonthChange: setCurrentMonth,
        onRefresh: useCallback(() => loadReadingActivity(currentYear), [loadReadingActivity, currentYear]),
    };
};
