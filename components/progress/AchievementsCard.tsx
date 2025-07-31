import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {progressService} from '@/services';
import type {Achievement, AchievementUnlockEvent} from '@/models';

interface Props {
    currentStreak: number;
    totalVersesRead: number;
    chaptersCompleted: number;
    styles: any;
    customColors: any;
    userId?: number;
    onAchievementUnlocked?: (events: AchievementUnlockEvent[]) => void;
}

interface CategoryData {
    id: string;
    name: string;
    icon: string;
    color: string;
    achievements: Achievement[];
}

export default function AchievementsCard({
                                             currentStreak,
                                             totalVersesRead,
                                             chaptersCompleted,
                                             styles,
                                             customColors,
                                             userId = 1,
                                             onAchievementUnlocked
                                         }: Props) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [achievementStats, setAchievementStats] = useState<{
        total: number;
        unlocked: number;
        available: number;
        locked: number;
        completionPercentage: number;
    } | null>(null);
    const [categorizedAchievements, setCategorizedAchievements] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAllModal, setShowAllModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const loadAchievements = useCallback(async () => {
        try {
            // Update progress and get any newly unlocked achievements
            const unlockedEvents = await progressService.updateAchievementProgressFromDatabase(userId);

            if (unlockedEvents.length > 0 && onAchievementUnlocked) {
                onAchievementUnlocked(unlockedEvents);
            }

            // Fetch updated achievements and stats in parallel
            const [achievementData, statsData] = await Promise.all([
                progressService.getAchievements(userId),
                progressService.getAchievementStats(userId)
            ]);

            setAchievements(achievementData);
            setAchievementStats(statsData);

            // Organize achievements by category
            const categories = organizeByCategoryWithProgress(achievementData);
            setCategorizedAchievements(categories);

        } catch (error) {
            console.error('Error loading achievements:', error);
            setAchievements([]);
            setAchievementStats(null);
            setCategorizedAchievements([]);
        }
    }, [userId, onAchievementUnlocked]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAchievements();
        setRefreshing(false);
    }, [loadAchievements]);

    useEffect(() => {
        const initializeAchievements = async () => {
            setLoading(true);
            await loadAchievements();
            setLoading(false);
        };

        initializeAchievements();
    }, [loadAchievements]);

    const organizeByCategoryWithProgress = (achievementList: Achievement[]): CategoryData[] => {
        const categoryMap = new Map<string, CategoryData>();

        // Define category metadata with enhanced styling
        const categoryMetadata = {
            milestone: {name: 'Milestones', icon: '🎯', color: '#FF6B6B'},
            streak: {name: 'Streak Master', icon: '🔥', color: '#4ECDC4'},
            reading: {name: 'Reading Goals', icon: '📚', color: '#45B7D1'},
            exploration: {name: 'Explorer', icon: '🗺️', color: '#96CEB4'},
            seasonal: {name: 'Seasonal', icon: '🎄', color: '#F39C12'},
            general: {name: 'General', icon: '🏆', color: '#FFEAA7'}
        };

        achievementList.forEach(achievement => {
            const category = achievement.category || 'general';
            const metadata = categoryMetadata[category as keyof typeof categoryMetadata] || categoryMetadata.general;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    id: category,
                    name: metadata.name,
                    icon: metadata.icon,
                    color: metadata.color,
                    achievements: []
                });
            }

            categoryMap.get(category)!.achievements.push(achievement);
        });

        // Sort achievements within each category by sort order
        categoryMap.forEach(category => {
            category.achievements.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        });

        return Array.from(categoryMap.values())
            .filter(category => category.achievements.length > 0) // Only show categories with achievements
            .sort((a, b) => {
                // Custom sort order for categories
                const order = ['milestone', 'streak', 'reading', 'exploration', 'seasonal', 'general'];
                return order.indexOf(a.id) - order.indexOf(b.id);
            });
    };

    const getFilteredAchievements = (): Achievement[] => {
        if (selectedCategory === 'all') {
            return achievements;
        }
        return achievements.filter(a => a.category === selectedCategory);
    };

    const renderAchievementItem = (achievement: Achievement, index: number, isInModal: boolean = false) => {
        const progressPercentage = Math.min((achievement.progress / achievement.targetValue) * 100, 100);
        const isCompleted = achievement.unlocked;

        return (
            <TouchableOpacity
                key={achievement.id}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: isInModal ? 0 : 20,
                    borderBottomWidth: index < (getFilteredAchievements().length - 1) ? 0.5 : 0,
                    borderBottomColor: customColors.borderColor,
                    backgroundColor: isCompleted ? `${customColors.primary}10` : 'transparent',
                    borderRadius: isCompleted ? 8 : 0,
                    marginVertical: isCompleted ? 2 : 0,
                }}
                onPress={() => {
                    if (isCompleted && achievement.unlockedAt) {
                        const unlockDate = new Date(achievement.unlockedAt).toLocaleDateString();
                        Alert.alert(
                            `🎉 ${achievement.name}`,
                            `${achievement.description}\n\nUnlocked on ${unlockDate}`,
                            [{text: 'OK'}]
                        );
                    }
                }}
            >
                <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isCompleted ? customColors.primary : customColors.lightGray,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                    borderWidth: 2,
                    borderColor: isCompleted ? customColors.primary : customColors.borderColor,
                    shadowColor: isCompleted ? customColors.primary : 'transparent',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: isCompleted ? 0.3 : 0,
                    shadowRadius: 4,
                    elevation: isCompleted ? 4 : 0,
                }}>
                    <Text style={{fontSize: 20}}>
                        {isCompleted ? achievement.icon : '🔒'}
                    </Text>
                </View>

                <View style={{flex: 1}}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 2,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: isCompleted ? customColors.primary : customColors.color,
                            flex: 1,
                        }}>
                            {achievement.name}
                        </Text>
                        {isCompleted && (
                            <View style={{
                                backgroundColor: customColors.primary,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 12,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    color: 'white',
                                    fontWeight: '600',
                                }}>
                                    UNLOCKED
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={{
                        fontSize: 13,
                        color: customColors.subtleGray,
                        marginBottom: 6,
                    }}>
                        {achievement.description}
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            flex: 1,
                            height: 6,
                            backgroundColor: customColors.lightGray,
                            borderRadius: 3,
                            marginRight: 8,
                            overflow: 'hidden',
                        }}>
                            <View style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                backgroundColor: isCompleted
                                    ? customColors.primary
                                    : customColors.completedGreen,
                                borderRadius: 3,
                            }}/>
                        </View>
                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                            minWidth: 50,
                            textAlign: 'right',
                            fontWeight: '500',
                        }}>
                            {achievement.progress}/{achievement.targetValue}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategoryFilter = () => {
        const categories = [
            {id: 'all', name: 'All', icon: '🏆'},
            ...categorizedAchievements.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon
            }))
        ];

        return (
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: customColors.borderColor,
            }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            onPress={() => setSelectedCategory(category.id)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                marginRight: 8,
                                borderRadius: 20,
                                backgroundColor: selectedCategory === category.id
                                    ? customColors.primary
                                    : customColors.lightGray,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{fontSize: 14, marginRight: 4}}>
                                {category.icon}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: selectedCategory === category.id
                                    ? 'white'
                                    : customColors.color,
                                fontWeight: '500',
                            }}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    <Text style={styles.sectionSubtitle}>Loading achievements...</Text>
                </View>
            </View>
        );
    }

    const displayAchievements = getFilteredAchievements().slice(0, 3);

    return (
        <>
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    <Text style={styles.sectionSubtitle}>
                        {achievementStats
                            ? `${achievementStats.unlocked}/${achievementStats.total} unlocked (${achievementStats.completionPercentage}%)`
                            : 'Milestones and badges earned'
                        }
                    </Text>
                </View>

                <View style={{paddingBottom: 20}}>
                    {displayAchievements.map((achievement, index) =>
                        renderAchievementItem(achievement, index, false)
                    )}

                    {achievements.length > 3 && (
                        <TouchableOpacity
                            style={{
                                paddingVertical: 12,
                                alignItems: 'center',
                                marginHorizontal: 20,
                                borderRadius: 8,
                                backgroundColor: `${customColors.primary}15`,
                            }}
                            onPress={() => setShowAllModal(true)}
                        >
                            <Text style={{
                                fontSize: 14,
                                color: customColors.primary,
                                fontWeight: '600',
                            }}>
                                View All Achievements ({achievements.length})
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* All Achievements Modal */}
            <Modal
                visible={showAllModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAllModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: customColors.background,
                }}>
                    {/* Modal Header */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: customColors.borderColor,
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: customColors.color,
                            }}>
                                All Achievements
                            </Text>
                            {achievementStats && (
                                <Text style={{
                                    fontSize: 14,
                                    color: customColors.subtleGray,
                                    marginTop: 2,
                                }}>
                                    {achievementStats.unlocked} of {achievementStats.total} unlocked
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowAllModal(false)}
                            style={{
                                padding: 8,
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                color: customColors.primary,
                                fontWeight: '500',
                            }}>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Filter */}
                    {renderCategoryFilter()}

                    {/* Achievement Stats Summary */}
                    {achievementStats && (
                        <View style={{
                            padding: 20,
                            backgroundColor: customColors.cardBackground,
                            marginHorizontal: 20,
                            marginTop: 20,
                            borderRadius: 12,
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: customColors.color,
                                marginBottom: 8,
                            }}>
                                Progress Overview
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}>
                                <View style={{alignItems: 'center'}}>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: '600',
                                        color: customColors.primary,
                                    }}>
                                        {achievementStats.unlocked}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: customColors.subtleGray,
                                    }}>
                                        Unlocked
                                    </Text>
                                </View>
                                <View style={{alignItems: 'center'}}>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: '600',
                                        color: customColors.color,
                                    }}>
                                        {achievementStats.available}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: customColors.subtleGray,
                                    }}>
                                        Available
                                    </Text>
                                </View>
                                <View style={{alignItems: 'center'}}>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: '600',
                                        color: customColors.completedGreen,
                                    }}>
                                        {achievementStats.completionPercentage}%
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: customColors.subtleGray,
                                    }}>
                                        Complete
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* All Achievements List */}
                    <ScrollView
                        style={{
                            flex: 1,
                            paddingHorizontal: 20,
                            paddingTop: 20,
                        }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={customColors.primary}
                            />
                        }
                    >
                        <View style={{
                            backgroundColor: customColors.cardBackground,
                            borderRadius: 12,
                            paddingVertical: 10,
                        }}>
                            {getFilteredAchievements().map((achievement, index) =>
                                renderAchievementItem(achievement, index, true)
                            )}

                            {getFilteredAchievements().length === 0 && (
                                <View style={{
                                    padding: 20,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        color: customColors.subtleGray,
                                        textAlign: 'center',
                                    }}>
                                        No achievements in this category yet
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={{height: 40}}/>
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}
