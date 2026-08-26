"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { AlertTriangleIcon, MenuIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlayground } from "@/lib/playground/store";
import { MODES, buildSystemPrompt, SKILLS } from "@/lib/playground/skills";
import { PROVIDERS, providerById, type ProviderDef } from "@/lib/playground/providers";
import { Message } from "@/components/playground/message";
import { Composer } from "@/components/playground/composer";
import { Thinking } from "@/components/playground/thinking";
import RotatingText from "@/components/playground/rotating-text";

const SUGGESTIONS = [
  "Explain diffusion models like I'm a designer",
  "Review this idea: a CLI that audits npm deps for abandoned packages",
  "Write a launch tweet for an open-source vector DB",
  "What changed in open-source LLMs recently?",
];

const GREETING_WORDS = ["mind?", "idea?", "plan?", "problem?", "project?"];

export function ChatView({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const {
    activeChat,
    updateActiveChat,
    createChat,
    settings,
    setView,
    addArtifact,
    setArtifact,
  } = usePlayground();

  const [mode, setMode] = useState(activeChat?.mode ?? "default");
  const [skill, setSkill] = useState<string | null>(activeChat?.skillId ?? null);
  const [provider, setProvider] = useState(
    activeChat?.provider ?? settings.defaultProvider ?? Object.keys(settings.keys)[0] ?? "openrouter"
  );
  const [model, setModel] = useState(
    activeChat?.model ?? settings.defaultModel ?? providerById(provider)?.fallbackModels[0] ?? ""
  );
  const [webSearch, setWebSearch] = useState(false);
  const [input, setInput] = useState("");
  const [pinned, setPinned] = useState(true);

  const customProviders: ProviderDef[] = (settings.customProviders ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    kind: "compatible" as const,
    baseURL: c.baseURL,
    fallbackModels: [],
  }));

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatId = activeChat?.id ?? null;
  const savedRef = useRef<string | null>(null);

  const { messages, sendMessage, status, stop, regenerate, setMessages, error } = useChat({
    messages: activeChat?.messages ?? [],
    transport: new DefaultChatTransport({ api: "/api/playground/chat" }),
    onError: (e) => toast.error(e.message.slice(0, 160)),
  });

  const busy = status === "submitted" || status === "streaming";
  const apiKey = settings.keys[provider];
  const providerDef = providerById(provider) ?? customProviders.find((x) => x.id === provider);
  const allProviders: ProviderDef[] = [...PROVIDERS, ...customProviders];

  const persist = useCallback(
    (msgs: UIMessage[]) => {
      if (!chatId || msgs.length === 0) return;
      const key = `${chatId}:${msgs.length}:${msgs[msgs.length - 1]?.id ?? ""}`;
      if (savedRef.current === key) return;
      savedRef.current = key;
      const first = typeof msgs[0]?.parts?.[0] === "object" && msgs[0].parts[0].type === "text"
        ? (msgs[0].parts[0] as { text: string }).text
        : "";
      updateActiveChat({
        messages: msgs,
        title: activeChat?.title || first.slice(0, 60) || "Untitled",
        mode,
        skillId: skill ?? undefined,
        provider,
        model,
      });
    },
    [chatId, updateActiveChat, activeChat?.title, mode, skill, provider, model]
  );

  useEffect(() => {
    if (!busy && messages.length > 0) persist(messages);
  }, [busy, messages, persist]);

  useEffect(() => {
    const onSkill = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setSkill(id);
      setMode(SKILLS.find((s) => s.id === id)?.modes[0] ?? "default");
    };
    window.addEventListener("pg:skill", onSkill);
    return () => window.removeEventListener("pg:skill", onSkill);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinned) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pinned, busy]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  };

  const send = async (text?: string, files?: FileUIPart[]) => {
    const value = (text ?? input).trim();
    if ((!value && !files?.length) || busy) return;
    if (!settings.keys[provider] && !providerDef?.local) {
      setView("providers");
      return;
    }
    setInput("");
    setPinned(true);
    if (!chatId) {
      await createChat({
        title: value.slice(0, 60),
        mode,
        skillId: skill ?? undefined,
        provider,
        model,
      });
    }
    void sendMessage(
      { text: value, ...(files?.length ? { files } : {}) },
      {
        body: {
          provider,
          model,
          apiKey,
          ...(provider.startsWith("custom-") ? { baseURL: providerDef?.baseURL } : {}),
          system: buildSystemPrompt(mode, skill ?? undefined, settings.customSystemPrompt),
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          tavilyKey: webSearch ? settings.tavilyKey : undefined,
        },
      }
    );
  };

  const editAndResend = (text: string) => {
    if (!chatId) return;
    const idx = messages.length - 1;
    const kept = messages.slice(0, Math.max(0, idx));
    setMessages(kept);
    send(text);
  };

  const openArtifact = (code: string, lang: string) => {
    void addArtifact({
      chatId: chatId ?? "adhoc",
      title: code.trim().split("\n")[0].slice(0, 60) || `${lang} snippet`,
      kind: "code",
      language: lang,
      content: code,
    }).then((rec) => setArtifact(rec));
  };

  const hasMessages = messages.length > 0;
  const activeSkill = SKILLS.find((s) => s.id === skill);
  const lastMsg = messages[messages.length - 1];
  const thinking = status === "submitted" || (status === "streaming" && !lastMsg?.parts?.some((p) => p.type === "text"));

  if (!hasMessages) {
    return (
      <div className="flex h-full flex-col overflow-y-auto" data-pg-root>
        <div className="flex items-center gap-2 px-4 pt-4 md:hidden">
          <button onClick={onOpenSidebar} aria-label="Open menu" className="text-ink/60 hover:text-exotic">
            <MenuIcon className="size-5" />
          </button>
        </div>
        <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center px-4 pb-10">
          <h1 className="flex flex-wrap items-center justify-center gap-x-3 text-center font-serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
            <Image src="/vulpix-logo.png" alt="" width={56} height={56} className="size-11 md:size-14" />
            <span>
              What&apos;s on your{" "}
              <RotatingText
                texts={GREETING_WORDS}
                rotationInterval={2200}
                staggerDuration={0.025}
                splitBy="characters"
                mainClassName="text-exotic italic inline-flex"
                elementLevelClassName="will-change-transform"
              />
            </span>
          </h1>
          <p className="mt-2 text-sm text-ink/45">
            26+ providers · 10 skills · your keys, your data
          </p>
          <div className="mt-8 w-full">
            <Composer
              value={input}
              onChange={setInput}
              onSend={(text, files) => void send(text, files)}
              onStop={stop}
              busy={busy}
              mode={mode}
              onMode={setMode}
              skill={skill}
              onSkill={setSkill}
              provider={provider}
              onProvider={setProvider}
              model={model}
              onModel={setModel}
              webSearch={webSearch}
              onWebSearch={setWebSearch}
              hasTavily={Boolean(settings.tavilyKey)}
              onNeedSetup={() => setView("providers")}
              keys={settings.keys}
              providers={allProviders}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="border border-ink/15 bg-paper px-3 py-1.5 text-xs text-ink/60 transition-none hover:border-exotic hover:text-exotic"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-pg-root>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink/10 px-4">
        <button onClick={onOpenSidebar} aria-label="Open menu" className="text-ink/60 hover:text-exotic md:hidden">
          <MenuIcon className="size-5" />
        </button>
        <p className="min-w-0 truncate text-sm font-semibold">
          {activeChat?.title || "New chat"}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          {activeSkill && (
            <span className="hidden border border-exotic bg-exotic/10 px-2 py-0.5 text-[11px] font-bold text-exotic sm:inline">
              /{activeSkill.id}
            </span>
          )}
          <span className="hidden border border-ink/15 px-2 py-0.5 font-mono text-[11px] text-ink/50 sm:inline">
            {providerDef?.name}: {model}
          </span>
          <span className="hidden border border-ink/15 px-2 py-0.5 text-[11px] font-semibold text-ink/50 lg:inline">
            {MODES.find((m) => m.id === mode)?.label}
          </span>
          <button
            onClick={() => setMessages([])}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="text-ink/40 hover:text-exotic"
          >
            <RotateCcwIcon className="size-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7">
          {messages.map((m, i) => (
            <Message
              key={m.id}
              message={m}
              isLast={i === messages.length - 1}
              streaming={status === "streaming"}
              thinking={thinking && i === messages.length - 1}
              onRegenerate={() => void regenerate()}
              onEdit={editAndResend}
              onOpenArtifact={openArtifact}
            />
          ))}
          {error && (
            <div className="flex max-w-[720px] items-start gap-2.5 border-2 border-red-600/60 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Request failed</p>
                <p className="mt-0.5 break-words text-[13px] opacity-80">{error.message}</p>
                <button
                  onClick={() => void regenerate()}
                  className="mt-2 border border-red-600 px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {thinking && <Thinking />}
        </div>
      </div>

      {!pinned && (
        <button
          onClick={() => {
            setPinned(true);
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
          }}
          className={cn(
            "absolute bottom-36 left-1/2 z-10 -translate-x-1/2 border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:border-exotic hover:text-exotic"
          )}
        >
          ↓ Jump to latest
        </button>
      )}

      <Composer
        value={input}
        onChange={setInput}
        onSend={(text, files) => void send(text, files)}
        onStop={stop}
        busy={busy}
        mode={mode}
        onMode={setMode}
        skill={skill}
        onSkill={setSkill}
        provider={provider}
        onProvider={setProvider}
        model={model}
        onModel={setModel}
        webSearch={webSearch}
        onWebSearch={setWebSearch}
        hasTavily={Boolean(settings.tavilyKey)}
        onNeedSetup={() => setView("providers")}
        keys={settings.keys}
        providers={allProviders}
      />
    </div>
  );
}
