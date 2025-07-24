import React, {ReactNode, useCallback, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet} from 'react-native';
import {useTheme} from "react-native-paper";

type Props = {
    children: ReactNode;
    onRefresh?: () => Promise<void>;
};

export default function ScreenContainer({children, onRefresh}: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const {colors} = useTheme();

    const handleRefresh = useCallback(async () => {
        if (!onRefresh) return;

        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    return (
        <ScrollView
            style={{backgroundColor: colors.background}}
            contentContainerStyle={styles.content}
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
                ) : undefined
            }
        >
            {children}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        flexGrow: 1,
    },
});
