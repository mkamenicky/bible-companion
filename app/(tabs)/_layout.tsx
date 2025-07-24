import { Tabs } from 'expo-router';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {useTheme} from "react-native-paper";

export default function TabLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#e0e0e0', // match Appbar
                    borderTopColor: '#ccc',
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: '#666',
                headerShown: false, // since you're using Appbar separately
            }}
        >
            <Tabs.Screen
                name="HomeScreen"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ProgressScreen"
                options={{
                    title: 'Progress',
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome name="pie-chart" color={color} size={size-2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="FeedbackScreen"
                options={{
                    title: 'Feedback',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="edit-note" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="SettingsScreen"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome name="cog" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
