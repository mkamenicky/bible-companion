import React, {ReactNode, useCallback, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet} from 'react-native';
import {useTheme} from "react-native-paper";
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = {
    children: ReactNode;
    onRefresh?: () => Promise<void>;
    /**
     * Keep the content clear of the system navigation bar. Needed on screens
     * outside the tab layout (the tab bar already does this for tab screens),
     * because Android draws apps edge-to-edge.
     */
    padBottomInset?: boolean;
};

export default function ScreenContainer({children, onRefresh, padBottomInset}: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const {colors} = useTheme();
    const insets = useSafeAreaInsets();

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
            contentContainerStyle={[styles.content, padBottomInset && {paddingBottom: 16 + insets.bottom}]}
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
