import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="VitrinScreen"
        options={{
          tabBarLabel: 'Vitrin',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
        }}
      />
      {/* Diğer tablar buraya eklenebilir */}
    </Tabs>
  );
}
