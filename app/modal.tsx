import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { Appbar, Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
    const router = useRouter();

    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Modal" />
            </Appbar.Header>

            <View style={styles.container}>
                <Card style={styles.card}>
                    <Card.Title title="This is a modal screen" />
                    <Card.Content>
                        <Text variant="bodyMedium">
                            You can customize this modal for settings, info, or contextual actions.
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => router.back()}>
                            Close
                        </Button>
                    </Card.Actions>
                </Card>
            </View>

            {/* Optional: light status bar style for iOS */}
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        borderRadius: 12,
        elevation: 2,
    },
});
