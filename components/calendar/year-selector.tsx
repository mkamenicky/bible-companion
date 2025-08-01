import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from '@/hooks';

interface Props {
    currentYear: number;
    onYearChange: (year: number) => void;
    styles: any;
    customColors: any;
}

export default function YearSelector({
                                         currentYear,
                                         onYearChange,
                                         styles,
                                         customColors
                                     }: Props) {
    const t = useTranslation();
    const currentActualYear = new Date().getFullYear();

    // Generate years from 3 years ago to current year
    const years = [];
    for (let year = currentActualYear - 3; year <= currentActualYear; year++) {
        years.push(year);
    }

    return (
        <View style={[styles.card, { marginBottom: 8 }]}>
            <View style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
            }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: customColors.subtleGray,
                    marginBottom: 12,
                    textAlign: 'center',
                }}>
                    {t('calendar.selectYear')}
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        {years.map((year) => {
                            const isSelected = year === currentYear;
                            const isCurrentYear = year === currentActualYear;

                            return (
                                <TouchableOpacity
                                    key={year}
                                    onPress={() => onYearChange(year)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        marginHorizontal: 4,
                                        borderRadius: 16,
                                        backgroundColor: isSelected
                                            ? customColors.accent
                                            : customColors.lightGray,
                                        borderWidth: isCurrentYear && !isSelected ? 1.5 : 0,
                                        borderColor: isCurrentYear && !isSelected
                                            ? customColors.accent
                                            : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: isSelected ? '600' : '500',
                                        color: isSelected
                                            ? '#ffffff'
                                            : customColors.color,
                                    }}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}
