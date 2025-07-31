// SettingsDialogs.tsx
import React from 'react';
import {Button, Dialog, Portal, Text, TextInput,} from 'react-native-paper';
import {ThemeSelector} from "@/components/theme/ThemeSelector";

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
    selectedTime: Date;
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
    return (
        <Portal>
            {/* Daily Goal Dialog */}
            <Dialog
                visible={dialogs.dailyGoal}
                onDismiss={() => onToggleDialog('dailyGoal', false)}
                style={styles.dialogSurface}
            >
                <Dialog.Title style={styles.dialogTitle}>
                    Set Daily Reading Goal
                </Dialog.Title>
                <Dialog.Content>
                    <Text style={[styles.dialogContent, {marginBottom: 16}]}>
                        How many verses would you like to read each day?
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formStates.dailyGoalInput}
                        onChangeText={(text) => onUpdateFormState('dailyGoalInput', text)}
                        keyboardType="numeric"
                        placeholder="Enter verses (1-100)"
                        style={styles.formInput}
                        theme={{
                            colors: {
                                primary: customColors.accent,
                                text: customColors.text,
                                placeholder: customColors.subtleGray,
                                surface: customColors.surface,
                            }
                        }}
                        right={<TextInput.Affix text="verses"/>}
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('dailyGoal', false)}
                        textColor={customColors.subtleGray}
                    >
                        Cancel
                    </Button>
                    <Button
                        onPress={onDailyGoalSave}
                        mode="contained"
                        buttonColor={customColors.accent}
                        style={styles.formButton}
                    >
                        Save Goal
                    </Button>
                </Dialog.Actions>
            </Dialog>
            {/* Theme Dialog */
            }
            <Dialog visible={dialogs.changeTheme}
                    onDismiss={() => onToggleDialog('changeTheme', false)}
                    style={styles.dialogSurface}>
                <Dialog.Title style={styles.dialogTitle}>
                    Change Theme
                </Dialog.Title>
                <Dialog.Content>
                    <ThemeSelector onThemeChange={() => {}}/>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('changeTheme', false)}
                        textColor={customColors.subtleGray}
                    >
                        Ok
                    </Button>
                </Dialog.Actions>
            </Dialog>

            {/* Export Dialog */
            }
            <Dialog
                visible={dialogs.exportData}
                onDismiss={() => onToggleDialog('exportData', false)}
                style={styles.dialogSurface}
            >
                <Dialog.Title style={styles.dialogTitle}>
                    Export Settings
                </Dialog.Title>
                <Dialog.Content>
                    <Text style={[styles.dialogContent, {marginBottom: 16}]}>
                        This will create a backup file containing all your settings and preferences.
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => onToggleDialog('exportData', false)}
                        textColor={customColors.subtleGray}
                    >
                        Cancel
                    </Button>
                    <Button
                        onPress={onExportSettings}
                        mode="contained"
                        buttonColor={customColors.accent}
                        style={styles.formButton}
                    >
                        Export
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    )
        ;
}
