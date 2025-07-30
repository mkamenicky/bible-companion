import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
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
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: customColors.lightGray,
                    }}
                >
                    <Text style={{
                        fontSize: 18,
                        color: customColors.color,
                    }}>
                        ‹
                    </Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.color,
                    }}>
                        {monthNames[currentMonth]}
                    </Text>
                    {isCurrentMonth && (
                        <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: customColors.accent,
                            marginTop: 4,
                        }} />
                    )}
                </View>

                <TouchableOpacity
                    onPress={goToNextMonth}
                    style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: customColors.lightGray,
                    }}
                >
                    <Text style={{
                        fontSize: 18,
                        color: customColors.color,
                    }}>
                        ›
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
