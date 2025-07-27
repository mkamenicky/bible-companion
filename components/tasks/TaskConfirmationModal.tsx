import React from 'react';
import { Button, Card, Modal, Portal } from 'react-native-paper';

interface Props {
    visible: boolean;
    task: string | null;
    onConfirm: () => void;
    onCancel: () => void;
    styles: any;
}

export default function TaskConfirmationModal({ visible, task, onConfirm, onCancel, styles }: Props) {
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onCancel}
                contentContainerStyle={styles.modalContainer}
            >
                <Card style={styles.modalCard}>
                    <Card.Title
                        title={`Are you sure you completed ${task}?`}
                        titleStyle={{ textAlign: 'center' }}
                    />
                    <Card.Content>
                        <Button onPress={onConfirm}>Yes, mark as done</Button>
                        <Button onPress={onCancel}>Cancel</Button>
                    </Card.Content>
                </Card>
            </Modal>
        </Portal>
    );
}
