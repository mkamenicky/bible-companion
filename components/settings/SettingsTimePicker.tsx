// SettingsTimePicker.tsx
import React from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SettingsTimePickerProps {
    visible: boolean;
    selectedTime: Date;
    onTimeChange: (event: any, selectedDate?: Date) => void;
}

export default function SettingsTimePicker({
                                               visible,
                                               selectedTime,
                                               onTimeChange,
                                           }: SettingsTimePickerProps) {
    if (!visible) return null;

    return (
        <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
        />
    );
}
