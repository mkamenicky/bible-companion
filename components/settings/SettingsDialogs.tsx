// SettingsDialogs.tsx
import React from 'react';
import {Button, Dialog, Portal, Text, TextInput,} from 'react-native-paper';
import {ThemeSelector} from "@/components/theme/ThemeSelector";
import { useTranslation } from '@/hooks';

interface DialogStates {
    changeTheme: boolean;
    dailyGoal: boolean;
    fontSize: boolean;
    exportData: boolean;
    resetConfirm: boolean;
}

interface FormStates {
    dailyGoalInput: string;
    timePickerVisible: boolean;
    streakTimePickerVisible: boolean;
    goalTimePickerVisible: boolean;
    selectedTime: Date;
    selectedStreakTime: Date;
    selectedGoalTime: Date;
    currentTimePickerType: 'daily' | 'streak' | 'goal';
    refreshing: boolean;
}

interface SettingsDialogsProps {
    dialogs: DialogStates;
    formStates: FormStates;
    onToggleDialog: (dialogName: keyof DialogStates, visible?: boolean) => void;
    onDailyGoalSave: () => void;
    onExportSettings: () => void;
    onUpdateFormState: <K extends keyof FormStates>(key: K, value: FormStates[K]) => void;
    styles: any;
    customColors: any;
}

export default function SettingsDialogs({
                                            dialogs,
                                            formStates,
                                            onToggleDialog,
                                            onDailyGoalSave,
                                            onExportSettings,
                                            onUpdateFormState,
                                            styles,
                                            customColors,
                                        }: SettingsDialogsProps) {
    const t = useTranslation();

    return (
        <Portal>
            {/* Daily Goal Dialog */}
            <Dialog
                visible={dialogs.dailyGoal}
                onDismiss={() => onToggleDialog('dailyGoal', false)}
                style={styles.dialogSurface}
            >
                <Dialog.Title style={styles.dialogTitle}>
                    {t('settings.dialogs.setDailyGoal')}
                </Dialog.Title>
                <Dialog.Content>
                    <Text style={[styles.dialogContent, {marginBottom: 16}]}>
                        {t('settings.dialogs.dailyGoalQuestion')}
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formStates.dailyGoalInput}
                        onChangeText={(text) => onUpdateFormState('dailyGoalInput', text)}
                        keyboardType="numeric"
                        placeholder={t('settings.dialogs.versesPlaceholder')}
                        style={styles.formInput}
                        theme={{
                            colors: {
                                primary: customColors.accent,
                                text: customColors.text,
                                placeholder: customColors.subtleGray,
                                surface: customColors.surface,
                            }
                        }}
                        right={<TextInput.Affix text={t('common.verses')}/>}
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('dailyGoal', false)}
                        textColor={customColors.subtleGray}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onPress={onDailyGoalSave}
                        mode="contained"
                        buttonColor={customColors.accent}
                        style={styles.formButton}
                    >
                        {t('settings.dialogs.saveGoal')}
                    </Button>
                </Dialog.Actions>
            </Dialog>

            {/* Theme Dialog */}
            <Dialog visible={dialogs.changeTheme}
                    onDismiss={() => onToggleDialog('changeTheme', false)}
                    style={styles.dialogSurface}>
                <Dialog.Title style={styles.dialogTitle}>
                    {t('settings.dialogs.changeTheme')}
                </Dialog.Title>
                <Dialog.Content>
                    <ThemeSelector onThemeChange={() => {}}/>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('changeTheme', false)}
                        textColor={customColors.subtleGray}
                    >
                        {t('common.ok')}
                    </Button>
                </Dialog.Actions>
            </Dialog>

            {/* Export Dialog */}
            <Dialog
                visible={dialogs.exportData}
                onDismiss={() => onToggleDialog('exportData', false)}
                style={styles.dialogSurface}
            >
                <Dialog.Title style={styles.dialogTitle}>
                    {t('settings.dialogs.exportSettings')}
                </Dialog.Title>
                <Dialog.Content>
                    <Text style={[styles.dialogContent, {marginBottom: 16}]}>
                        {t('settings.dialogs.exportDescription')}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('exportData', false)}
                        textColor={customColors.subtleGray}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onPress={onExportSettings}
                        mode="contained"
                        buttonColor={customColors.accent}
                        style={styles.formButton}
                    >
                        {t('settings.export')}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}
