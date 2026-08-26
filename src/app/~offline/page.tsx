import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-28 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-exotic">Offline</p>
      <h1 className="font-serif text-4xl italic md:text-5xl">No connection.</h1>
      <p className="text-ink/60">
        Vulpix needs the internet for live model data, but pages you already visited
        still work from cache. Reconnect and reload.
      </p>
      <Link
        href="/"
        className="border-2 border-ink bg-exotic px-5 py-2.5 font-bold text-paper shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
      >
        Back home
      </Link>
    </div>
  );
}
