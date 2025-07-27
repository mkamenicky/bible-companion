import {Tabs} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {useTheme} from "react-native-paper";
import {useColorScheme} from "react-native";
import {ThemeService} from "@/services/theme/ThemeService";

export default function TabLayout() {
    const theme = useTheme();
    const colorScheme = useColorScheme();
    const custom = ThemeService.getCustomColors(colorScheme);
    let screenOptions = {
        tabBarStyle: {
            backgroundColor: custom.footerBackground,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: custom.footerForeground,
        headerShown: false,
    };
    return (<Tabs screenOptions={screenOptions}>
        <Tabs.Screen
            name="HomeScreen"
            options={{
                title: 'Home',
                tabBarIcon: ({color, size}) => (<FontAwesome name="home" color={color} size={size}/>),
            }}
        />
        <Tabs.Screen
            name="ProgressScreen"
            options={{
                title: 'Progress',
                tabBarIcon: ({color, size}) => (<FontAwesome name="pie-chart" color={color} size={size - 2}/>),
            }}
        />
        <Tabs.Screen
            name="FeedbackScreen"
            options={{
                title: 'Feedback',
                tabBarIcon: ({color, size}) => (<MaterialIcons name="edit-note" color={color} size={size}/>),
            }}
        />
        <Tabs.Screen
            name="SettingsScreen"
            options={{
                title: 'Settings',
                tabBarIcon: ({color, size}) => (<FontAwesome name="cog" color={color} size={size}/>),
            }}
        />
    </Tabs>);
}
