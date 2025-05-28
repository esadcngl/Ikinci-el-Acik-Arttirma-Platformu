import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useNotification } from '../context/NotificationContext';
export default function TabLayout() {
  const { unreadCount } = useNotification();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="VitrinScreen"
        options={{
          title: 'Vitrin',
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="store" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="CategoriesScreen"
        options={{
          title: 'Kategoriler',
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="th-list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="IlanlarimScreen"
        options={{
          title: 'İlanlarım',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="BildirimlerScreen"
        options={{
          title: 'Bildirimler',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications-outline" color={color} size={size} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    backgroundColor: 'red',
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    minWidth: 18,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ProfilScreen"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
