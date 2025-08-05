import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';

interface ScreenContainerProps {
    children: React.ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    style?: any;
}

export const SettingsScreenContainer: React.FC<ScreenContainerProps> = ({
                                                                    children,
                                                                    onRefresh,
                                                                    refreshing = false,
                                                                    style,
                                                                }) => {
    return (
        <ScrollView
            style={[{ flex: 1 }, style]}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                ) : undefined
            }
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    );
};
