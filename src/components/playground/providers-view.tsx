"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayground } from "@/lib/playground/store";
import { PROVIDERS, type ProviderDef } from "@/lib/playground/providers";
import type { ModelInfo } from "@/app/api/playground/models/route";
import { LogoMark } from "@/components/ui/logo-mark";

function Logo({ name, logo }: { name: string; logo?: string }) {
  return (
    <LogoMark
      name={name}
      src={logo}
      className="size-5 text-[8px]"
      imageClassName="opacity-80"
    />
  );
}

export function ProvidersView({ onBack }: { onBack: () => void }) {
  const { settings, saveSettings, setActiveProvider, setView } = usePlayground();
  const [selectedId, setSelectedId] = useState<string>(PROVIDERS[0].id);
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; error?: string }>(null);
  const [tavily, setTavily] = useState("");
  const [customName, setCustomName] = useState("");
  const [customBase, setCustomBase] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [customResult, setCustomResult] = useState<null | { ok: boolean; error?: string }>(null);
  const [customModels, setCustomModels] = useState<Record<string, ModelInfo[]>>({});

  const customProviders: ProviderDef[] = (settings.customProviders ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    kind: "compatible" as const,
    baseURL: c.baseURL,
    fallbackModels: [],
  }));
  const all: ProviderDef[] = [...PROVIDERS, ...customProviders];
  const current = all.find((p) => p.id === selectedId) ?? PROVIDERS[0];
  const activeId = settings.defaultProvider ?? Object.keys(settings.keys)[0];

  useEffect(() => {
    queueMicrotask(() => {
      setKey(settings.keys[current.id] ?? "");
      setResult(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  useEffect(() => {
    for (const c of customProviders) {
      const ck = settings.keys[c.id];
      if (!ck || customModels[c.id]) continue;
      fetch(`/api/playground/models?provider=custom&base=${encodeURIComponent(c.baseURL ?? "")}`, {
        headers: { "x-pg-key": ck },
      })
        .then((r) => r.json())
        .then((d) => setCustomModels((prev) => ({ ...prev, [c.id]: Array.isArray(d.models) ? d.models : [] })))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.customProviders]);

  const connected = (id: string) => Boolean(settings.keys[id]);
  const isActive = (id: string) => id === activeId;

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/playground/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: current.id, apiKey: key.trim() }),
      });
      const data = await res.json();
      setResult({ ok: Boolean(data.ok), error: data.error });
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    const keys = { ...settings.keys };
    if (key.trim()) keys[current.id] = key.trim();
    else delete keys[current.id];
    await saveSettings({ keys, ...(tavily.trim() ? { tavilyKey: tavily.trim() } : {}) });
    toast.success(`${current.name} ${key.trim() ? "connected" : "disconnected"}, saved to this browser`);
  };

  const activate = async () => {
    if (!connected(current.id) && !current.local) {
      toast.error("Save a key first");
      return;
    }
    let firstModel = current.fallbackModels[0];
    try {
      const res = await fetch(`/api/playground/models?provider=${current.id}`, {
        headers: settings.keys[current.id] ? { "x-pg-key": settings.keys[current.id] } : {},
      });
      const data = await res.json();
      if (Array.isArray(data.models) && data.models[0]?.id) firstModel = data.models[0].id;
    } catch {}
    await setActiveProvider(current.id, firstModel);
    toast.success(`${current.name} set as active provider`);
  };

  const addCustom = async () => {
    const name = customName.trim() || "Custom endpoint";
    const base = customBase.trim().replace(/\/$/, "");
    if (!base) {
      setCustomResult({ ok: false, error: "Base URL required" });
      return;
    }
    if (!/^https?:\/\//.test(base)) {
      setCustomResult({ ok: false, error: "Base URL must start with http(s)://" });
      return;
    }
    setCustomResult(null);
    try {
      const res = await fetch("/api/playground/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "custom", apiKey: customKey.trim(), baseURL: base }),
      });
      const data = await res.json();
      setCustomResult({ ok: Boolean(data.ok), error: data.error });
      if (!data.ok) return;
    } catch {
      setCustomResult({ ok: false, error: "Network error" });
      return;
    }
    const id = `custom-${Date.now().toString(36)}`;
    const next = [...(settings.customProviders ?? []), { id, name, baseURL: base }];
    const keys = { ...settings.keys, [id]: customKey.trim() };
    await saveSettings({ customProviders: next, keys });
    toast.success(`${name} connected`);
    setCustomName("");
    setCustomBase("");
    setCustomKey("");
  };

  const removeCustom = async (id: string) => {
    const keys = { ...settings.keys };
    delete keys[id];
    await saveSettings({
      customProviders: (settings.customProviders ?? []).filter((c) => c.id !== id),
      keys,
    });
    toast.success("Custom endpoint removed");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-ink/10 bg-paper px-4">
        <button onClick={onBack} aria-label="Back" className="text-ink/50 hover:text-exotic">
          <ArrowLeftIcon className="size-4" />
        </button>
        <p className="text-sm font-bold">Providers</p>
        <span className="text-xs text-ink/40">{Object.keys(settings.keys).length} connected · keys stay in this browser</span>
      </header>

      <div className="mx-auto w-full max-w-[860px] p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "relative flex items-center gap-2 border-2 px-3 py-2.5 text-left transition-none",
                current.id === p.id ? "border-exotic bg-exotic/5" : "border-ink/10 hover:border-ink"
              )}
            >
              <Logo name={p.name} logo={p.logo} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{p.name}</span>
              {isActive(p.id) && <span className="shrink-0 bg-exotic px-1 text-[9px] font-black uppercase text-paper">Active</span>}
              {!isActive(p.id) && connected(p.id) && <span className="size-2 shrink-0 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="mt-6 border-2 border-ink p-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold">{current.name} API key</p>
            {current.docs && (
              <a href={current.docs} target="_blank" rel="noreferrer" className="text-xs text-exotic underline underline-offset-2 hover:text-ink">
                Get key ↗
              </a>
            )}
          </div>
          {current.local && (
            <p className="mt-1 text-xs text-ink/50">
              Local runtime, no key needed. Make sure it&apos;s running at <code className="font-mono">{current.baseURL}</code>.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setResult(null);
                }}
                disabled={current.local}
                placeholder={current.local ? "not required" : current.keyPrefix ? `${current.keyPrefix}…` : "Paste API key"}
                className="w-full border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-sm outline-none transition-none focus:border-exotic disabled:bg-ink/5"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide key" : "Show key"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              >
                {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            <button
              onClick={() => void test()}
              disabled={testing || (!key.trim() && !current.local)}
              className="flex items-center gap-1.5 border-2 border-ink px-4 py-2 text-xs font-bold transition-none hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              {testing ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
              Test
            </button>
            <button
              onClick={() => void save()}
              className="border-2 border-exotic bg-exotic px-4 py-2 text-xs font-bold text-paper transition-none hover:border-ink hover:bg-ink"
            >
              {key.trim() ? "Save" : "Remove"}
            </button>
            <button
              onClick={() => void activate()}
              className={cn(
                "border-2 px-4 py-2 text-xs font-bold transition-none",
                isActive(current.id)
                  ? "border-exotic bg-exotic text-paper"
                  : "border-ink/20 text-ink/60 hover:border-exotic hover:text-exotic"
              )}
            >
              {isActive(current.id) ? "Active ✓" : "Set active"}
            </button>
          </div>
          {result && (
            <p className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", result.ok ? "text-emerald-600" : "text-red-600")}>
              {result.ok ? <CheckCircle2Icon className="size-4" /> : <XCircleIcon className="size-4" />}
              {result.ok ? "Key valid, models will load automatically" : result.error ?? "Connection failed"}
            </p>
          )}
          <p className="mt-2 text-[11px] text-ink/40">
            Active provider is what the composer uses, its model list loads automatically, newest first.
          </p>
        </div>

        <div className="mt-6 border-2 border-ink p-5">
          <p className="text-base font-bold">
            Custom endpoint <span className="text-sm font-normal text-ink/40">(any OpenAI-compatible /v1)</span>
          </p>
          <p className="mt-1 text-xs text-ink/50">
            Base URL like <code className="font-mono">https://api.example.com/v1</code>, model list loads from{" "}
            <code className="font-mono">/models</code> automatically.
          </p>
          <div className="mt-3 grid gap-2">
            <input
              value={customBase}
              onChange={(e) => {
                setCustomBase(e.target.value);
                setCustomResult(null);
              }}
              placeholder="https://api.example.com/v1"
              className="w-full border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-sm outline-none transition-none focus:border-exotic"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="API key (if required)"
                className="w-full border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-sm outline-none transition-none focus:border-exotic"
                spellCheck={false}
                autoComplete="off"
              />
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full border-2 border-ink/20 bg-paper px-3 py-2 text-sm outline-none transition-none focus:border-exotic"
              />
            </div>
            <button
              onClick={() => void addCustom()}
              disabled={!customBase.trim()}
              className="w-full border-2 border-ink bg-ink px-3 py-2 text-xs font-bold text-paper transition-none hover:border-exotic hover:bg-exotic disabled:opacity-40"
            >
              Connect endpoint
            </button>
            {customResult && (
              <p className={cn("flex items-center gap-1.5 text-xs font-semibold", customResult.ok ? "text-emerald-600" : "text-red-600")}>
                {customResult.ok ? <CheckCircle2Icon className="size-4" /> : <XCircleIcon className="size-4" />}
                {customResult.ok ? "Endpoint reachable" : customResult.error ?? "Connection failed"}
              </p>
            )}
          </div>

          {(settings.customProviders ?? []).length > 0 && (
            <div className="mt-4 border-t border-ink/10 pt-3">
              <p className="label mb-2 text-ink/40">Connected custom endpoints</p>
              {(settings.customProviders ?? []).map((c) => {
                const count = customModels[c.id]?.length;
                return (
                  <div key={c.id} className="flex items-center gap-2 py-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="min-w-0 shrink-0 text-[13px] font-semibold">{c.name}</span>
                    <span className="hidden truncate font-mono text-[11px] text-ink/40 sm:block">{c.baseURL}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-ink/35">
                      {count != null ? `${count} models` : "…"}
                    </span>
                    <button
                      onClick={() => void activate().then(() => setSelectedId(c.id))}
                      className={cn(
                        "shrink-0 border px-2 py-0.5 text-[10px] font-bold uppercase transition-none",
                        isActive(c.id) ? "border-exotic bg-exotic text-paper" : "border-ink/20 text-ink/60 hover:border-exotic hover:text-exotic"
                      )}
                    >
                      {isActive(c.id) ? "Active" : "Set active"}
                    </button>
                    <button
                      aria-label={`Remove ${c.name}`}
                      onClick={() => void removeCustom(c.id)}
                      className="shrink-0 text-ink/40 hover:text-red-600"
                    >
                      <XCircleIcon className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 border-2 border-ink p-5">
          <p className="text-base font-bold">
            Tavily key <span className="text-sm font-normal text-ink/40">(optional, enables web search)</span>
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={tavily || settings.tavilyKey || ""}
              onChange={(e) => setTavily(e.target.value)}
              placeholder="tvly-…"
              className="flex-1 border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-sm outline-none transition-none focus:border-exotic"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              onClick={() => {
                void saveSettings({ tavilyKey: tavily.trim() || undefined });
                toast.success("Tavily key saved");
              }}
              className="border-2 border-exotic bg-exotic px-4 py-2 text-xs font-bold text-paper transition-none hover:border-ink hover:bg-ink"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink/40">
            Free tier at tavily.com, powers the Web toggle in the composer.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setView("chat")}
            className="border-2 border-exotic bg-exotic px-6 py-2 text-sm font-bold text-paper transition-none hover:border-ink hover:bg-ink"
          >
            Start chatting →
          </button>
        </div>
      </div>
    </div>
  );
}
