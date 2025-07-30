import { useState, useEffect } from 'react';
import { ProgressService } from '@/services';

const progressService = new ProgressService();

export interface CalendarData {
    readingDays: string[];
    currentYear: number;
    currentMonth: number;
    loading: boolean;
}

export const useCalendarData = () => {
    const [readingDays, setReadingDays] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

    const loadReadingActivity = async (year: number) => {
        try {
            setLoading(true);
            const activity = await progressService.getReadingActivity(year);
            setReadingDays(activity);
        } catch (error) {
            console.error('Error loading reading activity:', error);
            setReadingDays(new Map());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReadingActivity(currentYear);
    }, [currentYear]);

    const handleYearChange = (year: number) => {
        setCurrentYear(year);
    };

    const handleMonthChange = (month: number) => {
        setCurrentMonth(month);
    };

    const onRefresh = async () => {
        loadReadingActivity(currentYear);
    };

    return {
        readingDays,
        loading,
        currentYear,
        currentMonth,
        handleYearChange,
        handleMonthChange,
        onRefresh,
    };
};
