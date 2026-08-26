import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { UIMessage } from "ai";

interface ChatRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  mode: string;
  skillId?: string;
  provider: string;
  model: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string | null;
}

interface ArtifactRecord {
  id: string;
  chatId: string;
  title: string;
  kind: "code" | "doc";
  language?: string;
  content: string;
  createdAt: number;
  userId?: string | null;
}

interface CustomProviderRecord {
  id: string;
  name: string;
  baseURL: string;
}

interface SettingsRecord {
  id: "settings";
  keys: Record<string, string>;
  tavilyKey?: string;
  defaultProvider?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
  customSystemPrompt?: string;
  customProviders?: CustomProviderRecord[];
}

interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  userId?: string | null;
}

interface PGDB extends DBSchema {
  chats: { key: string; value: ChatRecord; indexes: { "by-updated": number; "by-project": string } };
  artifacts: { key: string; value: ArtifactRecord; indexes: { "by-chat": string } };
  settings: { key: string; value: SettingsRecord };
  projects: { key: string; value: ProjectRecord };
}

let dbPromise: Promise<IDBPDatabase<PGDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<PGDB>("vulpix-playground", 1, {
      upgrade(d) {
        const chats = d.createObjectStore("chats", { keyPath: "id" });
        chats.createIndex("by-updated", "updatedAt");
        chats.createIndex("by-project", "projectId");
        const artifacts = d.createObjectStore("artifacts", { keyPath: "id" });
        artifacts.createIndex("by-chat", "chatId");
        d.createObjectStore("settings", { keyPath: "id" });
        d.createObjectStore("projects", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export async function listChats(): Promise<ChatRecord[]> {
  const all = await (await db()).getAllFromIndex("chats", "by-updated");
  return all.reverse();
}

export async function getChat(id: string) {
  return (await db()).get("chats", id);
}

export async function putChat(chat: ChatRecord) {
  await (await db()).put("chats", chat);
}

export async function deleteChat(id: string) {
  const d = await db();
  await d.delete("chats", id);
  const tx = d.transaction("artifacts", "readwrite");
  const idx = tx.store.index("by-chat");
  for await (const cursor of idx.iterate(id)) await cursor.delete();
  await tx.done;
}

export async function listArtifacts(): Promise<ArtifactRecord[]> {
  const all = await (await db()).getAll("artifacts");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putArtifact(a: ArtifactRecord) {
  await (await db()).put("artifacts", a);
}

export async function deleteArtifact(id: string) {
  await (await db()).delete("artifacts", id);
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const all = await (await db()).getAll("projects");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putProject(p: ProjectRecord) {
  await (await db()).put("projects", p);
}

export async function deleteProject(id: string) {
  const d = await db();
  await d.delete("projects", id);
  const tx = d.transaction("chats", "readwrite");
  const idx = tx.store.index("by-project");
  for await (const cursor of idx.iterate(id)) {
    await cursor.update({ ...cursor.value, projectId: undefined });
  }
  await tx.done;
}

export const DEFAULT_SETTINGS: SettingsRecord = {
  id: "settings",
  keys: {},
  temperature: 0.7,
  maxTokens: 0,
};

export async function getSettings(): Promise<SettingsRecord> {
  const s = await (await db()).get("settings", "settings");
  return s ?? DEFAULT_SETTINGS;
}

export async function putSettings(s: SettingsRecord) {
  await (await db()).put("settings", s);
}

export type { ChatRecord, ArtifactRecord, SettingsRecord, ProjectRecord, CustomProviderRecord };
