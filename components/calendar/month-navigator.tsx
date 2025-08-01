import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/hooks';

interface Props {
    currentMonth: number;
    currentYear: number;
    onMonthChange: (month: number) => void;
    styles: any;
    customColors: any;
}

export default function MonthNavigator({
                                           currentMonth,
                                           currentYear,
                                           onMonthChange,
                                           styles,
                                           customColors
                                       }: Props) {
    const t = useTranslation();

    // Get localized month names
    const monthNames = [
        t('dateFormat.months.january'),
        t('dateFormat.months.february'),
        t('dateFormat.months.march'),
        t('dateFormat.months.april'),
        t('dateFormat.months.may'),
        t('dateFormat.months.june'),
        t('dateFormat.months.july'),
        t('dateFormat.months.august'),
        t('dateFormat.months.september'),
        t('dateFormat.months.october'),
        t('dateFormat.months.november'),
        t('dateFormat.months.december')
    ];

    const goToPreviousMonth = () => {
        const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        onMonthChange(newMonth);
    };

    const goToNextMonth = () => {
        const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        onMonthChange(newMonth);
    };

    const currentDate = new Date();
    const isCurrentMonth = currentDate.getMonth() === currentMonth &&
        currentDate.getFullYear() === currentYear;

    return (
        <View style={[styles.card, { marginBottom: 8 }]}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
            }}>
                <TouchableOpacity
                    onPress={goToPreviousMonth}
                    style={{
                        paddingHorizontal: 16,    // Increased from 8
                        paddingVertical: 12,      // Increased from 8
                        minWidth: 50,             // Added minimum width
                        borderRadius: 12,         // Increased border radius
                        backgroundColor: customColors.lightGray,
                        alignItems: 'center',     // Center the arrow
                        justifyContent: 'center',
                        elevation: 1,             // Added subtle elevation
                        shadowColor: customColors.color,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                    }}
                >
                    <Text style={{
                        fontSize: 20,             // Increased from 18
                        fontWeight: '600',        // Added font weight
                        color: customColors.color,
                    }}>
                        ‹
                    </Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{
                        fontSize: 20,             // Increased from 18
                        fontWeight: '700',        // Increased font weight
                        color: customColors.color,
                        textAlign: 'center',
                    }}>
                        {monthNames[currentMonth]}
                    </Text>
                    {isCurrentMonth && (
                        <View style={{
                            width: 8,             // Increased from 6
                            height: 8,            // Increased from 6
                            borderRadius: 4,      // Adjusted for new size
                            backgroundColor: customColors.accent,
                            marginTop: 6,         // Increased from 4
                        }} />
                    )}
                </View>

                <TouchableOpacity
                    onPress={goToNextMonth}
                    style={{
                        paddingHorizontal: 16,    // Increased from 8
                        paddingVertical: 12,      // Increased from 8
                        minWidth: 50,             // Added minimum width
                        borderRadius: 12,         // Increased border radius
                        backgroundColor: customColors.lightGray,
                        alignItems: 'center',     // Center the arrow
                        justifyContent: 'center',
                        elevation: 1,             // Added subtle elevation
                        shadowColor: customColors.color,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                    }}
                >
                    <Text style={{
                        fontSize: 20,             // Increased from 18
                        fontWeight: '600',        // Added font weight
                        color: customColors.color,
                    }}>
                        ›
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
