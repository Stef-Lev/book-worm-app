import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import styles from "./dialog-overlay.module.css";
import type { DialogOverlayProps } from "./dialog-overlay.types";

export default function DialogOverlay({
  placement = "center",
  children,
}: DialogOverlayProps) {
  return (
    <Portal>
      <Dialog.Backdrop className={styles.backdrop} />
      <Dialog.Positioner className={styles[placement]}>
        {children}
      </Dialog.Positioner>
    </Portal>
  );
}
