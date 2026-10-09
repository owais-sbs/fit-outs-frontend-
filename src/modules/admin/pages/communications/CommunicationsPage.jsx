import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/shared/context/auth-context";
import { useCommunicationsSocket } from "@/shared/hooks/useCommunicationsSocket";
import {
  createCommunicationChannel,
  emailItemToMessage,
  fetchChannelMessages,
  fetchCommunicationsInbox,
  markChannelRead,
} from "../../api/communications.api";
import ChannelChatPanel from "./ChannelChatPanel";
import { ROUTES, projectDetailPath } from "@/shared/constants/routes";

const STAFF_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "INTERNAL", label: "Internal" },
  { id: "CLIENT", label: "Clients" },
  { id: "GROUP", label: "Groups" },
  { id: "PROJECT_ROOM", label: "Projects" },
  { id: "PROJECT_GROUP", label: "Project groups" },
  { id: "EMAIL", label: "Email" },
];

const CLIENT_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "CLIENT", label: "Client" },
  { id: "PROJECT_ROOM", label: "Projects" },
  { id: "PROJECT_GROUP", label: "Project groups" },
  { id: "EMAIL", label: "Email" },
];

function projectGroupPath(pathname, projectId) {
  const id = String(projectId);
  if (pathname.startsWith("/client")) return ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", id);
  if (pathname.startsWith("/site-engineer")) return ROUTES.SITE_ENGINEER.PROJECT_DETAIL.replace(":projectId", id);
  if (pathname.startsWith("/subcontractor")) return ROUTES.SUBCONTRACTOR.PROJECT_DETAIL.replace(":projectId", id);
  if (pathname.startsWith("/finance")) return ROUTES.FINANCE.PROJECT_DETAIL.replace(":projectId", id);
  return projectDetailPath(pathname, id);
}

