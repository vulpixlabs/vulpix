import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  HeartIcon,
} from "lucide-react";
import {
  formatNum,
  formatParams,
  getModel,
  getReadmeSummary,
  listAdapters,
  listTree,
  timeAgo,
  usageSnippet,
  type HFModel,
} from "@/lib/hf";
import { formatBytes } from "@/lib/brand-logos";
import { CopyButton } from "@/components/hub/copy-button";
import { ModelActions } from "@/components/hub/model-actions";
import { ReadmeSummary } from "@/components/hub/readme-summary";
import { Avatar } from "@/components/hub/model-card";

export const revalidate = 60;

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);

  let m: HFModel & {
    siblings?: { rfilename: string }[];
    cardData?: Record<string, unknown>;
  };
  try {
    m = await getModel(id);
  } catch {
    notFound();
  }

  const [finetunes, quantized, rawTree, summary] = await Promise.all([
    listAdapters(id, "finetune"),
    listAdapters(id, "quantized"),
    listTree(id),
    getReadmeSummary(id, "model"),
  ]);

  const parts = id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : id;
  const paramStr = formatParams(m.safetensors?.total);
  const license = (m.tags ?? []).find((t) => t.startsWith("license:"))?.replace("license:", "");
  const snippet = usageSnippet(id, m.library_name, m.pipeline_tag);

  const pills = [
    m.pipeline_tag,
    m.library_name,
    m.safetensors ? "safetensors" : null,
    license,
    paramStr ? `${paramStr} params` : null,
  ].filter(Boolean) as string[];

  const weightsRank = (path: string): number => {
    if (path === "model.safetensors") return 0;
    if (/^model-\d+-of-\d+\.safetensors$/.test(path)) return 1;
    if (path.endsWith(".safetensors.index.json")) return 2;
    if (path.endsWith("config.json") || path.endsWith("generation_config.json")) return 3;
    if (/tokenizer|merges|vocab|preprocessor|chat_template|special_tokens/.test(path)) return 4;
    if (/^(README|LICENSE|\.gitattributes|crc32)/i.test(path)) return 8;
    return 5;
  };

  const tree = [...rawTree].sort((a, b) => weightsRank(a.path) - weightsRank(b.path));
  const totalSize = tree.reduce((sum, f) => sum + (f.size || 0), 0);

  const single = tree.find((f) => f.path === "model.safetensors");
  const shards = tree.filter((f) => /^model-\d+-of-\d+\.safetensors$/.test(f.path));
  const primaryHref = single
    ? `https://huggingface.co/${id}/resolve/main/${single.path}?download=true`
    : null;

  return (
    <div
      data-trail="light"
      className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10"
    >
      <nav className="label mb-8 flex items-center gap-2 text-ink/40">
        <Link href="/hub" className="hover:text-exotic">Hub</Link>
        <span>/</span>
        <span className="text-ink/70">{author || "Model"}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-8">
        <div className="flex items-start gap-4">
          <Avatar author={author || undefined} id={id} className="size-14" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-4xl leading-tight">
                {author && <span className="text-ink/50">{author}/</span>}
                <span className="font-extrabold">{name}</span>
              </h1>
              <CopyButton text={id} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pills.map((p) => (
                <span
                  key={p}
                  className="border border-ink/15 px-2.5 py-0.5 text-xs text-ink/70"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-ink/70">
          <span className="flex items-center gap-2">
            <DownloadIcon className="size-4 text-exotic" />
            <b className="text-ink">{formatNum(m.downloads)}</b> 30d
          </span>
          {m.downloadsAllTime != null && (
            <span className="flex items-center gap-2">
              <DownloadIcon className="size-4 text-exotic" />
              <b className="text-ink">{formatNum(m.downloadsAllTime)}</b> all-time
            </span>
          )}
          <span className="flex items-center gap-2">
            <HeartIcon className="size-4 text-exotic" />
            <b className="text-ink">{formatNum(m.likes)}</b>
          </span>
        </div>
      </header>

      <div className="mt-6">
        <ModelActions id={id} lib={m.library_name} task={m.pipeline_tag} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {summary && <ReadmeSummary summary={summary} title="About this model" />}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="label text-ink/50">Quickstart, Python</h2>
              <span className="label text-ink/40">colab ready in “use this model”</span>
            </div>
            <div className="border-2 border-exotic bg-exotic text-paper">
              <div className="flex items-center justify-between border-b border-paper/25 px-4 py-2">
                <span className="label text-paper/70">main.py</span>
                <CopyButton
                  text={snippet}
                  label="Copy code"
                  className="inline-flex cursor-pointer items-center gap-1.5 border border-paper/40 px-2.5 py-1 text-xs font-semibold text-paper transition-none hover:border-paper hover:bg-paper hover:text-exotic"
                />
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
                {snippet}
              </pre>
            </div>
          </section>

          <section id="files" className="scroll-mt-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="label text-ink/50">Files & versions</h2>
              <span className="label text-ink/40">
                {tree.length} files · {formatBytes(totalSize)}
              </span>
            </div>
            {(single || shards.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {single && primaryHref && (
                  <a
                    href={primaryHref}
                    download
                    className="inline-flex cursor-pointer items-center gap-2 border-2 border-exotic bg-exotic px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-paper transition-none hover:bg-paper hover:text-exotic"
                  >
                    <DownloadIcon className="size-4" />
                    Download model, {single.path} ({formatBytes(single.size)})
                  </a>
                )}
                {!single && shards.length > 0 && (
                  <CopyButton
                    text={`hf download ${id}`}
                    label={`Copy hf download, ${shards.length} shards (${formatBytes(
                      shards.reduce((s, f) => s + (f.size || 0), 0)
                    )})`}
                    className="inline-flex cursor-pointer items-center gap-2 border-2 border-exotic bg-exotic px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-paper transition-none hover:bg-paper hover:text-exotic"
                  />
                )}
              </div>
            )}
            <div className="max-h-[480px] divide-y divide-ink/10 overflow-y-auto border-2 border-ink">
              {tree.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FileIcon className="size-4 shrink-0 text-ink/30" />
                    <span className="truncate font-mono text-sm">{f.path}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-xs text-ink/50">
                      {formatBytes(f.size)}
                    </span>
                    <a
                      href={`https://huggingface.co/${id}/resolve/main/${f.path}?download=true`}
                      download
                      className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-1 text-xs font-semibold transition-none hover:border-exotic hover:text-exotic"
                    >
                      <DownloadIcon className="size-3.5" /> Download
                    </a>
                  </span>
                </div>
              ))}
              {tree.length === 0 && (
                <p className="px-5 py-6 text-sm text-ink/50">
                  File list unavailable, browse on Hugging Face.
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <CopyButton
                text={`hf download ${id}`}
                label="Copy hf download command"
              />
              <a
                href={`https://huggingface.co/${id}/tree/main`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-exotic hover:underline"
              >
                Full repo on Hugging Face
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </div>
          </section>

          {(finetunes.length > 0 || quantized.length > 0) && (
            <section>
              <h2 className="label mb-4 text-ink/50">Model tree</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Finetunes", finetunes],
                  ["Quantizations", quantized],
                ].map(([label, list]) =>
                  (list as HFModel[]).length > 0 ? (
                    <div key={label as string} className="border-2 border-ink/10 p-5">
                      <p className="mb-3 flex items-center justify-between font-sans text-sm font-bold">
                        {label as string}
                        <span className="text-ink/40">{(list as HFModel[]).length}+</span>
                      </p>
                      <ul className="space-y-2">
                        {(list as HFModel[]).map((f) => (
                          <li key={f.id}>
                            <Link
                              href={`/hub/model/${encodeURIComponent(f.id)}`}
                              className="block truncate font-mono text-xs text-ink/70 hover:text-exotic"
                            >
                              {f.id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border-2 border-ink p-5">
            <p className="label mb-4 text-ink/50">Model info</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Updated</dt>
                <dd className="font-semibold">{timeAgo(m.lastModified)}</dd>
              </div>
              {paramStr && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Params</dt>
                  <dd className="font-semibold">{paramStr}</dd>
                </div>
              )}
              {license && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">License</dt>
                  <dd className="font-semibold">{license}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink/60">Gated</dt>
                <dd className="font-semibold">
                  {m.gated ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            <a
              href={`https://huggingface.co/${id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 border-2 border-ink px-4 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-none hover:bg-exotic hover:text-paper"
            >
              View on Hugging Face
            </a>
          </div>

          {author && (
            <Link
              href={`/hub?q=${encodeURIComponent(author)}`}
              className="block border-2 border-ink/10 p-5 transition-colors duration-75 hover:border-exotic"
            >
              <p className="label mb-2 text-ink/50">More from</p>
              <p className="font-sans text-lg font-bold">{author}</p>
              <p className="mt-1 text-sm text-ink/60">
                Browse all models by this author
              </p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
