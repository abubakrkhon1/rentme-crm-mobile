import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { colors } from "@/theme/colors";

const icons = { today: "home-outline", bookings: "calendar-outline", customers: "people-outline", inbox: "chatbubble-ellipses-outline", more: "menu-outline" } as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.muted, tabBarHideOnKeyboard: true, tabBarStyle: { borderTopColor: colors.tabBorder, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: colors.tabBar, height: 88, paddingTop: 8 }, tabBarLabelStyle: { fontFamily: "AirbnbCereal-Bold", fontSize: 11, marginTop: 2 }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? icons[route.name as keyof typeof icons]?.replace("-outline", "") as keyof typeof Ionicons.glyphMap : icons[route.name as keyof typeof icons] ?? "ellipse-outline"} color={color} size={focused ? size + 1 : size} /> })}>
      <Tabs.Screen name="today" options={{ title: "Today" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="inbox" options={{ title: "Messages" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
