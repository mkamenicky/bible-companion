// components/AchievementNotificationModal.tsx - Auto-fade version with real-time countdown
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Animated } from 'react-native';
import { useTranslation } from '@/hooks';
import { progressService } from '@/services';
import type { AchievementUnlockEvent, Achievement } from '@/models';

interface Props {
    events: AchievementUnlockEvent[];
    onClose: () => void;
    styles: any;
    customColors: any;
}

interface AchievementWithDetails extends Achievement {
    unlockEvent: AchievementUnlockEvent;
}

export default function AchievementNotificationModal({
                                                         events,
                                                         onClose,
                                                         styles,
                                                         customColors
                                                     }: Props) {
    const t = useTranslation();
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [achievementDetails, setAchievementDetails] = useState<AchievementWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(2); // Add countdown state

    const hasMultipleEvents = events.length > 1;
    const currentAchievement = achievementDetails[currentEventIndex];

    // Load full achievement details for all events
    useEffect(() => {
        const loadAchievementDetails = async () => {
            try {
                setLoading(true);
                const details: AchievementWithDetails[] = [];

                for (const event of events) {
                    try {
                        // Try to get the full achievement details
                        const achievements = await progressService.getAchievements(event.userId);
                        const achievement = achievements.find(a => a.id === event.achievementId);

                        if (achievement) {
                            details.push({
                                ...achievement,
                                unlockEvent: event
                            });
                        } else {
                            // Fallback: create basic achievement from event data
                            details.push({
                                id: event.achievementId,
                                name: event.achievementName,
                                description: `Achievement unlocked on ${new Date(event.unlockedAt).toLocaleDateString()}`,
                                icon: '🏆',
                                category: 'general',
                                targetValue: event.newProgress,
                                progress: event.newProgress,
                                unlocked: true,
                                unlockedAt: event.unlockedAt,
                                sortOrder: 0,
                                unlockEvent: event
                            } as AchievementWithDetails);
                        }
                    } catch (error) {
                        console.error('Error loading achievement details for', event.achievementId, error);
                        // Fallback achievement
                        details.push({
                            id: event.achievementId,
                            name: event.achievementName,
                            description: 'Congratulations on your achievement!',
                            icon: '🏆',
                            category: 'general',
                            targetValue: event.newProgress,
                            progress: event.newProgress,
                            unlocked: true,
                            unlockedAt: event.unlockedAt,
                            sortOrder: 0,
                            unlockEvent: event
                        } as AchievementWithDetails);
                    }
                }

                setAchievementDetails(details);
            } catch (error) {
                console.error('Error loading achievement details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (events.length > 0) {
            loadAchievementDetails();
        }
    }, [events]);

    // Auto-advance to next achievement or close with countdown
    useEffect(() => {
        if (currentAchievement && !loading) {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Reset countdown
            setCountdown(2);

            // Countdown timer - updates every second
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        handleNext();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(countdownInterval);
        }
    }, [currentAchievement, loading, currentEventIndex]);

    const handleNext = () => {
        if (currentEventIndex < achievementDetails.length - 1) {
            // Animate out, then show next
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrentEventIndex(prev => prev + 1);
                fadeAnim.setValue(0);
                scaleAnim.setValue(0.8);
            });
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    // Don't render until we have achievement details loaded
    if (loading || !currentAchievement) {
        return null;
    }

    const unlockEvent = currentAchievement.unlockEvent;

    return (
        <Modal
            visible={true}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
            }}>
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                        backgroundColor: customColors.background,
                        borderRadius: 20,
                        padding: 24,
                        width: '100%',
                        maxWidth: 320,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                    }}
                >
                    {/* Celebration Header */}
                    <View style={{
                        alignItems: 'center',
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            fontSize: 48,
                            marginBottom: 8,
                        }}>
                            🎉
                        </Text>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: '700',
                            color: customColors.primary || '#0095f6',
                            textAlign: 'center',
                        }}>
                            {t('progress.achievements.achievementUnlocked')}!
                        </Text>
                    </View>

                    {/* Achievement Icon */}
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: customColors.success || '#4caf50',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                        shadowColor: customColors.success || '#4caf50',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}>
                        <Text style={{
                            fontSize: 40,
                        }}>
                            {currentAchievement.icon}
                        </Text>
                    </View>

                    {/* Achievement Details */}
                    <View style={{
                        alignItems: 'center',
                        marginBottom: 24,
                    }}>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: '600',
                            color: customColors.text || '#262626',
                            textAlign: 'center',
                            marginBottom: 8,
                        }}>
                            {currentAchievement.name}
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: customColors.subtleGray || '#8e8e8e',
                            textAlign: 'center',
                            lineHeight: 22,
                        }}>
                            {currentAchievement.description}
                        </Text>
                    </View>

                    {/* Progress Info */}
                    <View style={{
                        backgroundColor: customColors.lightGray || '#f5f5f5',
                        borderRadius: 12,
                        padding: 12,
                        width: '100%',
                        marginBottom: 8,
                    }}>
                        <Text style={{
                            fontSize: 14,
                            color: customColors.text || '#262626',
                            textAlign: 'center',
                            fontWeight: '500',
                        }}>
                            {t('progress.achievements.progressLabel')}: {unlockEvent.newProgress}/{currentAchievement.targetValue} ✓
                        </Text>
                    </View>

                    {/* Unlock Date */}
                    <View style={{
                        marginBottom: 24,
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray || '#8e8e8e',
                            textAlign: 'center',
                        }}>
                            {t('progress.achievements.unlockedOn')} {new Date(unlockEvent.unlockedAt).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* Multiple Events Indicator */}
                    {hasMultipleEvents && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}>
                            {achievementDetails.map((_, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: index === currentEventIndex
                                            ? (customColors.primary || '#0095f6')
                                            : (customColors.lightGray || '#f5f5f5'),
                                        marginHorizontal: 4,
                                    }}
                                />
                            ))}
                            <Text style={{
                                fontSize: 12,
                                color: customColors.subtleGray || '#8e8e8e',
                                marginLeft: 8,
                                alignSelf: 'center',
                            }}>
                                {currentEventIndex + 1} of {achievementDetails.length}
                            </Text>
                        </View>
                    )}

                    {/* Countdown Timer */}
                    <View style={{
                        alignItems: 'center',
                        marginBottom: 8,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: customColors.lightGray || '#f5f5f5',
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                        }}>
                            {/* Countdown Circle */}
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: countdown > 0 ? (customColors.primary || '#0095f6') : (customColors.subtleGray || '#8e8e8e'),
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                            }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#ffffff',
                                }}>
                                    {countdown}
                                </Text>
                            </View>

                            <Text style={{
                                fontSize: 12,
                                color: customColors.subtleGray || '#8e8e8e',
                                textAlign: 'center',
                            }}>
                                {hasMultipleEvents && currentEventIndex < achievementDetails.length - 1
                                    ? t('progress.achievements.nextAchievementIn', { seconds: countdown })
                                    : t('progress.achievements.closingIn', { seconds: countdown })
                                }
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
