import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MobileNavSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

export function MobileNavSheet({ open, onClose, children, label }: MobileNavSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    function handlePopState() {
      onClose();
    }
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = previousOverflow;
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="mobile-sheet-overlay"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="mobile-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mobile-sheet-panel">
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <div className="mobile-sheet-content">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}
