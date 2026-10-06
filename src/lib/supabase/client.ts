import "react-native-url-polyfill/auto";

import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";

const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const env = getPublicEnv();

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

if (Platform.OS !== "web") {
  if (AppState.currentState === "active") {
    supabase.auth.startAutoRefresh();
  }

  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
