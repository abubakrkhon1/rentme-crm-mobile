import { Redirect, Stack } from "expo-router";

import { LoadingView } from "@/components/ui/StateView";
import { useAuth } from "@/features/auth/AuthProvider";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <LoadingView />;
  if (session) return <Redirect href="/(app)/(tabs)/today" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
