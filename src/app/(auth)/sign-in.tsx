import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { colors } from "@/theme/colors";

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
    } catch {
      setError("Unable to sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}><View style={styles.logoRow}><View style={styles.mark}><Ionicons name="car-sport" size={29} color="#FFFFFF" /></View><Text style={styles.wordmark}><Text style={styles.wordmarkGreen}>RentMe</Text>Suite</Text></View><Text style={styles.eyebrow}>MOBILE ADMIN</Text><Text style={styles.title}>Your rental operation, wherever you are.</Text><Text style={styles.subtitle}>Bookings, customers and daily operations in one place.</Text></View>
        <View style={styles.form}>
          <View style={styles.inputWrap}><Ionicons name="mail-outline" size={19} color={colors.subtle} /><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Email address" placeholderTextColor={colors.subtle} style={styles.input} value={email} onChangeText={setEmail} /></View>
          <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={19} color={colors.subtle} /><TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="current-password" placeholder="Password" placeholderTextColor={colors.subtle} secureTextEntry style={styles.input} value={password} onChangeText={setPassword} /></View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Sign in" loading={loading} disabled={!email || !password} onPress={submit} />
          <Text style={styles.help}>Use your RentMe CRM staff account</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 38 },
  brand: { gap: 10 }, logoRow: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 8 }, mark: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand }, wordmark: { color: colors.ink, fontSize: 27, fontWeight: "900", letterSpacing: -1.1 }, wordmarkGreen: { color: colors.brand },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 }, form: { gap: 12 },
  inputWrap: { minHeight: 54, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 15, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10 }, input: { flex: 1, color: colors.ink, fontSize: 16 },
  error: { color: colors.danger, lineHeight: 20 }, help: { textAlign: "center", color: colors.subtle, fontSize: 12, marginTop: 3 },
});
