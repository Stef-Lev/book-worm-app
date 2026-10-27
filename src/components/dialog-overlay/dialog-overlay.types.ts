import type { ReactNode } from "react";

export type DialogOverlayProps = {
  /** "center" for modals, "bottom" for bottom sheets. */
  placement?: "center" | "bottom";
  /** The `Dialog.Content` to render on top of the backdrop. */
  children: ReactNode;
};
