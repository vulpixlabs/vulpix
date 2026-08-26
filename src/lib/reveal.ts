import { gsap } from "@/lib/gsap";

export function revealInScope(
  cb: (ctx: gsap.Context) => void,
  scope: React.RefObject<HTMLElement | null>
) {
  return gsap.context(cb, scope);
}
