// LoadingScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface LoadingScreenProps {
    message: string;
    isError?: boolean;
    onRetry?: () => void;
    styles: any;
    customColors: any;
}

export default function LoadingScreen({
                                          message,
                                          isError = false,
                                          onRetry,
                                          styles,
                                          customColors,
                                      }: LoadingScreenProps) {
    if (isError) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Something went wrong</Text>
                        <Text style={styles.sectionSubtitle}>Unable to load settings</Text>
                    </View>

                    {/* Error message */}
                    <View style={styles.listItem}>
                        <View style={[
                            styles.itemIcon,
                            { backgroundColor: '#ffebee' }
                        ]}>
                            <Text style={{ fontSize: 18 }}>❌</Text>
                        </View>

                        <View style={styles.itemContent}>
                            <Text style={styles.itemTitle}>Error</Text>
                            <Text style={styles.itemSubtitle}>
                                {message}
                            </Text>
                        </View>
                    </View>

                    {/* Retry button */}
                    {onRetry && (
                        <View style={{
                            padding: 16,
                            alignItems: 'center',
                            borderTopWidth: 0.5,
                            borderTopColor: customColors?.borderColor || '#dbdbdb',
                        }}>
                            <TouchableOpacity
                                style={[
                                    styles.retryButton,
                                    { backgroundColor: customColors.instagramBlue }
                                ]}
                                onPress={onRetry}
                            >
                                <Text style={[styles.retryButtonText, { color: 'white' }]}>
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Loading</Text>
                    <Text style={styles.sectionSubtitle}>Please wait while we load your settings</Text>
                </View>

                {/* Loading indicator */}
                <View style={styles.listItem}>
                    <View style={[
                        styles.itemIcon,
                        { backgroundColor: '#e3f2fd' }
                    ]}>
                        <ActivityIndicator size="small" color={customColors.instagramBlue} />
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>Loading Settings</Text>
                        <Text style={styles.itemSubtitle}>
                            {message}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
