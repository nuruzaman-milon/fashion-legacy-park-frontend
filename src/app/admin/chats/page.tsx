import type { Metadata } from "next";

import { ChatInbox } from "@/components/admin/chats/chat-inbox";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Chats" };

export default function AdminChatsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Chats"
        description="Customer support conversations — replies reach the storefront widget within seconds."
        className="mb-2"
      />
      <ChatInbox />
    </div>
  );
}
