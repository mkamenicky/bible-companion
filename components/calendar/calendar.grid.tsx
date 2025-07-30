import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
    readingDays: Map<string, number>;
    currentMonth: number;
    currentYear: number;
    styles: any;
    customColors: any;
}

export default function CalendarGrid({
                                         readingDays,
                                         currentMonth,
                                         currentYear,
                                         styles,
                                         customColors
                                     }: Props) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get first day of the month and number of days in month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Check if a date was a reading day
    const isReadingDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return readingDays.get(dateStr);
    };

    // Generate calendar days
    const calendarDays = [];

    // Add previous month's trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        calendarDays.push({
            day,
            isCurrentMonth: false,
            isReadingDay: false,
            key: `prev-${day}`
        });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({
            day,
            isCurrentMonth: true,
            isReadingDay: isReadingDay(day),
            key: `current-${day}`
        });
    }

    // Add next month's leading days to complete the grid
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    let nextMonthDay = 1;
    while (calendarDays.length < totalCells) {
        calendarDays.push({
            day: nextMonthDay,
            isCurrentMonth: false,
            isReadingDay: false,
            key: `next-${nextMonthDay}`
        });
        nextMonthDay++;
    }

    const today = new Date();
    const isToday = (day: number) => {
        return today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === day;
    };

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {monthNames[currentMonth]} {currentYear}
                </Text>
                <Text style={styles.sectionSubtitle}>
                    Days you read the Bible
                </Text>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                {/* Day Headers */}
                <View style={{
                    flexDirection: 'row',
                    marginBottom: 12,
                }}>
                    {dayNames.map((dayName) => (
                        <View key={dayName} style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: 8,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: customColors.subtleGray,
                            }}>
                                {dayName}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                }}>
                    {calendarDays.map((dayInfo) => {
                        const isTodayCell = dayInfo.isCurrentMonth && isToday(dayInfo.day);

                        return (
                            <TouchableOpacity
                                key={dayInfo.key}
                                style={{
                                    width: '14.28%', // 100% / 7 days
                                    aspectRatio: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 4,
                                }}
                                disabled={!dayInfo.isCurrentMonth}
                            >
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: dayInfo.isReadingDay
                                        ? customColors.completedGreen
                                        : isTodayCell
                                            ? customColors.accent + '20'
                                            : 'transparent',
                                    borderWidth: isTodayCell ? 2 : 0,
                                    borderColor: isTodayCell ? customColors.accent : 'transparent',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: dayInfo.isReadingDay ? '600' : '400',
                                        color: dayInfo.isReadingDay
                                            ? '#ffffff'
                                            : dayInfo.isCurrentMonth
                                                ? customColors.color
                                                : customColors.subtleGray,
                                    }}>
                                        {dayInfo.day}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Legend */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 0.5,
                    borderTopColor: customColors.borderColor,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 20,
                    }}>
                        <View style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: customColors.completedGreen,
                            marginRight: 6,
                        }} />
                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                        }}>
                            Reading Day
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: customColors.accent,
                            backgroundColor: customColors.accent + '20',
                            marginRight: 6,
                        }} />
                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                        }}>
                            Today
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
