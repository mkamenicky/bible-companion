// AppearanceCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
    const fontSizeOptions = [
        { value: 'small', label: 'Small', display: 'S' },
        { value: 'medium', label: 'Medium', display: 'M' },
        { value: 'large', label: 'Large', display: 'L' },
    ];

    const currentFontSize = fontSizeOptions.find(option => option.value === settings.fontSize);

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Appearance</Text>
                <Text style={styles.sectionSubtitle}>Customize your app's look and feel</Text>
            </View>

            {/* Theme selection */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={onThemeChange}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#f3e5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🎨</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>Theme</Text>
                    <Text style={styles.itemSubtitle}>
                        Current: System Default
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                        Change
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
            {/*        <Text style={styles.itemTitle}>Font Size</Text>*/}
            {/*        <Text style={styles.itemSubtitle}>*/}
            {/*            Current: {currentFontSize ? currentFontSize.label : 'Medium'}*/}
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
