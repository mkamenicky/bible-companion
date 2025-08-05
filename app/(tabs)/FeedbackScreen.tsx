// FeedbackScreen.tsx
import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar, Button, Card, TextInput} from 'react-native-paper';
import ScreenContainer from '@/components/ScreenContainer';
import {useFeedbackData, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';

export default function FeedbackScreen() {
    const t = useTranslation();
    const {
        formData,
        isSubmitting,
        updateField,
        submitFeedback,
        resetForm,
    } = useFeedbackData();

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
                <Appbar.Content title={t('feedback.title')}/>
            </Appbar.Header>

            <ScreenContainer>
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label={t('feedback.subjectLabel')}
                            value={formData.subject}
                            onChangeText={(text) => updateField('subject', text)}
                            mode="outlined"
                            style={{marginBottom: 16, backgroundColor: customColors.surface, color: customColors.text}}
                            disabled={isSubmitting}
                            theme={{colors: {primary: customColors.accent, text: customColors.text}}}
                        />

                        <TextInput
                            label={t('feedback.emailLabel')}
                            value={formData.email}
                            onChangeText={(text) => updateField('email', text)}
                            mode="outlined"
                            keyboardType="email-address"
                            style={{marginBottom: 16, backgroundColor: customColors.surface, color: customColors.text}}
                            disabled={isSubmitting}
                            theme={{colors: {primary: customColors.accent, text: customColors.text}}}
                        />

                        <TextInput
                            label={t('feedback.messageLabel')}
                            value={formData.message}
                            onChangeText={(text) => updateField('message', text)}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            style={{marginBottom: 24, backgroundColor: customColors.surface, color: customColors.text}}
                            disabled={isSubmitting}
                            theme={{colors: {primary: customColors.accent, text: customColors.text}}}
                        />

                        <View style={{flexDirection: 'row', gap: 12}}>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                style={{flex: 1, backgroundColor: customColors.accent}}
                                labelStyle={{color: '#fff'}}
                            >
                                {t('feedback.submitButton')}
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={resetForm}
                                disabled={isSubmitting}
                                style={{flex: 1, borderColor: customColors.accent}}
                                labelStyle={{color: customColors.accent}}
                            >
                                {t('feedback.clearButton')}
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            </ScreenContainer>
        </View>
    );
}
