import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { GroupLabel } from "@/components/ui/Group";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { StickyBar } from "@/components/ui/StickyBar";
import { useOrganizationLogo, useOrganizationSettings, useUpdateOrganizationSettings } from "@/features/settings/useOrganizationSettings";
import type { OrganizationSettings, OrganizationSettingsInput } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const TIMEZONES = [
  ["America/New_York", "Eastern Time (ET)"], ["America/Chicago", "Central Time (CT)"], ["America/Denver", "Mountain Time (MT)"], ["America/Phoenix", "Arizona Time (MST)"], ["America/Los_Angeles", "Pacific Time (PT)"], ["America/Anchorage", "Alaska Time (AKT)"], ["Pacific/Honolulu", "Hawaii Time (HST)"], ["UTC", "Coordinated Universal Time (UTC)"],
] as const;

export default function OrganizationSettingsScreen() {
  const settings = useOrganizationSettings();
  const update = useUpdateOrganizationSettings();
  const logo = useOrganizationLogo();
  const [draft, setDraft] = useState<Partial<OrganizationSettingsInput>>({});
  const organization = settings.data?.organization;
  const form = useMemo(() => organization ? { ...toForm(organization), ...draft } : null, [draft, organization]);
  const changed = useMemo(() => Boolean(form && organization && JSON.stringify(form) !== JSON.stringify(toForm(organization))), [form, organization]);

  if (settings.isLoading) return <ScreenSkeleton variant="list" />;
  if (settings.isError) return <ErrorView message={settings.error.message} onRetry={() => void settings.refetch()} />;
  const response = settings.data;
  if (!organization || !form || !response) return <ErrorView message="Organization settings were empty." />;
  const canManage = response.canManage;

  function set<K extends keyof OrganizationSettingsInput>(key: K, value: OrganizationSettingsInput[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  async function save() {
    if (!form?.name.trim()) return Alert.alert("Workspace name required", "Enter a workspace name before saving.");
    try { const result = await update.mutateAsync(form); setDraft({}); Alert.alert("Saved", result.message); } catch (error) { Alert.alert("Could not save", error instanceof Error ? error.message : "The workspace could not be updated."); }
  }
  async function chooseLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Photo access required", "Allow photo access to choose a workspace logo.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.9, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return Alert.alert("Could not read image", "Choose another JPG, PNG, or WebP image.");
    try { await logo.upload.mutateAsync({ base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" }); } catch (error) { Alert.alert("Upload failed", error instanceof Error ? error.message : "The logo could not be uploaded."); }
  }
  function removeLogo() { Alert.alert("Remove workspace logo?", "Marketing emails will use the workspace name instead.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: async () => { try { await logo.remove.mutateAsync(); } catch (error) { Alert.alert("Remove failed", error instanceof Error ? error.message : "The logo could not be removed."); } } }]); }

  const footer = canManage ? <StickyBar><View style={s.saveBar}><Pressable disabled={!changed || update.isPending} onPress={() => setDraft({})} style={[s.resetButton, (!changed || update.isPending) && s.muted]}><Text style={s.resetText}>Reset</Text></Pressable><Pressable disabled={!changed || update.isPending} onPress={() => void save()} style={[s.saveButton, (!changed || update.isPending) && s.muted]}>{update.isPending ? <ActivityIndicator color="#fff" /> : null}<Text style={s.saveText}>{update.isPending ? "Saving…" : "Save changes"}</Text></Pressable></View></StickyBar> : null;

  return <Screen footer={footer}>
    <NavBar backLabel="More" title="Organization" />
    {!canManage ? <View style={s.notice}><Ionicons name="shield-outline" size={20} color={colors.warning} /><View style={s.flex}><Text style={s.noticeTitle}>View-only workspace access</Text><Text style={s.noticeText}>Only organization owners and admins can edit these settings.</Text></View></View> : null}
    <View style={s.hero}><Pressable disabled={!canManage} onPress={() => void chooseLogo()} style={s.heroLogo}>{organization.logoUrl ? <Image source={organization.logoUrl} style={s.logoImage} contentFit="contain" /> : <Text style={s.heroInitials}>{initials(organization.name)}</Text>}{canManage ? <View style={s.editLogo}><Ionicons name="camera" size={13} color="#fff" /></View> : null}</Pressable><Text style={s.heroName}>{organization.name}</Text><Text style={s.heroDomain}>{organization.hostname ?? organization.slug}</Text><View style={s.heroMeta}><Text style={s.heroPill}>{organization.role}</Text><Text style={s.heroPill}>{organization.status}</Text></View>{canManage && organization.logoUrl ? <Pressable onPress={removeLogo}><Text style={s.removeLogo}>Remove logo</Text></Pressable> : null}</View>

    <SettingsSection icon="business-outline" title="Business identity" subtitle="How your workspace appears to staff and customers"><Field label="Workspace name" value={form.name} onChangeText={(value) => set("name", value)} editable={canManage} placeholder="Rental Company Name" /><Field label="Legal entity name" value={form.legalName ?? ""} onChangeText={(value) => set("legalName", value || null)} editable={canManage} placeholder="Full legal or LLC name" /></SettingsSection>

    <SettingsSection icon="link-outline" title="Workspace address" subtitle="Managed identifiers for this organization"><ReadOnlyRow icon="globe-outline" label="Domain" value={organization.hostname ?? organization.slug} /><ReadOnlyRow icon="at-outline" label="Organization slug" value={organization.slug} last /></SettingsSection>

    <SettingsSection icon="earth-outline" title="Regional settings" subtitle="Used for bookings, schedules, and money"><View style={s.field}><Text style={s.label}>Primary timezone</Text><View style={[s.input, s.pickerWrap, !canManage && s.readOnly]}><Picker selectedValue={form.timezone} enabled={canManage} onValueChange={(value) => set("timezone", value)} style={s.picker}>{TIMEZONES.map(([value, label]) => <Picker.Item key={value} value={value} label={label} />)}</Picker></View></View><Field label="Currency code" value={form.currencyCode} onChangeText={(value) => set("currencyCode", value.toUpperCase().slice(0, 3))} editable={canManage} placeholder="USD" autoCapitalize="characters" /></SettingsSection>

    <SettingsSection icon="call-outline" title="Contact details" subtitle="Public contact information for your rental business"><Field label="Contact email" value={form.contactEmail ?? ""} onChangeText={(value) => set("contactEmail", value || null)} editable={canManage} placeholder="contact@example.com" keyboardType="email-address" autoCapitalize="none" /><Field label="Contact phone" value={form.contactPhone ?? ""} onChangeText={(value) => set("contactPhone", value || null)} editable={canManage} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" /><Field label="Official website" value={form.websiteUrl ?? ""} onChangeText={(value) => set("websiteUrl", value || null)} editable={canManage} placeholder="https://example.com" keyboardType="url" autoCapitalize="none" /><Field label="Online booking URL" value={form.bookingUrl ?? ""} onChangeText={(value) => set("bookingUrl", value || null)} editable={canManage} placeholder="https://example.com/book" keyboardType="url" autoCapitalize="none" help="Used as the destination for customer booking links." /></SettingsSection>

    <View style={s.workspacesHead}><GroupLabel>Your workspaces</GroupLabel><Pressable style={s.roundAdd} hitSlop={8} onPress={() => Alert.alert("Add workspace", "Workspace creation is currently available in the CRM web app.")}><Ionicons name="add" size={20} color={colors.brand} /></Pressable></View><View style={s.groupCard}>{response.organizations.map((workspace) => <WorkspaceRow key={workspace.id} workspace={workspace} current={workspace.id === organization.id} />)}</View>
    <Pressable style={s.teamCard} onPress={() => Alert.alert("Manage team", "Team management is currently available in the CRM web app.")}><View style={s.rowIcon}><Ionicons name="people-outline" size={17} color={colors.brand} /></View><View style={s.flex}><Text style={s.cardTitle}>Team & Memberships</Text><Text style={s.help}>Employees, roles, and invitations</Text></View><Ionicons name="chevron-forward" size={16} color={colors.subtle} /></Pressable>
  </Screen>;
}

function Field({ label, hint, help, editable = true, ...props }: { label: string; hint?: string; help?: string; editable?: boolean } & React.ComponentProps<typeof TextInput>) { return <View style={s.field}><View style={s.labelRow}><Text style={s.label}>{label}</Text>{hint ? <Text style={s.hint}>{hint}</Text> : null}</View><TextInput {...props} editable={editable} style={[s.input, !editable && s.readOnly]} placeholderTextColor={colors.subtle} />{help ? <Text style={s.help}>{help}</Text> : null}</View>; }
function SettingsSection({ title, children }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; children: React.ReactNode }) { return <View style={s.settingsSection}><GroupLabel>{title}</GroupLabel><View style={s.sectionBody}>{children}</View></View>; }
function ReadOnlyRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) { return <View style={[s.readOnlyRow, !last && s.rowBorder]}><View style={s.rowIcon}><Ionicons name={icon} size={17} color={colors.brand} /></View><View style={s.flex}><Text style={s.readOnlyLabel}>{label}</Text><Text style={s.readOnlyValue} numberOfLines={2}>{value}</Text></View><Ionicons name="lock-closed-outline" size={15} color={colors.subtle} /></View>; }
function WorkspaceRow({ workspace, current }: { workspace: OrganizationSettings; current: boolean }) { return <View style={s.workspaceRow}><View style={s.workspaceAvatar}><Text style={s.workspaceInitials}>{initials(workspace.name)}</Text></View><View style={s.flex}><View style={s.workspaceNameRow}><Text style={s.workspaceName}>{workspace.name}</Text>{current ? <Text style={s.currentPill}>Current</Text> : null}</View><Text style={s.workspaceMeta} numberOfLines={1}>{workspace.hostname ?? workspace.slug} · {workspace.role}</Text></View><Text style={current ? s.active : s.inactive}>{current ? "✓ Active" : workspace.status}</Text></View>; }
function toForm(value: OrganizationSettings): OrganizationSettingsInput { return { name: value.name, legalName: value.legalName, contactEmail: value.contactEmail, contactPhone: value.contactPhone, websiteUrl: value.websiteUrl, bookingUrl: value.bookingUrl, timezone: value.timezone, currencyCode: value.currencyCode }; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "WS"; }

const s = StyleSheet.create({
  flex: { flex: 1 },
  notice: { padding: 14, borderRadius: 14, backgroundColor: colors.warningSoft, flexDirection: "row", gap: 10 }, noticeTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, noticeText: { color: colors.muted, fontSize: 14, marginTop: 2 },
  cardTitle: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium }, help: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  logoImage: { width: "100%", height: "100%" },
  field: { gap: 6 }, labelRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, label: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium }, hint: { color: colors.muted, fontSize: 12 },
  input: { minHeight: 46, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 12, color: colors.ink, fontSize: 16 }, readOnly: { backgroundColor: colors.neutralSoft, color: colors.muted }, pickerWrap: { paddingHorizontal: 0, overflow: "hidden", justifyContent: "center" }, picker: { height: 46, color: colors.ink },
  muted: { opacity: 0.4 },
  workspaceRow: { minHeight: 64, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }, workspaceAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, workspaceInitials: { color: colors.brand, fontSize: 13, fontFamily: fonts.bold }, workspaceNameRow: { flexDirection: "row", alignItems: "center", gap: 6 }, workspaceName: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium }, currentPill: { color: colors.neutralText, backgroundColor: colors.neutralSoft, borderRadius: 6, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, fontFamily: fonts.bold }, workspaceMeta: { color: colors.muted, fontSize: 13, marginTop: 2, textTransform: "capitalize" }, active: { color: colors.success, fontSize: 13, fontFamily: fonts.bold }, inactive: { color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  hero: { borderRadius: 16, padding: 20, alignItems: "center", backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, heroLogo: { width: 76, height: 76, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", overflow: "visible" }, heroInitials: { color: colors.brand, fontSize: 24, fontFamily: fonts.bold }, editLogo: { position: "absolute", right: -5, bottom: -5, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.surface, alignItems: "center", justifyContent: "center" }, heroName: { color: colors.ink, fontSize: 22, fontFamily: fonts.bold, marginTop: 12 }, heroDomain: { color: colors.muted, fontSize: 14, marginTop: 2 }, heroMeta: { flexDirection: "row", gap: 8, marginTop: 12 }, heroPill: { color: colors.neutralText, backgroundColor: colors.neutralSoft, borderRadius: 8, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontFamily: fonts.bold, textTransform: "capitalize" }, removeLogo: { color: colors.danger, fontSize: 14, fontFamily: fonts.medium, marginTop: 12 },
  settingsSection: { gap: 6 }, sectionBody: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 },
  readOnlyRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 }, rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, rowIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, readOnlyLabel: { color: colors.muted, fontSize: 13 }, readOnlyValue: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium, marginTop: 1 },
  saveBar: { flexDirection: "row", gap: 10 }, resetButton: { width: 96, height: 52, borderRadius: 14, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" }, resetText: { color: colors.neutralText, fontSize: 16, fontFamily: fonts.bold }, saveButton: { flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, saveText: { color: "#fff", fontSize: 16, fontFamily: fonts.bold },
  workspacesHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, roundAdd: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, groupCard: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, overflow: "hidden" }, teamCard: { minHeight: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 },
});
