import {Tabs} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {useTheme} from "react-native-paper";
import {useColorScheme} from "react-native";
import {ThemeService} from "@/services";
import {useEffect, useState} from "react";
import {useTranslation} from "@/hooks";
import {StatusBar} from 'expo-status-bar';

export default function TabLayout() {
    const theme = useTheme();
    const colorScheme = useColorScheme();
    const [themeVariant, setThemeVariant] = useState(ThemeService.getCurrentVariant());
    const t = useTranslation();

    // Listen for theme variant changes
    useEffect(() => {
        return ThemeService.addThemeChangeListener((newVariant) => {
            setThemeVariant(newVariant);
        });
    }, []);

    // Get colors based on current theme variant
    const custom = ThemeService.getCustomColors(colorScheme, themeVariant);

    const screenOptions = {
        tabBarStyle: {
            backgroundColor: custom.footerBackground,
        },
        tabBarActiveTintColor: custom.primary,
        tabBarInactiveTintColor: custom.footerForeground,
        headerShown: false,
    };

    return (
        <>
            <StatusBar
                style={colorScheme === 'dark' ? "light" : "dark"}
                backgroundColor={custom.titleBackground}
                translucent={false}
            />
            <Tabs screenOptions={screenOptions}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t('navigation.home'),
                        tabBarIcon: ({color, size}) => (<FontAwesome name="home" color={color} size={size}/>),
                    }}
                />
                <Tabs.Screen
                    name="ProgressScreen"
                    options={{
                        title: t('navigation.progress'),
                        tabBarIcon: ({color, size}) => (<FontAwesome name="pie-chart" color={color} size={size - 2}/>),
                    }}
                />
                <Tabs.Screen
                    name="FeedbackScreen"
                    redirect={true}
                    options={{
                        title: t('navigation.feedback'),
                        tabBarIcon: ({color, size}) => (<MaterialIcons name="edit-note" color={color} size={size}/>),
                    }}
                />
                <Tabs.Screen
                    name="CalendarScreen"
                    options={{
                        title: t('navigation.calendar'),
                        tabBarIcon: ({color, size}) => (<MaterialIcons name="calendar-month" color={color} size={size}/>),
                    }}
                />
                <Tabs.Screen
                    name="SettingsScreen"
                    options={{
                        title: t('navigation.settings'),
                        tabBarIcon: ({color, size}) => (<FontAwesome name="cog" color={color} size={size}/>),
                    }}
                />
            </Tabs>
        </>
    );
}
