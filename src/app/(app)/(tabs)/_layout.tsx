import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/theme/colors";

const icons = { today: "home-outline", bookings: "calendar-outline", customers: "people-outline", inbox: "chatbubble-ellipses-outline", more: "menu-outline" } as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.subtle, tabBarHideOnKeyboard: true, tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface, height: 84, paddingTop: 9 }, tabBarLabelStyle: { fontWeight: "700", fontSize: 10, marginTop: 2 }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? icons[route.name as keyof typeof icons]?.replace("-outline", "") as keyof typeof Ionicons.glyphMap : icons[route.name as keyof typeof icons] ?? "ellipse-outline"} color={color} size={focused ? size + 1 : size} /> })}>
      <Tabs.Screen name="today" options={{ title: "Today" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="inbox" options={{ title: "Messaging" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
