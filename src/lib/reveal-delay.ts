import type { CSSProperties } from "react";

/** The delay for the nth piece of a <Reveal>, as a style. Plain (not
 *  client-only) so server components can call it. */
export function delay(ms: number): CSSProperties {
  return { ["--d" as string]: `${ms}ms` };
}
