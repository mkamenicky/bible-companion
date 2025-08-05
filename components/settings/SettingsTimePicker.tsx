
import React from 'react';
import { Platform, Modal, View, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeService } from '@/services';

interface SettingsTimePickerProps {
    visible: boolean;
    selectedTime: Date;
    onTimeChange: (event: any, selectedDate?: Date) => void;
    onDismiss?: () => void;
    title?: string;
}

export default function SettingsTimePicker({
                                               visible,
                                               selectedTime,
                                               onTimeChange,
                                               onDismiss,
                                               title = 'Select Time',
                                           }: SettingsTimePickerProps) {
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (!visible) return null;

    // Android: Direct DateTimePicker with theme-aware props
    if (Platform.OS === 'android') {
        return (
            <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
                // Theme-aware props for Android
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                accentColor={customColors.primary}
                textColor={customColors.text}
                // Note: Some of these props might not work on all Android versions
                style={{
                    backgroundColor: customColors.surface,
                }}
            />
        );
    }

    // iOS: Modal with DateTimePicker using full theming
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onDismiss}
        >
            {/* Modal Overlay with themed background */}
            <View style={[
                styles.modalOverlay,
                {
                    backgroundColor: colorScheme === 'dark'
                        ? 'rgba(0, 0, 0, 0.7)'
                        : 'rgba(0, 0, 0, 0.5)'
                }
            ]}>
                {/* Modal Content with full theming */}
                <View style={[
                    styles.modalContent,
                    {
                        backgroundColor: customColors.surface,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        // Add subtle shadow for light themes
                        ...(colorScheme === 'light' && {
                            shadowColor: customColors.shadowColor,
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 8,
                        })
                    }
                ]}>
                    <SafeAreaView>
                        {/* Header with full theming */}
                        <View style={[
                            styles.pickerHeader,
                            {
                                backgroundColor: customColors.surface,
                                borderBottomColor: customColors.borderColor,
                                borderBottomWidth: 0.5,
                            }
                        ]}>
                            <TouchableOpacity
                                onPress={onDismiss}
                                style={[
                                    styles.pickerButton,
                                    {
                                        backgroundColor: customColors.lightGray,
                                        borderRadius: 8,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.pickerButtonText,
                                    {
                                        color: customColors.text,
                                        fontWeight: '500'
                                    }
                                ]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <Text style={[
                                styles.pickerTitle,
                                {
                                    color: customColors.text,
                                    fontSize: 18,
                                    fontWeight: '600'
                                }
                            ]}>
                                {title}
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    onTimeChange({ type: 'set' }, selectedTime);
                                    onDismiss?.();
                                }}
                                style={[
                                    styles.pickerButton,
                                    {
                                        backgroundColor: customColors.primary,
                                        borderRadius: 8,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.pickerButtonTextDone,
                                    {
                                        color: '#ffffff',
                                        fontWeight: '600'
                                    }
                                ]}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Time Picker Container with themed background */}
                        <View style={{
                            paddingHorizontal: 16,
                            paddingTop: 16,
                            backgroundColor: customColors.surface,
                            // Add subtle background tint based on theme
                            ...(colorScheme === 'dark' && {
                                backgroundColor: customColors.cardBackground,
                            })
                        }}>
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                is24Hour={true}
                                display="spinner"
                                onChange={(event, date) => {
                                    if (date) {
                                        onTimeChange(event, date);
                                    }
                                }}
                                // Theme-aware props for iOS
                                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                                accentColor={customColors.primary}
                                textColor={customColors.text}
                                style={[
                                    styles.picker,
                                    {
                                        backgroundColor: 'transparent',
                                        // Try to blend with the themed background
                                        ...(colorScheme === 'dark' && {
                                            backgroundColor: customColors.cardBackground,
                                        })
                                    }
                                ]}
                            />
                        </View>

                        {/* Optional: Add themed footer */}
                        <View style={{
                            paddingHorizontal: 16,
                            paddingBottom: 8,
                            backgroundColor: customColors.surface,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: customColors.subtleGray,
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                Swipe to adjust time
                            </Text>
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
}
