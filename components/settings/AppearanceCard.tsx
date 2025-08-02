// AppearanceCard.tsx
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {ExtendedAppSettings, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';

interface AppearanceCardProps {
    settings: any;
    onFontSizeChange: (size: ExtendedAppSettings["fontSize"]) => void;
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

    // Get current theme information
    const getCurrentThemeInfo = () => {
        const currentVariant = ThemeService.getCurrentVariant();
        const availableThemes = ThemeService.getAvailableThemes();
        const currentTheme = availableThemes.find(theme => theme.key === currentVariant);
        return currentTheme ? currentTheme.name : 'Classic';
    };

    const currentThemeName = getCurrentThemeInfo();

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
                        {t('settings.themeSubtitleCurrent', { theme: currentThemeName })}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, {color: customColors.instagramBlue}]}>
                        {t('settings.change')}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}
