// TaskConfirmationModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import {useLocalization, useTranslation} from '@/hooks';

interface Props {
    visible: boolean;
    task: string | null;
    onConfirm: (task: string, status: any) => void;
    onCancel: () => void;
    styles: any;
    customColors?: any;
}

export default function TaskConfirmationModal({
                                                  visible,
                                                  task,
                                                  onConfirm,
                                                  onCancel,
                                                  styles,
                                                  customColors
                                              }: Props) {
    const { t, translateTask } = useLocalization();

    if (!task) return null;

    // Get the translated task name for display
    const translatedTaskName = translateTask(task);

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onCancel}
                contentContainerStyle={styles.modalContainer}
            >
                <View style={[styles.modalCard, { borderRadius: 12 }]}>
                    <View style={{ padding: 20, paddingBottom: 16 }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: customColors?.color || '#262626',
                            textAlign: 'center',
                            marginBottom: 8
                        }}>
                            {t('taskConfirmation.title')}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: customColors?.subtleGray || '#8e8e8e',
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            {t('taskConfirmation.message', { task: translatedTaskName })}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        borderTopWidth: 0.5,
                        borderTopColor: customColors?.borderColor || '#dbdbdb',
                    }}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={{
                                flex: 1,
                                padding: 16,
                                alignItems: 'center',
                                borderRightWidth: 0.5,
                                borderRightColor: customColors?.borderColor || '#dbdbdb',
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: customColors?.subtleGray || '#8e8e8e'
                            }}>
                                {t('taskConfirmation.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onConfirm(task, undefined)}
                            style={{
                                flex: 1,
                                padding: 16,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: customColors?.instagramBlue || '#0095f6'
                            }}>
                                {t('taskConfirmation.markComplete')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
}
