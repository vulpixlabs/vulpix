"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  ImageIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SquareIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { Command as CmdkRoot, CommandList, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { MODES, SKILLS } from "@/lib/playground/skills";
import { providerById, type ProviderDef } from "@/lib/playground/providers";
import type { ModelInfo } from "@/app/api/playground/models/route";
import type { FileUIPart } from "ai";

export interface Attachment {
  id: string;
  name: string;
  kind: "image" | "text";
  mediaType?: string;
  dataUrl?: string;
  text?: string;
}

const modelCache = new Map<string, ModelInfo[]>();

function useModels(provider: string, keys: Record<string, string>, providers: ProviderDef[]) {
  const apiKey = keys[provider];
  const isCustom = provider.startsWith("custom-");
  const base = providers.find((x) => x.id === provider)?.baseURL ?? "";
  const cacheKey = `${provider}:${apiKey ? "k" : "pub"}`;
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");

  if (loadedKey !== cacheKey) {
    setLoadedKey(cacheKey);
    const cached = modelCache.get(cacheKey);
    if (cached) setModels(cached);
  }

  useEffect(() => {
    if (modelCache.has(cacheKey)) return;
    let alive = true;
    queueMicrotask(() => alive && setLoading(true));
    const url = isCustom
      ? `/api/playground/models?provider=custom&base=${encodeURIComponent(base)}`
      : `/api/playground/models?provider=${provider}`;
    fetch(url, {
      headers: apiKey ? { "x-pg-key": apiKey } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list: ModelInfo[] = Array.isArray(d.models) ? d.models : [];
        modelCache.set(cacheKey, list);
        setModels(list);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [cacheKey, provider, apiKey, isCustom, base]);
  return { models, loading };
}

function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    queueMicrotask(() => setSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition)));
  }, []);

  const toggle = useCallback(
    (onResult: (text: string, isFinal: boolean) => void) => {
      const w = window as unknown as {
        SpeechRecognition?: new () => never;
        webkitSpeechRecognition?: new () => never;
      };
      const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
        | (new () => {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
            onend: (() => void) | null;
            onerror: (() => void) | null;
            start: () => void;
            stop: () => void;
          })
        | undefined;
      if (!SR) return;
      if (listening) {
        (recRef.current as { stop: () => void } | null)?.stop();
        setListening(false);
        return;
      }
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          onResult(e.results[i][0].transcript, e.results[i].isFinal);
        }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    },
    [listening]
  );

  return { supported, listening, toggle };
}

export interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, files: FileUIPart[]) => void;
  onStop: () => void;
  busy: boolean;
  mode: string;
  onMode: (m: string) => void;
  skill: string | null;
  onSkill: (id: string | null) => void;
  provider: string;
  onProvider: (p: string) => void;
  model: string;
  onModel: (m: string) => void;
  webSearch: boolean;
  onWebSearch: (v: boolean) => void;
  hasTavily: boolean;
  onNeedSetup: () => void;
  keys: Record<string, string>;
  providers: ProviderDef[];
}

