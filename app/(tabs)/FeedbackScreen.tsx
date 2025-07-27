// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar, Button, Card, TextInput, useTheme} from 'react-native-paper';

// Local component imports
import ScreenContainer from '@/components/ScreenContainer';

// Service and utility imports
import {useFeedbackData} from '@/hooks/useFeedbackData';
import {ThemeService} from '@/services/theme/ThemeService';

export default function FeedbackScreen() {
    // Custom hook for data management
    const {
        formData,
        isSubmitting,
        updateField,
        submitFeedback,
        resetForm,
    } = useFeedbackData();

    // Theme and styling
    const {colors} = useTheme();
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    const handleSubmit = async () => {
        const success = await submitFeedback();
        if (success) {
            resetForm();
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Feedback"/>
            </Appbar.Header>

            <ScreenContainer>
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Subject"
                            value={formData.subject}
                            onChangeText={(text) => updateField('subject', text)}
                            mode="outlined"
                            style={{marginBottom: 16}}
                            disabled={isSubmitting}
                        />

                        <TextInput
                            label="Email (optional)"
                            value={formData.email}
                            onChangeText={(text) => updateField('email', text)}
                            mode="outlined"
                            keyboardType="email-address"
                            style={{marginBottom: 16}}
                            disabled={isSubmitting}
                        />

                        <TextInput
                            label="Message"
                            value={formData.message}
                            onChangeText={(text) => updateField('message', text)}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            style={{marginBottom: 24}}
                            disabled={isSubmitting}
                        />

                        <View style={{flexDirection: 'row', gap: 12}}>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                style={{flex: 1}}
                            >
                                Submit Feedback
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={resetForm}
                                disabled={isSubmitting}
                                style={{flex: 1}}
                            >
                                Clear
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            </ScreenContainer>
        </View>
    );
}
