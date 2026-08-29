"use client";

import { useEffect, useState } from "react";
import { PlaygroundProvider, usePlayground } from "@/lib/playground/store";
import { Sidebar } from "@/components/playground/sidebar";
import { ChatView } from "@/components/playground/chat-view";
import { ArtifactsView } from "@/components/playground/artifacts-view";
import { SkillsView } from "@/components/playground/skills-view";
import { ProjectsView } from "@/components/playground/projects-view";
import { ProvidersView } from "@/components/playground/providers-view";
import { ArtifactPanel } from "@/components/playground/artifact-panel";
import { SettingsDialog } from "@/components/playground/settings-dialog";
import { Toaster } from "@/components/ui/sonner";
import { parseLaunchParams } from "@/lib/pwa-launch";
import { toast } from "sonner";

interface LaunchParams {
  files?: FileSystemFileHandle[];
  targetURL?: string;
}

function Shell() {
  const { ready, view, setView, activeChat } = usePlayground();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [launchText, setLaunchText] = useState(() =>
    typeof window === "undefined" ? "" : parseLaunchParams(new URL(window.location.href).searchParams),
  );
  const [launchFiles, setLaunchFiles] = useState<File[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("source") === "share") {
      void fetch("/api/pwa/share", { cache: "no-store" })
        .then((response) => response.json() as Promise<{ text?: string }>)
        .then(({ text }) => {
          if (text) setLaunchText(text);
        })
        .catch(() => toast.error("Shared content could not be opened"));
    }
    if (["source", "shareTitle", "shareText", "shareUrl", "protocol"].some((key) => url.searchParams.has(key))) {
      history.replaceState(null, "", "/playground");
    }

    const launchQueue = (window as typeof window & {
      launchQueue?: { setConsumer: (consumer: (params: LaunchParams) => void) => void };
    }).launchQueue;
    launchQueue?.setConsumer((params) => {
      const handles = params.files?.slice(0, 5) ?? [];
      if (!handles.length) return;
      void Promise.allSettled(handles.map((handle) => handle.getFile())).then((results) => {
        const files = results
          .filter((result): result is PromiseFulfilledResult<File> => result.status === "fulfilled")
          .map((result) => result.value);
        const failed = results.length - files.length;
        if (failed) toast.error(`${failed} file${failed === 1 ? "" : "s"} could not be opened`);
        setLaunchFiles(files);
        setView("chat");
      });
    });
  }, [setView]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="pg-spin size-8 rounded-full border-2 border-ink border-t-exotic" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="relative flex min-w-0 flex-1 flex-col">
        {view === "chat" && (
          <ChatView
            key={activeChat?.id ?? "new"}
            onOpenSidebar={() => setSidebarOpen(true)}
            launchText={launchText}
            launchFiles={launchFiles}
            onLaunchTextConsumed={() => setLaunchText("")}
            onLaunchFilesConsumed={() => setLaunchFiles([])}
          />
        )}
        {view === "artifacts" && <ArtifactsView onBack={() => setView("chat")} />}
        {view === "skills" && <SkillsView onBack={() => setView("chat")} />}
        {view === "projects" && <ProjectsView onBack={() => setView("chat")} />}
        {view === "providers" && <ProvidersView onBack={() => setView("chat")} />}
      </main>
      <ArtifactPanel />
      <SettingsDialog />
      <Toaster position="bottom-right" />
    </div>
  );
}

export function Playground() {
  return (
    <PlaygroundProvider>
      <Shell />
    </PlaygroundProvider>
  );
}
