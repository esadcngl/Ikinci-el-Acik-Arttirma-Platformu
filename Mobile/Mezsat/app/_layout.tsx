import { Stack } from "expo-router";
import { NotificationProvider } from './context/NotificationContext';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack />
    </NotificationProvider>
  );
}
