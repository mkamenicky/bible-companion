import React, { useCallback, useState } from 'react';
import {Appbar, Text, useTheme} from 'react-native-paper';
import ScreenContainer from '@/components/ScreenContainer';
import {StyleSheet, useColorScheme, View} from "react-native";
import {getCustomColors, getStyles} from "@/utils/colorUtils";

export default function SettingsScreen() {
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const schema = useColorScheme();
    const customColors = getCustomColors(schema);
    const styles = getStyles(customColors);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // TODO: replace with real refresh logic
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background}}>

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