export function Composer(p: ComposerProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [picker, setPicker] = useState<null | "model" | "slash" | "plus">(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight?: number } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { models, loading } = useModels(p.provider, p.keys, p.providers);
  const { supported: sttSupported, listening, toggle: toggleSpeech } = useSpeech();
  const provider = providerById(p.provider) ?? p.providers.find((x) => x.id === p.provider);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!picker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPicker(null);
        setAnchor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picker]);

  useEffect(() => {
    if (!models.length || models.some((m) => m.id === p.model)) return;
    queueMicrotask(() => p.onModel(models[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(200, ta.scrollHeight)}px`;
  }, [p.value]);

  const openSlash = () => {
    const r = taRef.current?.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, bottom: window.innerHeight - r.top + 8, width: Math.max(360, r.width) });
    setPicker("slash");
    setPickerQuery("/");
  };

  const closeSlash = () => {
    setPicker(null);
    setAnchor(null);
  };

  const openPlus = (btn: HTMLElement) => {
    const r = btn.getBoundingClientRect();
    setAnchor({ left: r.left, top: r.bottom + 8, width: 260, maxHeight: Math.max(160, window.innerHeight - r.bottom - 24) });
    setPicker("plus");
  };

  const openModel = (btn: HTMLElement) => {
    const r = btn.getBoundingClientRect();
    const top = r.bottom + 8;
    setAnchor({
      left: Math.max(8, Math.min(r.right - 380, window.innerWidth - 388)),
      top,
      width: 380,
      maxHeight: Math.max(200, Math.min(380, window.innerHeight - top - 16)),
    });
    setPicker("model");
    setPickerQuery("");
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 5)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((res) => {
          const fr = new FileReader();
          fr.onload = () => res(String(fr.result));
          fr.readAsDataURL(file);
        });
        setAttachments((prev) => [...prev, { id, name: file.name, kind: "image", mediaType: file.type, dataUrl }]);
      } else if (file.size < 200_000) {
        const text = await file.text();
        setAttachments((prev) => [...prev, { id, name: file.name, kind: "text", text }]);
      } else {
        setAttachments((prev) => [...prev, { id, name: `${file.name} (too large, skipped)`, kind: "text", text: "" }]);
      }
    }
    setPicker(null);
  };

  const submit = () => {
    if (p.busy) return;
    const textFiles = attachments.filter((a) => a.kind === "text" && a.text);
    const images = attachments.filter((a) => a.kind === "image" && a.dataUrl);
    const appended = textFiles.map((f) => `\n\n--- Attached file: ${f.name} ---\n${f.text}`).join("");
    const finalText = `${p.value}${appended}`.trim();
    const files: FileUIPart[] = images.map((img) => ({
      type: "file",
      mediaType: img.mediaType ?? "image/png",
      url: img.dataUrl!,
    }));
    if (!finalText && files.length === 0) return;
    p.onSend(finalText, files);
    setAttachments([]);
  };

  const filteredSkills = SKILLS.filter(
    (s) =>
      !pickerQuery.slice(1) ||
      s.name.toLowerCase().includes(pickerQuery.slice(1).toLowerCase()) ||
      s.id.includes(pickerQuery.slice(1).toLowerCase())
  );

  const filteredModels = models.filter(
    (m) =>
      !pickerQuery ||
      m.id.toLowerCase().includes(pickerQuery.toLowerCase()) ||
      (m.name ?? "").toLowerCase().includes(pickerQuery.toLowerCase())
  );

  const modelLabel = models.find((m) => m.id === p.model)?.name ?? p.model;
  const canSend = Boolean(p.value.trim() || attachments.length);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-4">
      <div className="relative flex flex-col border-2 border-ink bg-paper shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus-within:border-exotic">
        {picker === "slash" && mounted && anchor && createPortal(
          <div className="fixed inset-0 z-[60]" onClick={closeSlash}>
            <div
              className="absolute border-2 border-ink bg-paper shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
              style={{ left: anchor.left, bottom: anchor.bottom, width: anchor.width }}
              onClick={(e) => e.stopPropagation()}
            >
              <CmdkRoot shouldFilter={false} className="outline-none">
                <CommandList className="max-h-[300px] overflow-y-auto p-1">
                  <p className="label px-2 py-1.5 text-ink/40">Skills, activate for this chat</p>
                  {filteredSkills.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => {
                        p.onSkill(p.skill === s.id ? null : s.id);
                        closeSlash();
                        p.onChange("");
                        taRef.current?.focus();
                      }}
                      className="cursor-pointer gap-2 px-2 py-2"
                    >
                      <ZapIcon className={cn("size-4 shrink-0", p.skill === s.id ? "text-exotic" : "text-ink/30")} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          /{s.id} <span className="ml-1 font-normal text-ink/40">{s.source}</span>
                        </p>
                        <p className="truncate text-xs text-ink/50">{s.description}</p>
                      </div>
                      {p.skill === s.id && <CheckIcon className="ml-auto size-4 text-exotic" />}
                    </CommandItem>
                  ))}
                  {filteredSkills.length === 0 && (
                    <p className="px-3 py-4 text-sm text-ink/40">No skill matches “{pickerQuery.slice(1)}”</p>
                  )}
                </CommandList>
              </CmdkRoot>
            </div>
          </div>,
          document.body
        )}

        {picker === "plus" && mounted && anchor && createPortal(
          <div className="fixed inset-0 z-[60]" onClick={() => setPicker(null)}>
            <div
              className="absolute border-2 border-ink bg-paper shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
              style={{ left: anchor.left, top: anchor.top, width: anchor.width, maxHeight: anchor.maxHeight }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setPicker(null);
                  imageRef.current?.click();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold transition-none hover:bg-exotic/5 hover:text-exotic"
              >
                <ImageIcon className="size-4" /> Upload photo
              </button>
              <button
                onClick={() => {
                  setPicker(null);
                  fileRef.current?.click();
                }}
                className="flex w-full items-center gap-2.5 border-t border-ink/10 px-3 py-2.5 text-left text-sm font-semibold transition-none hover:bg-exotic/5 hover:text-exotic"
              >
                <FileTextIcon className="size-4" /> Upload file
              </button>
              <p className="border-t border-ink/10 px-3 py-2 text-[11px] text-ink/40">
                Images go to vision models · text files are inlined
              </p>
            </div>
          </div>,
          document.body
        )}

        <input
          ref={imageRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.markdown,.json,.csv,.ts,.tsx,.js,.jsx,.py,.rs,.go,.java,.c,.cpp,.html,.css,.sql,.yaml,.yml,.xml,.sh"
          multiple
          hidden
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="order-3 flex items-center gap-1.5 px-2.5 pb-2 pt-1">
          <button
            onClick={(e) => {
              if (picker === "plus") setPicker(null);
              else openPlus(e.currentTarget);
            }}
            aria-label="Add attachment"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border transition-none",
              picker === "plus" || attachments.length
                ? "border-exotic bg-exotic text-paper"
                : "border-ink/25 text-ink/60 hover:border-exotic hover:text-exotic"
            )}
          >
            <PlusIcon className="size-4" />
          </button>

          <span className="ml-auto" />

          <button
            onClick={(e) => {
              if (!p.keys[p.provider] && !provider?.local) {
                p.onNeedSetup();
                return;
              }
              if (picker === "model") setPicker(null);
              else openModel(e.currentTarget);
            }}
            className="flex h-7 max-w-[220px] shrink-0 items-center gap-1 border border-ink/15 px-2 text-xs font-semibold text-ink/70 transition-none hover:border-exotic hover:text-exotic"
          >
            <span className="truncate">{modelLabel}</span>
            <ChevronDownIcon className="size-3.5 shrink-0" />
          </button>

          {picker === "model" && mounted && anchor && createPortal(
            <div className="fixed inset-0 z-[60]" onClick={() => setPicker(null)}>
              <div
                className="absolute max-w-[calc(100vw-1rem)] border-2 border-ink bg-paper shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                style={{ left: anchor.left, top: anchor.top, width: anchor.width, maxHeight: anchor.maxHeight }}
                onClick={(e) => e.stopPropagation()}
              >
                <CmdkRoot shouldFilter={false} className="flex max-h-full flex-col outline-none">
                  <div className="border-b border-ink/10 p-1">
                    <input
                      autoFocus
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder={`Search ${provider?.name ?? ""} models…`}
                      className="w-full bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink/30"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setPicker(null);
                        if (e.key === "Enter" && filteredModels[0]) {
                          p.onModel(filteredModels[0].id);
                          setPicker(null);
                          setPickerQuery("");
                        }
                      }}
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-1">
                    {loading && <p className="px-3 py-3 text-sm text-ink/40">Loading models…</p>}
                    {!loading && !p.keys[p.provider] && !provider?.local && (
                      <div className="px-3 py-4">
                        <p className="text-sm text-ink/50">No key yet, models load automatically once connected.</p>
                        <button
                          onClick={() => {
                            setPicker(null);
                            p.onNeedSetup();
                          }}
                          className="mt-2 border-2 border-exotic bg-exotic px-3 py-1.5 text-xs font-bold text-paper hover:border-ink hover:bg-ink"
                        >
                          Open Providers
                        </button>
                      </div>
                    )}
                    {filteredModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          p.onModel(m.id);
                          setPicker(null);
                          setPickerQuery("");
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-none hover:bg-exotic/5",
                          m.id === p.model && "text-exotic"
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{m.name ?? m.id}</span>
                        {m.contextLength ? (
                          <span className="shrink-0 font-mono text-[10px] text-ink/35">
                            {Math.round(m.contextLength / 1000)}k
                          </span>
                        ) : null}
                        {m.id === p.model && <CheckIcon className="size-3.5 shrink-0" />}
                      </button>
                    ))}
                    {!loading && filteredModels.length === 0 && (p.keys[p.provider] || provider?.local) && (
                      <p className="px-3 py-3 text-sm text-ink/40">No models found</p>
                    )}
                  </div>
                  <p className="shrink-0 border-t border-ink/10 px-3 py-1.5 text-[10px] text-ink/35">
                    {models.length} models · auto-loaded from {provider?.name} · switch provider in the sidebar
                  </p>
                </CmdkRoot>
              </div>
            </div>,
            document.body
          )}

          {sttSupported && (
            <button
              onClick={() =>
                toggleSpeech((text: string, isFinal: boolean) => {
                  p.onChange(isFinal ? `${p.value} ${text}`.trimStart() : p.value);
                })
              }
              aria-label={listening ? "Stop dictation" : "Start dictation"}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border transition-none",
                listening
                  ? "animate-pulse border-exotic bg-exotic text-paper"
                  : "border-ink/25 text-ink/60 hover:border-exotic hover:text-exotic"
              )}
            >
              <MicIcon className="size-3.5" />
            </button>
          )}

          {p.busy ? (
            <button
              onClick={p.onStop}
              aria-label="Stop generating"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-exotic bg-exotic text-paper transition-none hover:border-ink hover:bg-ink"
            >
              <SquareIcon className="size-3 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-exotic bg-exotic text-paper transition-none hover:border-ink hover:bg-ink disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/30"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          )}
        </div>

        <textarea
          ref={taRef}
          value={p.value}
          onChange={(e) => {
            p.onChange(e.target.value);
            if (e.target.value === "/") {
              openSlash();
            } else if (picker === "slash") {
              if (!e.target.value.startsWith("/")) closeSlash();
              else setPickerQuery(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (picker === "slash") return;
              submit();
            }
            if (e.key === "Escape") {
              if (picker) {
                closeSlash();
                setPicker(null);
              } else if (p.busy) p.onStop();
            }
          }}
          onPaste={(e) => {
            const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
            if (imgs.length) {
              e.preventDefault();
              void addFiles(e.clipboardData.files);
            }
          }}
          rows={1}
          placeholder={p.skill ? `Message with /${p.skill} skill…` : "How can I help you today?"}
          className="order-1 block max-h-[200px] w-full resize-none overflow-y-auto bg-transparent px-4 pt-3 text-[15px] leading-relaxed outline-none placeholder:text-ink/35"
        />

        {attachments.length > 0 && (
          <div className="order-2 flex flex-wrap gap-1.5 px-3 pb-1 pt-1">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="flex max-w-[220px] items-center gap-1.5 border border-ink/15 bg-ink/[0.04] px-2 py-1 text-[11px] font-semibold text-ink/70"
              >
                {a.kind === "image" ? <ImageIcon className="size-3 shrink-0 text-exotic" /> : <FileTextIcon className="size-3 shrink-0 text-exotic" />}
                <span className="truncate">{a.name}</span>
                <button
                  aria-label={`Remove ${a.name}`}
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  className="text-ink/40 hover:text-exotic"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="order-4 flex items-center gap-2 px-3 pb-2 pt-0.5">
          {p.hasTavily && (
            <button
              onClick={() => p.onWebSearch(!p.webSearch)}
              title="Web search (Tavily)"
              className={cn(
                "flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-none",
                p.webSearch
                  ? "border-exotic bg-exotic text-paper"
                  : "border-ink/15 text-ink/50 hover:border-exotic hover:text-exotic"
              )}
            >
              Web
            </button>
          )}
          <span className="ml-auto hidden items-center gap-1 text-[10px] text-ink/30 sm:flex">
            <PaperclipIcon className="size-3" /> paste or + to attach · / for skills
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => p.onMode(m.id)}
            className={cn(
              "border px-3 py-1 text-xs font-semibold transition-none",
              p.mode === m.id
                ? "border-exotic bg-exotic text-paper"
                : "border-ink/15 bg-paper text-ink/60 hover:border-exotic hover:text-exotic"
            )}
          >
            {m.label}
          </button>
        ))}
        {p.skill && (
          <button
            onClick={() => p.onSkill(null)}
            title="Remove skill"
            className="flex items-center gap-1 border border-exotic bg-exotic/10 px-3 py-1 text-xs font-bold text-exotic transition-none hover:border-ink hover:bg-ink hover:text-paper"
          >
            <ZapIcon className="size-3" />/{p.skill} <XIcon className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
