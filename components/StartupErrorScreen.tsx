import React, {useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {localizationService} from '@/services';

interface Props {
    /** Technical reason, shown small so it can be passed on when asking for help. */
    details: string;
    onRetry: () => Promise<void> | void;
    /** Deletes the local database and installs a fresh copy. */
    onReset: () => Promise<void>;
}

/**
 * Shown when the database cannot be opened at startup. It replaces the app
 * silently starting without data (and then failing on every screen).
 *
 * Deliberately self-contained: no theme and no database access, because this
 * screen exists precisely for when those are unavailable.
 */
export default function StartupErrorScreen({details, onRetry, onReset}: Props) {
    const [busy, setBusy] = useState(false);
    const t = (key: string) => localizationService.t(key);

    const run = async (action: () => Promise<void> | void) => {
        setBusy(true);
        try {
            await action();
        } finally {
            setBusy(false);
        }
    };

    const confirmReset = () => {
        Alert.alert(t('startup.resetTitle'), t('startup.resetMessage'), [
            {text: t('common.cancel'), style: 'cancel'},
            {text: t('startup.reset'), style: 'destructive', onPress: () => run(onReset)},
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('startup.errorTitle')}</Text>
            <Text style={styles.message}>{t('startup.errorMessage')}</Text>
            <Text style={styles.details} selectable>{details}</Text>

            {busy ? (
                <ActivityIndicator size="large" color="#4F46E5" style={styles.spinner}/>
            ) : (
                <>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => run(onRetry)}>
                        <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={confirmReset}>
                        <Text style={styles.secondaryButtonText}>{t('startup.reset')}</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        lineHeight: 22,
        color: '#374151',
        marginBottom: 16,
    },
    details: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 32,
    },
    spinner: {
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#b91c1c',
        fontSize: 15,
        fontWeight: '600',
    },
});
