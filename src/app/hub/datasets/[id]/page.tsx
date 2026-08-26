import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon, ExternalLinkIcon, FileIcon, HeartIcon } from "lucide-react";
import {
  datasetSize,
  datasetTask,
  formatNum,
  getDataset,
  getReadmeSummary,
  listDatasetTree,
  timeAgo,
  type HFDataset,
} from "@/lib/hf";
import { formatBytes } from "@/lib/brand-logos";
import { CopyButton } from "@/components/hub/copy-button";
import { DatasetActions } from "@/components/hub/dataset-actions";
import { DatasetViewer } from "@/components/hub/dataset-viewer";
import { ReadmeSummary } from "@/components/hub/readme-summary";
import { Avatar } from "@/components/hub/model-card";

export const revalidate = 60;

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);

  let d: HFDataset & { siblings?: { rfilename: string }[]; cardData?: Record<string, unknown> };
  try {
    d = await getDataset(id);
  } catch {
    notFound();
  }

  const [tree, summary] = await Promise.all([listDatasetTree(id), getReadmeSummary(id, "dataset")]);

  const parts = id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : id;
  const license = (d.tags ?? []).find((t) => t.startsWith("license:"))?.replace("license:", "");
  const task = datasetTask(d.tags);
  const size = datasetSize(d.tags);
  const snippet = `# pip install datasets\nfrom datasets import load_dataset\n\nds = load_dataset("${id}")\nprint(ds)`;

  const pills = [
    "dataset",
    task,
    size ? `${size} rows` : null,
    license,
  ].filter(Boolean) as string[];

  const totalSize = tree.reduce((s, f) => s + (f.size || 0), 0);

  return (
    <div data-trail="light" className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10">
      <nav className="label mb-8 flex items-center gap-2 text-ink/40">
        <Link href="/hub" className="hover:text-exotic">
          Hub
        </Link>
        <span>/</span>
        <Link href="/hub?view=datasets" className="hover:text-exotic">
          Datasets
        </Link>
        <span>/</span>
        <span className="text-ink/70">{author || "Dataset"}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-8">
        <div className="flex items-start gap-4">
          <Avatar author={author || undefined} id={id} className="size-14 border-2 border-ink" />
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
                <span key={p} className="border border-ink/15 px-2.5 py-0.5 text-xs text-ink/70">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-ink/70">
          <span className="flex items-center gap-2">
            <DownloadIcon className="size-4 text-exotic" />
            <b className="text-ink">{formatNum(d.downloads)}</b> 30d
          </span>
          {d.downloadsAllTime != null && (
            <span className="flex items-center gap-2">
              <DownloadIcon className="size-4 text-exotic" />
              <b className="text-ink">{formatNum(d.downloadsAllTime)}</b> all-time
            </span>
          )}
          <span className="flex items-center gap-2">
            <HeartIcon className="size-4 text-exotic" />
            <b className="text-ink">{formatNum(d.likes)}</b>
          </span>
        </div>
      </header>

      <div className="mt-6">
        <DatasetActions id={id} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {summary && <ReadmeSummary summary={summary} title="About this dataset" />}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="label text-ink/50">Quickstart, Python</h2>
              <span className="label text-ink/40">via datasets</span>
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
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">{snippet}</pre>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="label text-ink/50">Dataset Viewer</h2>
              <a
                href={`https://huggingface.co/datasets/${id}/viewer`}
                target="_blank"
                rel="noreferrer"
                className="label inline-flex items-center gap-1.5 text-exotic hover:underline"
              >
                Data Studio <ExternalLinkIcon className="size-3.5" />
              </a>
            </div>
            <DatasetViewer id={id} />
          </section>

          <section id="files" className="scroll-mt-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="label text-ink/50">Files & versions</h2>
              <span className="label text-ink/40">
                {(tree.length || d.siblings?.length || 0)} files{totalSize ? ` · ${formatBytes(totalSize)}` : ""}
              </span>
            </div>
            <div className="max-h-[480px] divide-y divide-ink/10 overflow-y-auto border-2 border-ink">
              {(tree.length ? tree : (d.siblings ?? []).map((s) => ({ path: s.rfilename, size: 0, oid: "", type: "blob" }))).map((f) => (
                <div key={f.path} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <FileIcon className="size-4 shrink-0 text-ink/30" />
                    <span className="truncate font-mono text-sm">{f.path}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-xs text-ink/50">{f.size ? formatBytes(f.size) : ""}</span>
                    <a
                      href={`https://huggingface.co/datasets/${id}/resolve/main/${f.path}?download=true`}
                      download
                      className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-1 text-xs font-semibold transition-none hover:border-exotic hover:text-exotic"
                    >
                      <DownloadIcon className="size-3.5" /> Download
                    </a>
                  </span>
                </div>
              ))}
              {tree.length === 0 && (d.siblings?.length ?? 0) === 0 && (
                <p className="px-5 py-6 text-sm text-ink/50">File list unavailable, browse on Hugging Face.</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <CopyButton text={`hf download ${id}`} label="Copy hf download command" />
              <a
                href={`https://huggingface.co/datasets/${id}/tree/main`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-exotic hover:underline"
              >
                Full repo on Hugging Face <ExternalLinkIcon className="size-3.5" />
              </a>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="border-2 border-ink p-5">
            <p className="label mb-4 text-ink/50">Dataset info</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Updated</dt>
                <dd className="font-semibold">{timeAgo(d.lastModified)}</dd>
              </div>
              {task && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Task</dt>
                  <dd className="font-semibold">{task}</dd>
                </div>
              )}
              {size && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Rows</dt>
                  <dd className="font-semibold">{size}</dd>
                </div>
              )}
              {license && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">License</dt>
                  <dd className="font-semibold">{license}</dd>
                </div>
              )}
            </dl>
            <a
              href={`https://huggingface.co/datasets/${id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 border-2 border-ink px-4 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-none hover:bg-exotic hover:text-paper"
            >
              View on Hugging Face
            </a>
          </div>

          {author && (
            <Link
              href={`/hub?view=datasets&q=${encodeURIComponent(author)}`}
              className="block border-2 border-ink/10 p-5 transition-colors duration-75 hover:border-exotic"
            >
              <p className="label mb-2 text-ink/50">More from</p>
              <p className="font-sans text-lg font-bold">{author}</p>
              <p className="mt-1 text-sm text-ink/60">Browse all datasets by this author</p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
