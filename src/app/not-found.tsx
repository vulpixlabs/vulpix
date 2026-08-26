import type { Metadata } from "next";
import { NotFoundClient } from "@/components/not-found-client";

export const metadata: Metadata = {
  title: "404",
};

export default function NotFound() {
  return <NotFoundClient />;
}
