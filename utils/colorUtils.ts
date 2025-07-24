import {MD3DarkTheme, MD3LightTheme} from 'react-native-paper';
import {StyleSheet} from "react-native";
import {ColorSchemeName} from "react-native/Libraries/Utilities/Appearance";

export function getCustomColors(scheme: ColorSchemeName) {
    const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
    const background = scheme === 'dark' ? '#292929' : '#f1f1f1';
    const foreground = scheme === 'dark' ? '#121212' : '#ffffff';
    const titleBackground = scheme === 'dark' ? '#292929' : '#e0e0e0';
    const footerBackground = scheme === 'dark' ? '#292929' : '#e0e0e0';
    const footerForeground = scheme === 'dark' ? '#a1a1a1' : '#818080';
    const color = scheme === 'dark' ? '#fefefe' : '#000000';

    return {
        ...baseTheme.colors,
        primary: '#79aafb',
        secondary: '#03dac6',
        color: color,
        background,
        surface: baseTheme.colors.surface,
        foreground, // custom key
        titleBackground, // custom key
        footerBackground,
        footerForeground
    };
}

export function getStyles(customColors: any) {
    return StyleSheet.create({
        appbar: {
            backgroundColor: customColors.titleBackground,
            borderBottomColor: customColors.footerForeground,
            borderStyle: 'solid',
            borderBottomWidth: 1,

        },
        icon: {
            color: customColors.color,
            marginRight: 8
        },
        card: {
            marginBottom: 16,
            borderRadius: 12,
            elevation: 2,
            color: customColors.color,
            backgroundColor: customColors.foreground,
        },
        cardTitle: {
            fontSize: 16,
            alignSelf: 'center',
            fontWeight: 'bold',
            marginBottom: 8,
        },
        listItem: {
            borderRadius: 6,
            color: customColors.color,
        },
        itemTitle: {
            fontSize: 16,
            color: customColors.color,
        },
        modalContainer: {
            alignSelf: 'center',
            width: '80%',
        },
        modalCard: {
            padding: 16,
        },
        dailyBanner: {
            backgroundColor: customColors.foreground,
            padding: 16,
            marginTop: 0,
            color: customColors.color,
            marginBottom: 12,
            elevation: 1,
        },
        dailyTitle: {
            color: customColors.color,
            fontSize: 16,
            alignSelf: 'center',
            fontWeight: 'bold',
            marginBottom: 8,
        },
        dailyLink: {
            alignSelf: 'center',
            paddingVertical: 4,
            color: customColors.primary,
        },
        dailyLinkText: {
            fontWeight: 'bold',
            fontSize: 16,
        },
        progressBar: {
            height: 10,
            borderRadius: 5,
        },
    });
}
