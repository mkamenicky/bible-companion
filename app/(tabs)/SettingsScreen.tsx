import React, { useCallback, useState } from 'react';
import {Appbar, Text, useTheme} from 'react-native-paper';
import ScreenContainer from '@/components/ScreenContainer';
import {StyleSheet, View} from "react-native";

export default function SettingsScreen() {
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // TODO: replace with real refresh logic
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    return (
        <View style={{backgroundColor: colors.background}}>

        <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Settings" />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <Text variant="titleLarge" style={{ textAlign: 'center' }}>
                    Settings Screen
                </Text>
            </ScreenContainer>
        </View>

    );
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: '#e0e0e0', // light gray; adjust as needed
    },
    progressCard: {
        borderRadius: 12,
        elevation: 2,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
});
