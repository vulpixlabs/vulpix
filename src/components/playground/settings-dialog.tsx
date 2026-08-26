"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { usePlayground } from "@/lib/playground/store";

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, settings, saveSettings, setView } = usePlayground();
  const [prompt, setPrompt] = useState(settings.customSystemPrompt ?? "");

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ settings, exported: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vulpix-playground-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-h-[90dvh] max-w-[480px] gap-0 overflow-y-auto border-2 border-ink bg-paper p-0 shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:rounded-none">
        <div className="border-b-2 border-ink px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Settings</DialogTitle>
            <DialogDescription>Tuning, defaults and your local data.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Temperature</p>
              <span className="font-mono text-xs text-ink/50">{(settings.temperature ?? 0.7).toFixed(2)}</span>
            </div>
            <Slider
              value={[settings.temperature ?? 0.7]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={([v]) => void saveSettings({ temperature: v })}
              aria-label="Temperature"
              className="mt-3 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-ink/15 [&_[data-slot=slider-range]]:bg-exotic [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-none [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-paper"
            />
            <div className="mt-1 flex justify-between text-[10px] text-ink/40">
              <span>precise</span>
              <span>balanced</span>
              <span>wild</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Max output tokens</p>
              <span className="font-mono text-xs text-ink/50">{settings.maxTokens ? settings.maxTokens : "auto"}</span>
            </div>
            <Slider
              value={[settings.maxTokens ?? 0]}
              min={0}
              max={32768}
              step={1024}
              onValueChange={([v]) => void saveSettings({ maxTokens: v })}
              aria-label="Max output tokens"
              className="mt-3 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-ink/15 [&_[data-slot=slider-range]]:bg-exotic [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-none [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-paper"
            />
          </div>

          <div>
            <p className="text-sm font-bold">
              Custom instructions <span className="font-normal text-ink/40">(appended to system prompt)</span>
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => void saveSettings({ customSystemPrompt: prompt })}
              rows={4}
              placeholder="e.g. I'm a senior TypeScript dev. Skip basics. Always show code in English comments."
              className="mt-2 w-full resize-none border-2 border-ink/20 bg-paper p-3 text-sm outline-none transition-none focus:border-exotic"
            />
          </div>

          <div className="border-2 border-ink">
            <p className="border-b border-ink/10 px-4 py-2.5 text-sm font-bold">Data</p>
            <div className="divide-y divide-ink/10">
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  setView("providers");
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-none hover:bg-exotic/5"
              >
                <span>Manage provider keys</span>
                <span className="text-xs text-ink/40">
                  {Object.values(settings.keys).filter(Boolean).length} connected
                </span>
              </button>
              <button onClick={exportData} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-none hover:bg-exotic/5">
                <span>Export settings</span>
                <span className="text-xs text-ink/40">JSON</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete ALL local playground data (chats, artifacts, keys)? This cannot be undone.")) {
                    void import("idb").then(({ deleteDB }) =>
                      deleteDB("vulpix-playground").then(() => {
                        toast.success("Local data deleted, reloading");
                        setTimeout(() => location.reload(), 800);
                      })
                    );
                  }
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-red-700 transition-none hover:bg-red-50"
              >
                <span className="flex items-center gap-2">
                  <Trash2Icon className="size-4" /> Delete all local data
                </span>
                <span className="text-xs opacity-60">chats · keys · artifacts</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
