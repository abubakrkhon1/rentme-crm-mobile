import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useConversation, useSendMessage } from "@/features/messages/useMessages";
import type { ConversationMessage } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const conversation = useConversation(conversationId);
  const send = useSendMessage(conversationId);
  const messagesRef = useRef<FlatList<ConversationMessage>>(null);
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"app" | "sms">("app");
  const appAvailable = Boolean(conversation.data?.conversation.appMessagingAvailable);
  const smsAvailable = Boolean(conversation.data?.conversation.phone);
  const effectiveChannel = channel === "app" && !appAvailable && smsAvailable ? "sms" : channel === "sms" && !smsAvailable && appAvailable ? "app" : channel;
  const messageCount = conversation.data?.messages.length ?? 0;
  const messages = useMemo(() => [...(conversation.data?.messages ?? [])].reverse(), [conversation.data?.messages]);

  useEffect(() => {
    requestAnimationFrame(() => messagesRef.current?.scrollToOffset({ offset: 0, animated: true }));
  }, [messageCount]);

  if (conversation.isLoading) return <ScreenSkeleton variant="list" />;
  if (conversation.isError) return <ErrorView message={conversation.error.message} onRetry={() => void conversation.refetch()} />;
  const data = conversation.data;
  if (!data) return <ErrorView message="Conversation was empty." />;

  async function submit() {
    const clean = body.trim();
    if (!clean || (!appAvailable && !smsAvailable)) return;
    try {
      setBody("");
      await send.mutateAsync({ body: clean, channel: effectiveChannel });
    } catch {}
  }

  return <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen scroll={false} contentStyle={s.screenContent}>
      <NavBar backLabel="Messages" title={data.conversation.customerName} subtitle={`${appAvailable ? "App registered" : "App not registered"}${smsAvailable ? " · SMS available" : ""}`} />
      <Segmented options={[{ value: "app" as const, label: "RentMe app" }, { value: "sms" as const, label: "SMS" }]} value={effectiveChannel} onChange={(next) => { if (next === "app" ? appAvailable : smsAvailable) setChannel(next); }} />
      <FlatList
        ref={messagesRef}
        style={s.messages}
        contentContainerStyle={s.messageContent}
        data={messages}
        inverted={messages.length > 0}
        keyExtractor={(message) => message.id}
        renderItem={({ item: message }) => {
          const outbound = message.senderType === "admin";
          const failed = outbound && message.deliveryStatus === "failed";
          const delivered = outbound && message.deliveryStatus === "delivered";
          const read = outbound && message.deliveryStatus === "read";
          return <View style={[s.bubbleWrap, outbound ? s.outboundWrap : s.inboundWrap]}>
            <View style={[s.bubble, outbound ? s.outbound : s.inbound]}><Text style={[s.body, outbound && s.outboundBody]}>{message.body}</Text></View>
            <View style={s.messageStatusRow}>
              <Text style={s.messageMeta}>{message.channel === "sms" ? "SMS" : "APP"} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{delivered ? " · Delivered" : read ? " · Read" : ""}</Text>
              {failed ? <Pressable onPress={() => Alert.alert("Message not delivered", message.errorMessage || "The message could not be delivered.")} accessibilityRole="button" accessibilityLabel="Show delivery error" style={s.failedStatus}><Text style={s.failedMark}>!</Text><Text style={s.failedText} numberOfLines={1}>{message.errorMessage || "Not delivered"}</Text></Pressable> : null}
            </View>
          </View>;
        }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Start the conversation with this customer.</Text></View>}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        showsVerticalScrollIndicator={false}
      />
      <View style={s.composer}>
        <TextInput value={body} onChangeText={setBody} multiline blurOnSubmit={false} placeholder={`Message via ${effectiveChannel === "sms" ? "SMS" : "RentMe app"}…`} placeholderTextColor={colors.subtle} style={s.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message" hitSlop={8} style={[s.send, (!body.trim() || send.isPending || (!appAvailable && !smsAvailable)) && s.disabled]} disabled={!body.trim() || send.isPending || (!appAvailable && !smsAvailable)} onPress={() => void submit()}><Ionicons name="arrow-up" size={20} color="#fff" /></Pressable>
      </View>
    </Screen>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { paddingBottom: 6, gap: 10 },
  messages: { flex: 1 },
  messageContent: { flexGrow: 1, gap: 10, justifyContent: "flex-start", paddingVertical: 4 },
  bubbleWrap: { maxWidth: "80%", gap: 3 },
  outboundWrap: { alignSelf: "flex-end", alignItems: "flex-end" },
  inboundWrap: { alignSelf: "flex-start" },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  outbound: { backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  inbound: { backgroundColor: colors.neutralSoft, borderBottomLeftRadius: 6 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  outboundBody: { color: "#fff" },
  messageStatusRow: { maxWidth: "100%", alignItems: "flex-end", gap: 3 },
  messageMeta: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  failedStatus: { maxWidth: 240, flexDirection: "row", alignItems: "center", gap: 5 },
  failedMark: { width: 16, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: colors.danger, color: "#fff", textAlign: "center", fontSize: 11, lineHeight: 16, fontFamily: fonts.bold },
  failedText: { flexShrink: 1, color: colors.danger, fontSize: 12, fontFamily: fonts.medium },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: colors.muted, fontSize: 15 },
  composer: { minHeight: 50, borderRadius: 25, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.track, paddingVertical: 5, paddingLeft: 16, paddingRight: 5, flexDirection: "row", alignItems: "flex-end", gap: 7 },
  input: { flex: 1, minHeight: 38, maxHeight: 110, color: colors.ink, fontSize: 16, paddingVertical: 8 },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
});
