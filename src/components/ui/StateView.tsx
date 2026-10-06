import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";

export function LoadingView({ label = "Loading…" }: { label?: string }) {
  return <SafeAreaView style={styles.fullScreen}><View style={styles.center}><ActivityIndicator size="small" color={colors.brand} /><Text style={styles.message}>{label}</Text></View></SafeAreaView>;
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <SafeAreaView style={styles.fullScreen}><View style={styles.center}><View style={styles.errorIcon}><Ionicons name="alert-circle-outline" size={25} color={colors.danger} /></View><Text style={styles.title}>Something went wrong</Text><Text style={styles.message}>{message}</Text>{onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}</View></SafeAreaView>;
}

export function ScreenSkeleton({ variant = "list" }: { variant?: "dashboard" | "list" }) {
  return <SafeAreaView style={styles.skeletonScreen}><View style={styles.skeletonHeader}><View style={styles.headerLines}><Skeleton width={96} height={10} /><Skeleton width={132} height={31} /></View><Skeleton width={42} height={42} radius={21} /></View><View style={styles.skeletonContent}>{variant === "dashboard" ? <><Skeleton height={206} radius={24} /><View style={styles.actionSkeletons}>{[0, 1, 2, 3].map((item) => <View key={item} style={styles.actionSkeleton}><Skeleton width={48} height={48} radius={16} /><Skeleton width={58} height={9} /></View>)}</View></> : <><Skeleton height={112} radius={22} /><Skeleton height={48} radius={15} /></>}<Skeleton width={126} height={20} />{[0, 1, 2, 3].map((item) => <Skeleton key={item} height={variant === "dashboard" ? 76 : 88} radius={18} />)}</View></SafeAreaView>;
}

function Skeleton({ width = "100%", height, radius = 10 }: { width?: number | `${number}%`; height: number; radius?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.45));
  useEffect(() => { const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.85, duration: 650, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true })])); animation.start(); return () => animation.stop(); }, [opacity]);
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: "#E4EAE7", opacity }} />;
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, minHeight: 360, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", gap: 12 }, errorIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.dangerSoft, alignItems: "center", justifyContent: "center" }, title: { color: colors.ink, fontWeight: "900", fontSize: 18 }, message: { color: colors.muted, textAlign: "center", lineHeight: 21, maxWidth: 300 }, skeletonScreen: { flex: 1, backgroundColor: colors.background }, skeletonHeader: { height: 78, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerLines: { gap: 7 }, skeletonContent: { paddingHorizontal: 18, paddingTop: 10, gap: 16 }, actionSkeletons: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }, actionSkeleton: { width: "23%", alignItems: "center", gap: 8 },
});
