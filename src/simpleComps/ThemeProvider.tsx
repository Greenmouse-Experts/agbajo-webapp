import type { PropsWithChildren } from "react";

export default function ThemeProvider({
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <>{children}</>;
}
