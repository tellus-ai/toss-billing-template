import { useEffect, useRef, type ReactNode } from 'react';

type ConfirmDialogProps = Readonly<{
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** 없으면 확인 버튼만 있는 안내 대화상자가 됩니다. */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/** 브라우저 기본 `<dialog>`로 확인을 받습니다. 포커스 가두기와 Esc 닫기를 브라우저가 처리합니다. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="dialog-title">{title}</h2>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        {cancelLabel !== undefined && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
