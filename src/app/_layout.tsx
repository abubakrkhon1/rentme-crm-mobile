import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { queryClient } from "@/lib/query/client";
import { fonts } from "@/theme/fonts";

type DefaultPropsComponent = { defaultProps?: { style?: unknown } };

function installDefaultFonts() {
  const text = Text as typeof Text & DefaultPropsComponent;
  const input = TextInput as typeof TextInput & DefaultPropsComponent;
  text.defaultProps = { ...text.defaultProps, style: [{ fontFamily: fonts.book }, text.defaultProps?.style] };
  input.defaultProps = { ...input.defaultProps, style: [{ fontFamily: fonts.book }, input.defaultProps?.style] };
}

installDefaultFonts();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.light]: require("../../assets/fonts/AirbnbCereal_W_Lt.otf"),
    [fonts.book]: require("../../assets/fonts/AirbnbCereal-Book.otf"),
    [fonts.medium]: require("../../assets/fonts/AirbnbCereal-Medium.otf"),
    [fonts.bold]: require("../../assets/fonts/AirbnbCereal-Bold.otf"),
    [fonts.extraBold]: require("../../assets/fonts/AirbnbCereal_W_XBd.otf"),
    [fonts.black]: require("../../assets/fonts/AirbnbCereal-Black.otf"),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
