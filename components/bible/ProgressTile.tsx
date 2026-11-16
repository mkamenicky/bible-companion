import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {ThemeColors} from '@/services/(services)/theme/ThemeService';

interface Props {
    /** Main text: a book name, chapter number or verse number. */
    label: string;
    /** Optional small second line, e.g. "12/50". */
    caption?: string;
    read: number;
    total: number;
    onPress?: () => void;
    onLongPress?: () => void;
    /** Square tiles are used for chapter and verse numbers. */
    square?: boolean;
    accessibilityLabel?: string;
    colors: ThemeColors;
}

/**
 * A tile of the book / chapter / verse grids. Its colour shows the progress:
 * neutral = nothing read, tinted with a bar = partly read, green = complete.
 */
function ProgressTile({label, caption, read, total, onPress, onLongPress, square, accessibilityLabel, colors}: Props) {
    const isComplete = total > 0 && read >= total;
    const isStarted = read > 0 && !isComplete;
    const fraction = total > 0 ? Math.min(read / total, 1) : 0;

    const backgroundColor = isComplete
        ? colors.completedGreen
        : isStarted ? `${colors.primary}22` : colors.lightGray;
    const textColor = isComplete ? '#ffffff' : colors.text;

    return (
        <TouchableOpacity
            style={[
                styles.tile,
                square && styles.square,
                {backgroundColor, borderColor: isStarted ? colors.primary : 'transparent'},
            ]}
            activeOpacity={0.7}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={350}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{checked: isComplete ? true : isStarted ? 'mixed' : false}}
        >
            <Text
                style={[styles.label, square && styles.squareLabel, {color: textColor}]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >
                {label}
            </Text>

            {caption !== undefined && (
                <Text style={[styles.caption, {color: isComplete ? '#ffffff' : colors.subtleGray}]} numberOfLines={1}>
                    {isComplete ? `✓ ${caption}` : caption}
                </Text>
            )}

            {isStarted && (
                <View style={[styles.barTrack, {backgroundColor: `${colors.primary}33`}]}>
                    <View style={[styles.barFill, {backgroundColor: colors.primary, width: `${fraction * 100}%`}]}/>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default React.memo(ProgressTile);

const styles = StyleSheet.create({
    tile: {
        flex: 1,
        minHeight: 56,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    square: {
        aspectRatio: 1,
        minHeight: 0,
        paddingHorizontal: 2,
        paddingVertical: 2,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    squareLabel: {
        fontSize: 16,
        textAlign: 'center',
    },
    caption: {
        fontSize: 11,
        marginTop: 2,
    },
    barTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
    },
    barFill: {
        height: 3,
    },
});
