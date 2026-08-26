import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground, Vulpix",
  description: "Chat with 26 providers, 10 skills, your keys.",
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh overflow-hidden bg-paper">{children}</div>;
}
