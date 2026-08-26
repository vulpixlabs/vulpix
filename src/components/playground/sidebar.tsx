"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FolderIcon,
  LayersIcon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlugIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayground, type PlaygroundView } from "@/lib/playground/store";
import { PROVIDERS } from "@/lib/playground/providers";

const NAV: { id: PlaygroundView; label: string; icon: typeof MessageSquareIcon }[] = [
  { id: "chat", label: "Chats", icon: MessageSquareIcon },
  { id: "projects", label: "Projects", icon: FolderIcon },
  { id: "artifacts", label: "Artifacts", icon: LayersIcon },
  { id: "skills", label: "Skills", icon: SparklesIcon },
  { id: "providers", label: "Providers", icon: PlugIcon },
];

export function Sidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { view, setView, chats, openChat, removeChat, newChat, settings, activeChat } = usePlayground();
  const activeId = activeChat?.id ?? "";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setCollapsed(localStorage.getItem("pg-sidebar-collapsed") === "1"));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("pg-sidebar-collapsed", v ? "0" : "1");
      return !v;
    });
  };

  const connected = Object.entries(settings.keys).filter(([, v]) => v);
  const customCount = (settings.customProviders ?? []).length;
  const totalConnected = connected.length + customCount;
  const providerName = (id: string) => PROVIDERS.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r-2 border-ink bg-paper transition-[width,transform] duration-200 md:relative md:translate-x-0",
          collapsed ? "w-[60px]" : "w-[264px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b-2 border-ink",
            collapsed ? "flex-col gap-3 px-0 pb-4 pt-5" : "h-14 gap-2.5 px-3"
          )}
        >
          <Link
            href="/"
            title="Back to Vulpix"
            className="shrink-0 transition-none hover:opacity-70"
          >
            <Image src="/vulpix-logo.png" alt="Vulpix" width={28} height={28} className="size-7" />
          </Link>
          {!collapsed && (
            <>
              <span className="text-sm font-bold tracking-tight">Playground</span>
              <button
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="ml-auto text-ink/40 transition-none hover:text-exotic"
              >
                <PanelLeftCloseIcon className="size-4.5" />
              </button>
              <button
                className="text-ink/50 hover:text-exotic md:hidden"
                onClick={() => onOpenChange(false)}
                aria-label="Close sidebar"
              >
                <XIcon className="size-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="text-ink/40 transition-none hover:text-exotic"
            >
              <PanelLeftOpenIcon className="size-4.5" />
            </button>
          )}
        </div>

        <div className={cn("p-2", collapsed && "flex justify-center px-0 pt-3")}>
          <button
            onClick={() => {
              newChat();
              setView("chat");
              onOpenChange(false);
            }}
            title="New chat"
            className={cn(
              "flex items-center gap-2 border-2 border-exotic bg-exotic text-sm font-bold text-paper transition-none hover:border-ink hover:bg-ink",
              collapsed ? "size-10 justify-center rounded-full" : "w-full px-3 py-2"
            )}
          >
            <PlusIcon className="size-4 shrink-0" />
            {!collapsed && "New chat"}
          </button>
        </div>

        <nav className={cn("px-2", collapsed && "flex flex-col items-center gap-1 px-0 pt-2")}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={collapsed ? label : undefined}
              onClick={() => {
                setView(id);
                onOpenChange(false);
              }}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-none",
                collapsed ? "size-10 justify-center" : "w-full px-2 py-1.5",
                view === id
                  ? "bg-ink font-semibold text-paper"
                  : "text-ink/70 hover:bg-exotic/5 hover:text-exotic"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <>
            <p className="label mt-5 px-5 text-ink/40">Recents</p>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
              {chats.length === 0 && <p className="px-2 py-2 text-xs text-ink/35">No conversations yet</p>}
              {chats.map((c) => (
                <div key={c.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => {
                      void openChat(c.id);
                      setView("chat");
                      onOpenChange(false);
                    }}
                    className={cn(
                      "min-w-0 flex-1 truncate px-2 py-1.5 text-left text-[13px] transition-none",
                      c.id === activeId
                        ? "bg-exotic/10 font-semibold text-exotic"
                        : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                    )}
                  >
                    {c.title || "Untitled"}
                  </button>
                  <button
                    aria-label="Delete chat"
                    onClick={() => void removeChat(c.id)}
                    className="text-ink/30 opacity-0 transition-none hover:text-exotic group-hover:opacity-100"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {collapsed && <div className="min-h-0 flex-1" />}

        <button
          title={collapsed ? `${totalConnected || "No"} providers` : undefined}
          onClick={() => {
            setView("providers");
            onOpenChange(false);
          }}
          className={cn(
            "flex shrink-0 items-center gap-2.5 border-t-2 border-ink text-left transition-none hover:bg-ink/5",
            collapsed ? "justify-center py-3" : "px-4 py-3"
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              totalConnected ? "bg-emerald-500" : "bg-ink/20"
            )}
          />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {totalConnected ? `${totalConnected} provider${totalConnected > 1 ? "s" : ""}` : "No providers"}
              </span>
              <span className="block truncate text-[11px] text-ink/40">
                {totalConnected
                  ? [...connected.map(([id]) => providerName(id)), ...(settings.customProviders ?? []).map((c) => c.name)].join(", ")
                  : "Connect your API keys"}
              </span>
            </span>
          )}
          {!collapsed && <SettingsIcon className="size-4 shrink-0 text-ink/40" />}
        </button>
      </aside>
    </>
  );
}
