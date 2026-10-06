import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { colors } from "@/theme/colors";

export function Screen({
  children,
  header,
  scroll = true,
  refreshing = false,
  onRefresh,
}: PropsWithChildren<{ header?: ReactNode; scroll?: boolean; refreshing?: boolean; onRefresh?: () => void | Promise<unknown> }>) {
  const queryClient = useQueryClient();
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const content = <View style={styles.content}>{children}</View>;
  async function refresh() {
    setInternalRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      else await queryClient.refetchQueries({ type: "active" });
    } finally {
      setInternalRefreshing(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {header}
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} alwaysBounceVertical refreshControl={<RefreshControl refreshing={refreshing || internalRefreshing} onRefresh={() => void refresh()} tintColor={colors.brand} colors={[colors.brand]} />}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30, gap: 18 },
});
