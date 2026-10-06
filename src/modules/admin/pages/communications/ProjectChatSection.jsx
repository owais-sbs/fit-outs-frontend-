import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectChatGroup,
  fetchChannelMessages,
  fetchProjectChatCandidates,
  fetchProjectChatGroups,
  fetchProjectDirectCandidates,
  markChannelRead,
  startProjectDirectChat,
  updateProjectChatGroupMembers,
} from "../../api/communications.api";
import ChannelChatPanel from "./ChannelChatPanel";
import { useCommunicationsSocket } from "@/shared/hooks/useCommunicationsSocket";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

function apiError(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || fallback;
}

function canManageProjectGroups(roleList) {
  if (roleList.includes(ROLES.SUPER_ADMIN)) return false;
  return roleList.includes(ROLES.ADMIN)
    || roleList.includes(ROLES.PROJECT_MANAGER)
    || roleList.includes(ROLES.BUSINESS_OWNER);
}

export default function ProjectChatSection({ projectId, locked = false }) {
  const { user, role, roles } = useAuth();
  const roleList = roles?.length ? roles : role ? [role] : [];
  const canManage = canManageProjectGroups(roleList);
  const canStartChat = !roleList.includes(ROLES.SUPER_ADMIN);
  const accountId = user?.id != null ? Number(user.id) : null;

  const [groups, setGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedPeople, setSelectedPeople] = useState(() => new Set());
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);

  const [directOpen, setDirectOpen] = useState(false);
  const [directCandidates, setDirectCandidates] = useState([]);
  const [directPersonId, setDirectPersonId] = useState(null);
  const [directError, setDirectError] = useState("");
  const [startingDirect, setStartingDirect] = useState(false);

  const selected = groups.find((group) => group.channelUuid === selectedId) || null;

  const loadGroups = useCallback(async ({ silent = false } = {}) => {
    if (!projectId) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const list = await fetchProjectChatGroups(projectId);
      setGroups(list);
      setSelectedId((current) => {
        if (current && list.some((group) => group.channelUuid === current)) return current;
        return list[0]?.channelUuid || null;
      });
    } catch (err) {
      if (!silent) setGroups([]);
      setError(apiError(err, "Unable to load project chat."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  const loadMessages = useCallback(async (channelUuid) => {
    if (!channelUuid) {
      setMessages([]);
      return;
    }
    try {
      const msgs = await fetchChannelMessages(channelUuid);
      setMessages(msgs);
      await markChannelRead(channelUuid).catch(() => {});
    } catch (err) {
      setMessages([]);
      setError(apiError(err, "Unable to load messages."));
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadMessages(selected?.channelUuid);
  }, [selected?.channelUuid, loadMessages]);

  useCommunicationsSocket({
    channelUuid: selected?.channelUuid,
    accountId,
    onMessage: (msg) => {
      setMessages((prev) => (prev.some((item) => item.uuid === msg.uuid) ? prev : [...prev, msg]));
    },
    onInboxRefresh: () => loadGroups({ silent: true }),
  });

  const groupedDirectCandidates = useMemo(() => {
    const byRole = new Map();
    for (const person of directCandidates) {
      const label = person.roleLabel || "Member";
      if (!byRole.has(label)) byRole.set(label, []);
      byRole.get(label).push(person);
    }
    return Array.from(byRole.entries());
  }, [directCandidates]);

  const groupedCandidates = useMemo(() => {
    const byRole = new Map();
    for (const person of candidates) {
      const label = person.roleLabel || "Member";
      if (!byRole.has(label)) byRole.set(label, []);
      byRole.get(label).push(person);
    }
    return Array.from(byRole.entries());
  }, [candidates]);

  const clientSelected = candidates.some(
    (person) => selectedPeople.has(person.accountId) && person.projectClient
  );

  const openDirect = async () => {
    setDirectPersonId(null);
    setDirectError("");
    setDirectOpen(true);
    try {
      setDirectCandidates(await fetchProjectDirectCandidates(projectId));
    } catch (err) {
      setDirectCandidates([]);
      setDirectError(apiError(err, "Unable to load people for this project."));
    }
  };

  const startDirect = async () => {
    if (directPersonId == null) return;
    setStartingDirect(true);
    setDirectError("");
    try {
      const created = await startProjectDirectChat(projectId, directPersonId);
      setDirectOpen(false);
      if (created?.channelUuid) setSelectedId(created.channelUuid);
      await loadGroups({ silent: true });
    } catch (err) {
      setDirectError(apiError(err, "Unable to start this chat."));
    } finally {
      setStartingDirect(false);
    }
  };

  const openCreate = async () => {
    setEditingId(null);
    setGroupName("");
    setSelectedPeople(new Set());
    setDialogError("");
    setDialogOpen(true);
    try {
      setCandidates(await fetchProjectChatCandidates(projectId));
    } catch (err) {
      setCandidates([]);
      setDialogError(apiError(err, "Unable to load people for this project."));
    }
  };

  const openEdit = async () => {
    if (!selected) return;
    setEditingId(selected.channelUuid);
    setGroupName(selected.name || "");
    setSelectedPeople(new Set((selected.members || []).map((member) => member.accountId)));
    setDialogError("");
    setDialogOpen(true);
    try {
      setCandidates(await fetchProjectChatCandidates(projectId));
    } catch (err) {
      setCandidates([]);
      setDialogError(apiError(err, "Unable to load people for this project."));
    }
  };

  const togglePerson = (person) => {
    setSelectedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(person.accountId)) next.delete(person.accountId);
      else next.add(person.accountId);
      const hasClient = candidates.some((item) => next.has(item.accountId) && item.projectClient);
      if (hasClient) {
        for (const item of candidates) {
          if (next.has(item.accountId) && !item.canJoinClientGroup) next.delete(item.accountId);
        }
      }
      return next;
    });
  };

  const saveGroup = async () => {
    setSaving(true);
    setDialogError("");
    try {
      const memberAccountIds = Array.from(selectedPeople);
      if (editingId) {
        const updated = await updateProjectChatGroupMembers(projectId, editingId, memberAccountIds);
        setSelectedId(updated?.channelUuid || editingId);
      } else {
        const created = await createProjectChatGroup(projectId, {
          name: groupName.trim(),
          memberAccountIds,
        });
        setSelectedId(created?.channelUuid || null);
      }
      setDialogOpen(false);
      await loadGroups({ silent: true });
    } catch (err) {
      setDialogError(apiError(err, "Unable to save this group."));
    } finally {
      setSaving(false);
    }
  };

  const readOnly = locked || !selected?.canSend;
  const readOnlyHint = locked
    ? "This project is archived."
    : selected?.direct
      ? "Only the two people in this chat can send."
      : selected?.includesClient
        ? "Only the Project Manager, Project Director, and the client can send in this group."
        : "Only members of this group can send.";

  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" />
            Project chat
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Start a chat with anyone on the internal team. Only an Admin, Project Manager, or Project Director can contact the client.
          </p>
        </div>
        {!locked && (canStartChat || canManage) && (
          <div className="flex items-center gap-2">
            {canStartChat && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Start a chat"
                onClick={openDirect}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {canManage && (
              <Button size="sm" variant="outline" className="gap-2" onClick={openCreate}>
                New group
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid min-h-[520px] lg:grid-cols-[280px_1fr]">
        <div className="border-b border-border/60 lg:border-b-0 lg:border-r">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading groups…</p>
          ) : groups.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No chats yet. Use the plus button to start one.
            </p>
          ) : (
            groups.map((group) => (
              <button
                key={group.channelUuid}
                type="button"
                onClick={() => setSelectedId(group.channelUuid)}
                className={`w-full border-b border-border/30 px-4 py-3 text-left hover:bg-secondary/50 ${
                  selected?.channelUuid === group.channelUuid ? "bg-secondary/70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{group.name}</p>
                  {group.unreadCount > 0 && <Badge className="shrink-0">{group.unreadCount}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {group.direct
                    ? "Direct"
                    : group.includesClient
                      ? "Client group"
                      : "Internal"}
                  {!group.direct && ` · ${group.memberCount || group.members?.length || 0} people`}
                </p>
                <p className="mt-1 truncate text-xs">{group.lastMessage || "No messages yet"}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2 p-3">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selected.members || []).map((member) => member.displayName).join(", ") || "No members"}
                  </p>
                </div>
                {canManage && !locked && !selected.direct && (
                  <Button size="sm" variant="ghost" className="gap-2" onClick={openEdit}>
                    <Users className="h-4 w-4" />
                    Edit members
                  </Button>
                )}
              </div>
              <ChannelChatPanel
                channelUuid={selected.channelUuid}
                channelType={selected.direct ? "PROJECT_DIRECT" : "PROJECT_GROUP"}
                messages={messages}
                readOnly={readOnly}
                readOnlyHint={readOnly ? readOnlyHint : undefined}
                onIncoming={(msg) => {
                  setMessages((prev) => (prev.some((item) => item.uuid === msg.uuid) ? prev : [...prev, msg]));
                }}
                onSent={() => {
                  loadMessages(selected.channelUuid);
                  loadGroups({ silent: true });
                }}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "Select a chat"}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit group members" : "New project group"}</DialogTitle>
            <DialogDescription>
              {clientSelected
                ? "This group includes the client, so only a Project Manager or Project Director can be added with them."
                : "Choose the people who should be in this group."}
            </DialogDescription>
          </DialogHeader>

          {!editingId && (
            <div className="space-y-2">
              <Label htmlFor="project-group-name">Group name</Label>
              <Input
                id="project-group-name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Site team"
              />
            </div>
          )}

          <div className="space-y-4">
            {groupedCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No people are available for this project yet.</p>
            ) : (
              groupedCandidates.map(([label, people]) => (
                <div key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <div className="space-y-2">
                    {people.map((person) => {
                      const disabled = clientSelected && !person.projectClient && !person.canJoinClientGroup;
                      return (
                        <label
                          key={person.accountId}
                          className={`flex items-start gap-3 rounded-lg border border-border/50 px-3 py-2 ${
                            disabled ? "opacity-50" : ""
                          }`}
                        >
                          <Checkbox
                            checked={selectedPeople.has(person.accountId)}
                            disabled={disabled}
                            onCheckedChange={() => togglePerson(person)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{person.displayName}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {person.email || person.roleLabel}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {dialogError && <p className="text-sm text-destructive">{dialogError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={saveGroup}
              disabled={saving || (!editingId && !groupName.trim()) || selectedPeople.size === 0}
            >
              {saving ? "Saving…" : editingId ? "Save members" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={directOpen} onOpenChange={setDirectOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start a chat</DialogTitle>
            <DialogDescription>
              Choose one person on the internal team. The client can only be contacted by an Admin, Project Manager, or Project Director.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {groupedDirectCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No people are available for this project yet.</p>
            ) : (
              groupedDirectCandidates.map(([label, people]) => (
                <div key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <div className="space-y-2">
                    {people.map((person) => {
                      const selectedPerson = directPersonId === person.accountId;
                      return (
                        <button
                          key={person.accountId}
                          type="button"
                          onClick={() => setDirectPersonId(person.accountId)}
                          className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left ${
                            selectedPerson ? "border-primary bg-secondary/60" : "border-border/50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{person.displayName}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {person.email || person.roleLabel}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {directError && <p className="text-sm text-destructive">{directError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDirectOpen(false)} disabled={startingDirect}>
              Cancel
            </Button>
            <Button onClick={startDirect} disabled={startingDirect || directPersonId == null}>
              {startingDirect ? "Starting…" : "Start chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
