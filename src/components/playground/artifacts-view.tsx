"use client";

import { ArrowLeftIcon, CodeIcon, Trash2Icon } from "lucide-react";
import { usePlayground } from "@/lib/playground/store";

export function ArtifactsView({ onBack }: { onBack: () => void }) {
  const { artifacts, setArtifact, removeArtifact } = usePlayground();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink/10 px-4">
        <button onClick={onBack} aria-label="Back" className="text-ink/50 hover:text-exotic">
          <ArrowLeftIcon className="size-4" />
        </button>
        <p className="text-sm font-bold">Artifacts</p>
        <span className="text-xs text-ink/40">{artifacts.length} saved locally</span>
      </header>
      <div className="mx-auto w-full max-w-[900px] p-6">
        {artifacts.length === 0 ? (
          <div className="mt-20 text-center">
            <CodeIcon className="mx-auto size-10 text-ink/15" />
            <p className="mt-3 text-sm text-ink/40">
              Long code blocks from chats land here. Ask the model for code, then hit “Artifact”.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {artifacts.map((a) => (
              <div key={a.id} className="group border-2 border-ink/10 transition-none hover:border-exotic">
                <button onClick={() => setArtifact(a)} className="w-full p-4 text-left">
                  <p className="truncate text-sm font-bold">{a.title}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                    {a.language || "text"} · {a.content.split("\n").length} lines · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 line-clamp-3 font-mono text-xs text-ink/50">{a.content}</p>
                </button>
                <div className="flex justify-end border-t border-ink/10 px-2 py-1 opacity-0 transition-none group-hover:opacity-100">
                  <button
                    aria-label="Delete artifact"
                    onClick={() => void removeArtifact(a.id)}
                    className="text-ink/40 hover:text-red-600"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
