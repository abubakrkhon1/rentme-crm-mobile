import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Group, GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMobileSession } from "@/features/workspace/useMobileSession";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type IconName = keyof typeof Ionicons.glyphMap;

export default function MoreScreen() {
  const { signOut } = useAuth();
  const session = useMobileSession();
  const identity = session.data?.user.fullName ?? session.data?.user.email ?? "Staff member";
  return (
    <Screen>
      <LargeTitle title="More" />

      <View style={styles.profile}>
        <Avatar name={identity} size={56} />
        <View style={styles.profileText}>
          <Text style={styles.name} numberOfLines={1}>{identity}</Text>
          <Text style={styles.copy} numberOfLines={1}>{session.data?.activeWorkspace.role} · {session.data?.activeWorkspace.name}</Text>
        </View>
      </View>

      <View>
        <GroupLabel>Operations</GroupLabel>
        <Group inset={60}>
          <MenuRow icon="car-sport-outline" label="Fleet" onPress={() => router.push("/fleet")} />
          <MenuRow icon="card-outline" label="Transactions" onPress={() => router.push("/transactions")} />
        </Group>
      </View>

      <View>
        <GroupLabel>Workspace</GroupLabel>
        <Group inset={60}>
          <MenuRow icon="business-outline" label="Organization" onPress={() => router.push("/settings/organization")} />
          <MenuRow icon="notifications-outline" label="Notifications" />
          <MenuRow icon="people-outline" label="Team management" />
        </Group>
      </View>

      <View>
        <GroupLabel>Support</GroupLabel>
        <Group inset={60}>
          <MenuRow icon="help-circle-outline" label="Help and support" />
        </Group>
      </View>

      <Group>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </Group>
    </Screen>
  );
}

function MenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.brand} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  profileText: { flex: 1, gap: 2 },
  name: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold },
  copy: { color: colors.muted, fontSize: 14, textTransform: "capitalize" },
  row: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, backgroundColor: colors.surface },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, color: colors.ink, fontSize: 16, fontFamily: fonts.medium },
  signOut: { minHeight: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  signOutText: { color: colors.danger, fontSize: 16, fontFamily: fonts.medium },
  pressed: { opacity: 0.6 },
});
