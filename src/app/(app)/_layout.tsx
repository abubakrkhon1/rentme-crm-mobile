import { Redirect, Stack } from "expo-router";

import { ErrorView, LoadingView } from "@/components/ui/StateView";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMobileSession } from "@/features/workspace/useMobileSession";

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const mobileSession = useMobileSession(Boolean(session));

  if (isLoading) return <LoadingView label="Restoring your session…" />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (mobileSession.isLoading) return <LoadingView label="Opening your workspace…" />;
  if (mobileSession.isError) return <ErrorView message={mobileSession.error.message} onRetry={() => void mobileSession.refetch()} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
