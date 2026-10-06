import { Redirect } from "expo-router";

import { LoadingView } from "@/components/ui/StateView";
import { useAuth } from "@/features/auth/AuthProvider";

export default function IndexScreen() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <LoadingView label="Restoring your session…" />;
  return <Redirect href={session ? "/(app)/(tabs)/today" : "/(auth)/sign-in"} />;
}
