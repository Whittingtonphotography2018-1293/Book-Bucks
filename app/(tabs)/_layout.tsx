import { Tabs } from 'expo-router';
import { Home, Users, Book, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 2,
          borderTopColor: '#E8F5E9',
          paddingBottom: 12,
          paddingTop: 12,
          height: 75,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <Home size={26} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ size, color }) => <Users size={26} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="kids"
        options={{
          title: 'Kids View',
          tabBarIcon: ({ size, color }) => <Book size={26} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={26} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
