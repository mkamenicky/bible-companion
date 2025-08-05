// React imports
import React from 'react';
import { View, Text } from 'react-native';

// Third-party library imports
import { ActivityIndicator } from 'react-native-paper';

interface LoadingScreenProps {
    message?: string;
    styles: any;
    customColors: any;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
                                                                message = "Loading...",
                                                                styles,
                                                                customColors
                                                            }) => {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={customColors.accent} />
            <Text style={{ marginTop: 16, color: customColors.text }}>{message}</Text>
        </View>
    );
};
