import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message.toLowerCase() : "";
      const connectionFailed = message.includes("fetch") || message.includes("network") || message.includes("connection");
      setError(connectionFailed
        ? "Cannot reach local Supabase. Check that it is running and that this device can access the configured URL."
        : "Unable to sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}>
          <View style={styles.logoRow}>
            <View style={styles.mark}><Text style={styles.markText}>R</Text></View>
            <Text style={styles.wordmark}>Rent Me <Text style={styles.wordmarkLight}>CRM</Text></Text>
          </View>
          <Text style={styles.title}>Sign in to your workspace</Text>
          <Text style={styles.subtitle}>Manage bookings, vehicles and customers from your phone.</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.fields}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="name@company.com" placeholderTextColor={colors.subtle} style={styles.input} value={email} onChangeText={setEmail} />
            </View>
            <View style={styles.separator} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="current-password" placeholder="Required" placeholderTextColor={colors.subtle} secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Sign in" loading={loading} disabled={!email || !password} onPress={submit} />
          <Text style={styles.help}>Use your Rent Me CRM staff account</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingTop: 56, paddingBottom: 12 },
  brand: { gap: 14 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  mark: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand },
  markText: { color: "#FFFFFF", fontSize: 20, fontFamily: fonts.extraBold },
  wordmark: { color: colors.ink, fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.3 },
  wordmarkLight: { color: colors.muted, fontFamily: fonts.medium },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontFamily: fonts.extraBold, letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  form: { gap: 14 },
  fields: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" },
  fieldRow: { minHeight: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
  fieldLabel: { width: 84, color: colors.muted, fontSize: 15, fontFamily: fonts.medium },
  input: { flex: 1, color: colors.ink, fontSize: 17, minHeight: 56 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 16 },
  error: { color: colors.danger, lineHeight: 20, fontSize: 14 },
  help: { textAlign: "center", color: colors.muted, fontSize: 14 },
});
