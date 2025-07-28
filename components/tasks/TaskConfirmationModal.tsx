import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

interface Props {
    visible: boolean;
    task: string | null;
    onConfirm: () => void;
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
    if (!task) return null;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onCancel}
                contentContainerStyle={styles.modalContainer}
            >
                <View style={[styles.modalCard, { borderRadius: 12 }]}>
                    {/* Modal header */}
                    <View style={{ padding: 20, paddingBottom: 16 }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: customColors?.color || '#262626',
                            textAlign: 'center',
                            marginBottom: 8
                        }}>
                            Mark as Complete?
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: customColors?.subtleGray || '#8e8e8e',
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            Are you sure you've completed "{task}"?
                        </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={{
                        flexDirection: 'row',
                        borderTopWidth: 0.5,
                        borderTopColor: customColors?.borderColor || '#dbdbdb',
                    }}>
                        {/* Cancel button */}
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
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        {/* Confirm button */}
                        <TouchableOpacity
                            onPress={onConfirm}
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
                                Mark Complete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
}
