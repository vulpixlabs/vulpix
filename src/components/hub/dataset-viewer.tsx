"use client";

import { useEffect, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

type Row = { row: Record<string, unknown>; row_idx: number };

export function DatasetViewer({ id }: { id: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchRows = async (off: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/hf/dataset-viewer?dataset=${encodeURIComponent(id)}&offset=${off}&length=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "no preview");
      const r: Row[] = data.rows ?? [];
      setRows(r);
      if (r[0]) setCols(Object.keys(r[0].row));
      else setCols([]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Preview not available");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows(offset); // eslint-disable-line react-hooks/set-state-in-effect
  }, [offset]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && rows.length === 0) {
    return <div className="border-2 border-ink/10 p-6 text-sm text-ink/50">Loading preview…</div>;
  }

  if (err) {
    return (
      <div className="border-2 border-ink/10 p-6">
        <p className="text-sm text-ink/60">Preview not available for this dataset.</p>
        <a
          href={`https://huggingface.co/datasets/${id}/viewer`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-exotic hover:underline"
        >
          View on Hugging Face <ExternalLinkIcon className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink">
      <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-2">
        <span className="label text-ink/50">Preview, first 10 rows</span>
        <a
          href={`https://huggingface.co/datasets/${id}/viewer`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-exotic hover:underline"
        >
          Data Studio <ExternalLinkIcon className="size-3.5" />
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="px-3 py-2 font-mono">#</th>
              {cols.map((c) => (
                <th key={c} className="max-w-[260px] truncate px-3 py-2 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((r) => (
              <tr key={r.row_idx} className="hover:bg-ink/[0.03]">
                <td className="px-3 py-2 font-mono text-ink/50">{r.row_idx}</td>
                {cols.map((c) => (
                  <td key={c} className="max-w-[260px] truncate px-3 py-2">
                    {typeof r.row[c] === "string" ? String(r.row[c]).slice(0, 200) : JSON.stringify(r.row[c])?.slice(0, 200) ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3">
        <button
          disabled={offset === 0 || loading}
          onClick={() => setOffset((o) => Math.max(0, o - 10))}
          className="border-2 border-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-40 hover:bg-ink hover:text-paper"
        >
          Prev
        </button>
        <span className="font-mono text-xs text-ink/50">offset {offset}</span>
        <button
          disabled={loading}
          onClick={() => setOffset((o) => o + 10)}
          className="border-2 border-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-40 hover:bg-ink hover:text-paper"
        >
          Next
        </button>
      </div>
    </div>
  );
}