export default function CommunicationsPage({ clientMode = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const deepLinkChannel = searchParams.get("channel");
  const accountId = user?.id != null ? Number(user.id) : null;
  const filters = clientMode ? CLIENT_FILTERS : STAFF_FILTERS;
  const [filter, setFilter] = useState("ALL");
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchCommunicationsInbox(filter);
      setInbox(items);
    } catch (err) {
      console.error("Failed to load communications inbox", err);
      setError("Unable to load conversations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMessages = useCallback(async (item) => {
    if (!item?.channelUuid) return;
    if (item.channelType === "EMAIL") {
      try {
        const msgs = await fetchChannelMessages(item.channelUuid);
        setMessages(msgs.length > 0 ? msgs : [emailItemToMessage(item)].filter(Boolean));
      } catch (err) {
        console.error("Failed to load sent email", err);
        const fallback = emailItemToMessage(item);
        setMessages(fallback ? [fallback] : []);
      }
      return;
    }
    try {
      const msgs = await fetchChannelMessages(item.channelUuid);
      setMessages(msgs);
      await markChannelRead(item.channelUuid).catch(() => {});
    } catch (err) {
      console.error("Failed to load channel messages", err);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!deepLinkChannel || loading || inbox.length === 0) return;
    const match = inbox.find((item) => String(item.channelUuid) === deepLinkChannel);
    if (match) {
      setSelected(match);
    }
  }, [deepLinkChannel, inbox, loading]);

  useEffect(() => {
    if (selected?.channelUuid) {
      loadMessages(selected);
    } else {
      setMessages([]);
    }
  }, [selected, loadMessages]);

  useCommunicationsSocket({
    channelUuid: selected?.channelType === "EMAIL" ? null : selected?.channelUuid,
    accountId,
    onMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.uuid === msg.uuid)) return prev;
        return [...prev, msg];
      });
    },
    onInboxRefresh: loadInbox,
  });

  const startInternalChat = async () => {
    const name = window.prompt("Channel name", "Team chat");
    if (!name) return;
    try {
      await createCommunicationChannel({ channelType: "INTERNAL", name });
      loadInbox();
    } catch (err) {
      console.error("Failed to create channel", err);
      setError("Unable to create channel. Please try again.");
    }
  };

  const projectLink = useMemo(() => {
    if (!selected?.projectId) return null;
    if (selected.channelType === "PROJECT_GROUP") {
      return projectGroupPath(location.pathname, selected.projectId);
    }
    if (clientMode) {
      if (selected.roomTaskId) {
        return ROUTES.CLIENT.PROJECT_ROOM_TASK.replace(":projectId", selected.projectId).replace(
          ":taskId",
          selected.roomTaskId
        );
      }
      if (selected.projectRoomId) {
        return ROUTES.CLIENT.PROJECT_ROOM_CHAT.replace(":projectId", selected.projectId).replace(
          ":roomId",
          selected.projectRoomId
        );
      }
      return ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", selected.projectId);
    }
    if (selected.roomTaskId) {
      return ROUTES.ADMIN.PROJECT_ROOM_TASK.replace(":projectId", selected.projectId).replace(
        ":taskId",
        selected.roomTaskId
      );
    }
    if (selected.projectRoomId) {
      return ROUTES.ADMIN.PROJECT_ROOM_CHAT.replace(":projectId", selected.projectId).replace(
        ":roomId",
        selected.projectRoomId
      );
    }
    return null;
  }, [selected, clientMode, location.pathname]);

  return (
    <PageShell className="flex h-[calc(100vh-7.5rem)] min-h-[32rem] flex-col gap-4 !space-y-0">
      <PageHeader
        title="Communications"
        description={
          clientMode
            ? "Project and client conversations in one place."
            : "Internal, client, and project conversations."
        }
        actions={
          !clientMode ? (
            <Button variant="outline" size="sm" onClick={startInternalChat} className="gap-2">
              <Plus className="h-4 w-4" />
              New channel
            </Button>
          ) : null
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <div className="flex w-full justify-start">
          <TabsList className="!inline-flex h-auto !w-auto max-w-full flex-wrap !justify-start gap-1 bg-muted/50 p-1">
            {filters.map((f) => (
              <TabsTrigger key={f.id} value={f.id} className="text-xs sm:text-sm">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={loadInbox}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        <div className="admin-chat-shell !min-h-0 overflow-hidden">
          <div className="admin-chat-header">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Inbox
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <LoadingPanel size="inline" messages={loadingMessages.generic} className="p-4" />
            ) : inbox.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              inbox.map((item) => (
                <button
                  key={`${item.channelType}-${item.channelUuid}`}
                  type="button"
                  onClick={() => setSelected(item)}
                  data-active={selected?.channelUuid === item.channelUuid}
                  className="admin-inbox-item"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    {item.unreadCount > 0 && (
                      <Badge variant="default" className="shrink-0">
                        {item.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.contextLabel}</p>
                  <p className="mt-1 truncate text-xs text-foreground/70">{item.lastMessage || "No messages yet"}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          {selected ? (
            <>
              <div className="admin-chat-thread-header flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-tight text-[#0a1628] dark:text-foreground">
                    {selected.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{selected.contextLabel}</p>
                </div>
                {projectLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0 border-[#C9A96E]/50 text-[#0a1628] hover:bg-[#C9A96E]/15 dark:text-foreground"
                  >
                    <Link to={projectLink}>Open in project</Link>
                  </Button>
                )}
              </div>
              <ChannelChatPanel
                channelUuid={selected.channelUuid}
                channelType={selected.channelType}
                messages={messages}
                projectId={selected.projectId}
                projectRoomId={selected.projectRoomId}
                roomTaskId={selected.roomTaskId}
                onIncoming={(msg) => {
                  setMessages((prev) => {
                    if (prev.some((m) => m.uuid === msg.uuid)) return prev;
                    return [...prev, msg];
                  });
                }}
                onSent={() => {
                  loadMessages(selected);
                  loadInbox();
                }}
              />
            </>
          ) : (
            <div className="admin-chat-shell flex flex-1 items-center justify-center">
              <div className="px-6 text-center">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground/80">Select a conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a thread from the inbox to view messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
