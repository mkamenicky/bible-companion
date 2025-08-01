// AppearanceCard.tsx
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from '@/hooks';

interface AppearanceCardProps {
    settings: any;
    onFontSizeChange: (size: string) => void;
    onThemeChange: () => void;
    styles: any;
    customColors: any;
}

export default function AppearanceCard({
                                           settings,
                                           onFontSizeChange,
                                           onThemeChange,
                                           styles,
                                           customColors,
                                       }: AppearanceCardProps) {
    const t = useTranslation();

    const fontSizeOptions = [
        {value: 'small', label: t('settings.fontSize.small'), display: 'S'},
        {value: 'medium', label: t('settings.fontSize.medium'), display: 'M'},
        {value: 'large', label: t('settings.fontSize.large'), display: 'L'},
    ];

    const currentFontSize = fontSizeOptions.find(option => option.value === settings.fontSize);

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
                <Text style={styles.sectionSubtitle}>{t('settings.appearanceSubtitle')}</Text>
            </View>

            {/* Theme selection */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={onThemeChange}
            >
                <View style={[
                    styles.itemIcon,
                    {backgroundColor: '#f3e5f5'}
                ]}>
                    <Text style={{fontSize: 18}}>🎨</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.theme')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.themeSubtitle')}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, {color: customColors.instagramBlue}]}>
                        {t('settings.change')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/*/!* Font size selection *!/*/}
            {/*<TouchableOpacity*/}
            {/*    style={[styles.listItem, styles.listItemLast]}*/}
            {/*    onPress={() => {*/}
            {/*        // Cycle through font sizes*/}
            {/*        const currentIndex = fontSizeOptions.findIndex(option => option.value === settings.fontSize);*/}
            {/*        const nextIndex = (currentIndex + 1) % fontSizeOptions.length;*/}
            {/*        const nextSize = fontSizeOptions[nextIndex];*/}
            {/*        onFontSizeChange(nextSize.value);*/}
            {/*    }}*/}
            {/*>*/}
            {/*    <View style={[*/}
            {/*        styles.itemIcon,*/}
            {/*        { backgroundColor: '#e3f2fd' }*/}
            {/*    ]}>*/}
            {/*        <Text style={{ fontSize: 18 }}>🔤</Text>*/}
            {/*    </View>*/}

            {/*    <View style={styles.itemContent}>*/}
            {/*        <Text style={styles.itemTitle}>{t('settings.fontSize')}</Text>*/}
            {/*        <Text style={styles.itemSubtitle}>*/}
            {/*            {t('settings.fontSizeCurrent', { size: currentFontSize ? currentFontSize.label : t('settings.fontSize.medium') })}*/}
            {/*        </Text>*/}
            {/*    </View>*/}

            {/*    <View style={styles.itemAction}>*/}
            {/*        <View style={[*/}
            {/*            styles.fontSizeButton,*/}
            {/*            { backgroundColor: customColors.instagramBlue }*/}
            {/*        ]}>*/}
            {/*            <Text style={[styles.fontSizeButtonText, { color: 'white' }]}>*/}
            {/*                {currentFontSize ? currentFontSize.display : 'M'}*/}
            {/*            </Text>*/}
            {/*        </View>*/}
            {/*    </View>*/}
            {/*</TouchableOpacity>*/}
        </View>
    );
}
