"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_SETTINGS,
  deleteArtifact,
  deleteChat,
  getSettings,
  listArtifacts,
  listChats,
  putArtifact,
  putChat,
  putSettings,
  uid,
  type ArtifactRecord,
  type ChatRecord,
  type SettingsRecord,
} from "@/lib/playground/db";

export type PlaygroundView = "chat" | "artifacts" | "skills" | "projects" | "providers";

interface PlaygroundState {
  ready: boolean;
  view: PlaygroundView;
  setView: (v: PlaygroundView) => void;
  settings: SettingsRecord;
  saveSettings: (patch: Partial<SettingsRecord>) => Promise<void>;
  setActiveProvider: (providerId: string, model?: string) => Promise<void>;
  chats: ChatRecord[];
  activeChat: ChatRecord | null;
  newChat: () => void;
  openChat: (id: string) => void;
  createChat: (patch: Partial<ChatRecord>) => Promise<ChatRecord>;
  updateActiveChat: (patch: Partial<ChatRecord>) => void;
  patchChat: (id: string, patch: Partial<ChatRecord>) => void;
  removeChat: (id: string) => Promise<void>;
  artifacts: ArtifactRecord[];
  addArtifact: (a: Omit<ArtifactRecord, "id" | "createdAt" | "userId">) => Promise<ArtifactRecord>;
  removeArtifact: (id: string) => Promise<void>;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  artifact: ArtifactRecord | null;
  setArtifact: (a: ArtifactRecord | null) => void;
  hasAnyKey: boolean;
}

const Ctx = createContext<PlaygroundState | null>(null);

export function usePlayground() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayground outside provider");
  return v;
}

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [view, setViewState] = useState<PlaygroundView>("chat");
  const [settings, setSettings] = useState<SettingsRecord>(DEFAULT_SETTINGS);
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRecord | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [artifact, setArtifact] = useState<ArtifactRecord | null>(null);

  useEffect(() => {
    (async () => {
      const [s, c, a] = await Promise.all([getSettings(), listChats(), listArtifacts()]);
      setSettings(s);
      setChats(c);
      setArtifacts(a);
      const hasKey = Object.values(s.keys).some(Boolean) || (s.customProviders ?? []).length > 0;
      if (!hasKey) setViewState("providers");
      queueMicrotask(() => setReady(true));
    })().catch(() => setReady(true));
  }, []);

  const setView = useCallback((v: PlaygroundView) => setViewState(v), []);

  const saveSettings = useCallback(async (patch: Partial<SettingsRecord>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void putSettings(next);
      return next;
    });
  }, []);

  const refreshChats = useCallback(async () => setChats(await listChats()), []);

  const newChat = useCallback(() => {
    setActiveChat(null);
    setArtifact(null);
  }, []);

  const openChat = useCallback(async (id: string) => {
    const { getChat } = await import("@/lib/playground/db");
    const c = await getChat(id);
    if (c) setActiveChat(c);
  }, []);

  const createChat = useCallback(async (patch: Partial<ChatRecord>) => {
    const rec: ChatRecord = {
      id: uid(),
      title: "Untitled",
      messages: [],
      mode: "default",
      provider: "openrouter",
      model: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: null,
      ...patch,
    };
    await putChat(rec);
    setChats((prev) => [rec, ...prev]);
    setActiveChat(rec);
    return rec;
  }, []);

  const patchChat = useCallback((id: string, patch: Partial<ChatRecord>) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch, updatedAt: Date.now() };
        void putChat(next);
        return next;
      })
    );
    setActiveChat((prev) => (prev?.id === id ? { ...prev, ...patch, updatedAt: Date.now() } : prev));
  }, []);

  const removeChat = useCallback(
    async (id: string) => {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      setActiveChat((prev) => (prev?.id === id ? null : prev));
    },
    []
  );

  const updateActiveChat = useCallback(
    (patch: Partial<ChatRecord>) => {
      setActiveChat((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch, updatedAt: Date.now() };
        void putChat(next).then(refreshChats);
        return next;
      });
    },
    [refreshChats]
  );

  const addArtifact = useCallback(
    async (a: Omit<ArtifactRecord, "id" | "createdAt" | "userId">) => {
      const rec: ArtifactRecord = { ...a, id: uid(), createdAt: Date.now(), userId: null };
      await putArtifact(rec);
      setArtifacts((prev) => [rec, ...prev]);
      return rec;
    },
    []
  );

  const removeArtifact = useCallback(async (id: string) => {
    await deleteArtifact(id);
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    setArtifact((prev) => (prev?.id === id ? null : prev));
  }, []);

  const setActiveProvider = useCallback(
    async (providerId: string, model?: string) => {
      await saveSettings({ defaultProvider: providerId, ...(model ? { defaultModel: model } : { defaultModel: "" }) });
    },
    [saveSettings]
  );

  const hasAnyKey = useMemo(
    () => Object.values(settings.keys).some(Boolean) || (settings.customProviders ?? []).length > 0,
    [settings]
  );

  const value: PlaygroundState = {
    ready,
    view,
    setView,
    settings,
    saveSettings,
    setActiveProvider,
    chats,
    activeChat,
    newChat,
    openChat,
    createChat,
    updateActiveChat,
    patchChat,
    removeChat,
    artifacts,
    addArtifact,
    removeArtifact,
    settingsOpen,
    setSettingsOpen,
    artifact,
    setArtifact,
    hasAnyKey,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
