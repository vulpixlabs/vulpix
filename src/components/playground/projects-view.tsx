"use client";

import { useState } from "react";
import { ArrowLeftIcon, FolderIcon, FolderPlusIcon, MessageSquareIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { usePlayground } from "@/lib/playground/store";
import { deleteProject, putProject, uid, type ProjectRecord } from "@/lib/playground/db";

export function ProjectsView({ onBack }: { onBack: () => void }) {
  const { chats, openChat, newChat, patchChat } = usePlayground();
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
  const [name, setName] = useState("");

  const load = async () => {
    const { listProjects } = await import("@/lib/playground/db");
    setProjects(await listProjects());
  };
  if (projects === null) void load();

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    const rec: ProjectRecord = { id: uid(), name: n, createdAt: Date.now(), userId: null };
    await putProject(rec);
    setProjects((prev) => [rec, ...(prev ?? [])]);
    setName("");
    toast.success(`Project “${n}” created`);
  };

  const remove = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => (prev ?? []).filter((p) => p.id !== id));
  };

  const assign = (chatId: string, projectId?: string) => {
    patchChat(chatId, { projectId });
  };

  const list = projects ?? [];
  const ungrouped = chats.filter((c) => !c.projectId);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink/10 px-4">
        <button onClick={onBack} aria-label="Back" className="text-ink/50 hover:text-exotic">
          <ArrowLeftIcon className="size-4" />
        </button>
        <p className="text-sm font-bold">Projects</p>
        <span className="text-xs text-ink/40">group related chats</span>
      </header>
      <div className="mx-auto w-full max-w-[760px] p-6">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void create()}
            placeholder="New project name…"
            className="flex-1 border-2 border-ink/20 bg-paper px-3 py-2 text-sm outline-none transition-none focus:border-exotic"
          />
          <button
            onClick={() => void create()}
            className="flex items-center gap-1.5 border-2 border-exotic bg-exotic px-4 py-2 text-sm font-bold text-paper transition-none hover:border-ink hover:bg-ink"
          >
            <FolderPlusIcon className="size-4" /> Create
          </button>
        </div>

        {list.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink/40">
            No projects yet. Create one, then move chats into it from the list below.
          </p>
        ) : (
          list.map((p) => {
            const groupChats = chats.filter((c) => c.projectId === p.id);
            return (
              <section key={p.id} className="mt-6 border-2 border-ink/10">
                <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5">
                  <FolderIcon className="size-4 text-exotic" />
                  <p className="text-sm font-bold">{p.name}</p>
                  <span className="text-xs text-ink/40">{groupChats.length} chats</span>
                  <button
                    aria-label="Delete project"
                    onClick={() => void remove(p.id)}
                    className="ml-auto text-ink/30 hover:text-red-600"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
                {groupChats.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-ink/35">Empty, move chats here via “Move to project”.</p>
                ) : (
                  groupChats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        newChat();
                        void openChat(c.id);
                        onBack();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-ink/70 transition-none hover:bg-exotic/5 hover:text-ink"
                    >
                      <MessageSquareIcon className="size-3.5 shrink-0 text-ink/30" />
                      <span className="truncate">{c.title}</span>
                    </button>
                  ))
                )}
              </section>
            );
          })
        )}

        {ungrouped.length > 0 && (
          <section className="mt-6">
            <p className="label mb-2 text-ink/40">Ungrouped chats, move to a project</p>
            {ungrouped.map((c) => (
              <div key={c.id} className="flex items-center gap-2 border-b border-ink/5 py-1.5">
                <MessageSquareIcon className="size-3.5 shrink-0 text-ink/30" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink/70">{c.title}</span>
                <select
                  value=""
                  onChange={(e) => assign(c.id, e.target.value || undefined)}
                  className="cursor-pointer border border-ink/15 bg-paper px-1.5 py-0.5 text-[11px] outline-none"
                >
                  <option value="">Move to…</option>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {c.projectId && <option value="">Remove from project</option>}
                </select>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
