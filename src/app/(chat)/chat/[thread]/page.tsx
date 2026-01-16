import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/components/chat-bot";

import { ChatMessage, ChatThread } from "app-types/chat";

const fetchThread = async (
  threadId: string,
): Promise<(ChatThread & { messages: ChatMessage[] }) | null> => {
  return await selectThreadWithMessagesAction(threadId);
};

export default async function Page({
  params,
}: { params: Promise<{ thread: string }> }) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  // Don't redirect - allow new threads to be created when user sends a message
  return <ChatBot threadId={threadId} initialMessages={thread?.messages || []} />;
}
