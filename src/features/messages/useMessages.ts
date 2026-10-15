import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { ConversationMessage, MessageConversationDetail, MessageConversationList } from "@/lib/api/types";

export function useConversations(search: string) { return useQuery({ queryKey: ["messages", { search }], queryFn: () => apiRequest<MessageConversationList>(`/messages?search=${encodeURIComponent(search.trim())}`), refetchInterval: 15_000, placeholderData: (previous) => previous }); }
export function useConversation(id?: string) { return useQuery({ queryKey: ["message-conversation", id], queryFn: () => apiRequest<MessageConversationDetail>(`/messages/${id}`), enabled: Boolean(id), refetchInterval: 8_000 }); }
export function useOpenConversation() { const client = useQueryClient(); return useMutation({ mutationFn: (customerId: string) => apiRequest<{ conversationId: string }>("/messages", { method: "POST", body: JSON.stringify({ customerId }) }), onSuccess: () => void client.invalidateQueries({ queryKey: ["messages"] }) }); }
type SendMessagePayload = { body: string; channel: "app" | "sms" };

export function useSendMessage(id?: string) {
  const client = useQueryClient();
  const queryKey = ["message-conversation", id] as const;

  return useMutation<unknown, Error, SendMessagePayload, { optimisticId: string }>({
    mutationFn: (payload) => apiRequest(`/messages/${id}`, { method: "POST", body: JSON.stringify(payload) }),
    onMutate: async (payload) => {
      await client.cancelQueries({ queryKey });
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: ConversationMessage = {
        id: optimisticId,
        senderType: "admin",
        channel: payload.channel,
        direction: "outbound",
        body: payload.body,
        deliveryStatus: "sending",
        errorMessage: null,
        createdAt: new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
      };
      client.setQueryData<MessageConversationDetail>(queryKey, (current) => current
        ? { ...current, messages: [...current.messages, optimisticMessage] }
        : current);
      return { optimisticId };
    },
    onSuccess: (_result, _payload, context) => {
      client.setQueryData<MessageConversationDetail>(queryKey, (current) => current
        ? { ...current, messages: current.messages.map((message) => message.id === context.optimisticId ? { ...message, deliveryStatus: "sent" } : message) }
        : current);
      void client.invalidateQueries({ queryKey });
      void client.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error, _payload, context) => {
      if (!context) return;
      client.setQueryData<MessageConversationDetail>(queryKey, (current) => current
        ? { ...current, messages: current.messages.map((message) => message.id === context.optimisticId ? { ...message, deliveryStatus: "failed", errorMessage: error.message } : message) }
        : current);
    },
  });
}
