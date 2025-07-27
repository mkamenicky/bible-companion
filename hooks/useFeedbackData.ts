import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export interface FeedbackData {
    subject: string;
    message: string;
    email?: string;
}

export function useFeedbackData() {
    const [formData, setFormData] = useState<FeedbackData>({
        subject: '',
        message: '',
        email: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = useCallback((field: keyof FeedbackData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const validateForm = useCallback((): boolean => {
        if (!formData.subject.trim()) {
            Alert.alert('Error', 'Please enter a subject');
            return false;
        }
        if (!formData.message.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return false;
        }
        return true;
    }, [formData]);

    const submitFeedback = useCallback(async (): Promise<boolean> => {
        if (!validateForm()) return false;

        setIsSubmitting(true);
        try {
            // TODO: Implement actual feedback submission
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            Alert.alert('Success', 'Thank you for your feedback!');
            setFormData({ subject: '', message: '', email: '' });
            return true;
        } catch (error) {
            Alert.alert('Error', 'Failed to submit feedback. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm]);

    const resetForm = useCallback(() => {
        setFormData({ subject: '', message: '', email: '' });
    }, []);

    return {
        formData,
        isSubmitting,
        updateField,
        submitFeedback,
        resetForm,
    };
}
