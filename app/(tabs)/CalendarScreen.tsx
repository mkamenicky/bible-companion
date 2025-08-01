// CalendarScreen.tsx
import React from 'react';
import { useColorScheme, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import {
    CalendarGrid,
    LoadingScreen,
    MonthNavigator,
    ScreenContainer,
    YearSelector
} from '@/components';
import { useCalendarData, useTranslation } from '@/hooks';
import { ThemeService } from '@/services';

export default function ReadingCalendarScreen() {
    const t = useTranslation();
    const {
        readingDays,
        loading,
        currentYear,
        currentMonth,
        handleYearChange,
        handleMonthChange,
        onRefresh,
    } = useCalendarData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading) {
        return (
            <LoadingScreen
                message={t('calendar.loadingMessage')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('calendar.title')}
                    titleStyle={{ color: customColors.color, fontWeight: '600' }}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <YearSelector
                    currentYear={currentYear}
                    onYearChange={handleYearChange}
                    styles={styles}
                    customColors={customColors}
                />

                <MonthNavigator
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onMonthChange={handleMonthChange}
                    styles={styles}
                    customColors={customColors}
                />

                <CalendarGrid
                    readingDays={readingDays}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onMonthChange={handleMonthChange}
                    onYearChange={handleYearChange}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>
        </View>
    );
}
