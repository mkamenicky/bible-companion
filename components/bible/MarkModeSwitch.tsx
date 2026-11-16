import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from '@/hooks';
import type {MarkMode} from '@/hooks';
import type {ThemeColors} from '@/services/(services)/theme/ThemeService';

interface Props {
    mode: MarkMode;
    onChange: (mode: MarkMode) => void;
    colors: ThemeColors;
}

const MODES: MarkMode[] = ['backfill', 'manual'];

/**
 * A setting, not a filter: chooses how verses marked from now on are
 * recorded - as read some time in the past (progress only) or as read today
 * (also counts for goal and streak). It does not change what is displayed.
 */
export default function MarkModeSwitch({mode, onChange, colors}: Props) {
    const t = useTranslation();

    return (
        <View>
            {/* The title matters: without it the two options read like tabs
                that should show a list of what was read. */}
            <Text style={[styles.title, {color: colors.text}]}>{t('bible.markMode.title')}</Text>
            <View style={[styles.track, {backgroundColor: colors.lightGray}]}>
                {MODES.map(option => {
                    const selected = option === mode;
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[styles.option, selected && {backgroundColor: colors.primary}]}
                            onPress={() => onChange(option)}
                            accessibilityRole="radio"
                            accessibilityState={{selected}}
                        >
                            <Text style={[styles.optionText, {color: selected ? '#ffffff' : colors.text}]}>
                                {t(`bible.markMode.${option}`)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={[styles.hint, {color: colors.subtleGray}]}>
                {t(`bible.markMode.${mode}Hint`)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    track: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 3,
    },
    option: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
    },
});
