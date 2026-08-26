"use client";

import { useState } from "react";
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

function Shell() {
  const { ready, view, setView, activeChat } = usePlayground();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <ChatView key={activeChat?.id ?? "new"} onOpenSidebar={() => setSidebarOpen(true)} />
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
