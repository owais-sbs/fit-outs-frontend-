import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/shared/context/auth-context";
import { useCommunicationsSocket } from "@/shared/hooks/useCommunicationsSocket";
import {
  createCommunicationChannel,
  fetchChannelMessages,
  fetchCommunicationsInbox,
  markChannelRead,
} from "../../api/communications.api";
import ChannelChatPanel from "./ChannelChatPanel";
import { ROUTES } from "@/shared/constants/routes";

const STAFF_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "INTERNAL", label: "Internal" },
  { id: "CLIENT", label: "Clients" },
  { id: "GROUP", label: "Groups" },
  { id: "PROJECT_ROOM", label: "Projects" },
  { id: "EMAIL", label: "Email" },
];

const CLIENT_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "CLIENT", label: "Client" },
  { id: "PROJECT_ROOM", label: "Projects" },
  { id: "EMAIL", label: "Email" },
];

export default function CommunicationsPage({ clientMode = false }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const deepLinkChannel = searchParams.get("channel");
  const accountId = user?.id != null ? Number(user.id) : null;
  const filters = clientMode ? CLIENT_FILTERS : STAFF_FILTERS;
  const [filter, setFilter] = useState("ALL");
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchCommunicationsInbox(filter);
      setInbox(items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMessages = useCallback(async (channelUuid) => {
    if (!channelUuid) return;
    const msgs = await fetchChannelMessages(channelUuid);
    setMessages(msgs);
    await markChannelRead(channelUuid).catch(() => {});
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
      loadMessages(selected.channelUuid);
    } else {
      setMessages([]);
    }
  }, [selected, loadMessages]);

  useCommunicationsSocket({
    channelUuid: selected?.channelUuid,
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
    await createCommunicationChannel({ channelType: "INTERNAL", name });
    loadInbox();
  };

  const projectLink = useMemo(() => {
    if (!selected?.projectId) return null;
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
  }, [selected, clientMode]);

  return (
    <div className="page-enter flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight flex items-center gap-2 md:text-[2rem]">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            Communications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clientMode
              ? "Your project and client conversations in one place."
              : "Internal, client, group, and project-room conversations in one place."}
          </p>
        </div>
        {!clientMode && (
          <Button variant="outline" size="sm" onClick={startInternalChat} className="gap-2">
            <Plus className="h-4 w-4" />
            New internal channel
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto">
          {filters.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="surface-panel overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : inbox.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            inbox.map((item) => (
              <button
                key={`${item.channelType}-${item.channelUuid}`}
                type="button"
                onClick={() => setSelected(item)}
                className={`w-full border-b border-border/30 px-4 py-3 text-left hover:bg-secondary/50 ${
                  selected?.channelUuid === item.channelUuid ? "bg-secondary/70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.unreadCount > 0 && (
                    <Badge variant="default" className="shrink-0">
                      {item.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.contextLabel}</p>
                <p className="text-xs truncate mt-1">{item.lastMessage || "—"}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.contextLabel}</p>
                </div>
                {projectLink && (
                  <Button variant="outline" size="sm" asChild>
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
                  loadMessages(selected.channelUuid);
                  loadInbox();
                }}
              />
            </>
          ) : (
            <div className="surface-panel flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
