"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";
import { ArrowClockwiseIcon, WarningCircleIcon, XIcon, SpinnerGapIcon } from "@phosphor-icons/react";

export function Spinner() { return <SpinnerGapIcon className="spin" size={18} aria-hidden="true" />; }
export function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return <div className="error-state" role="alert"><WarningCircleIcon size={24} aria-hidden="true" /><div><strong>Something needs attention</strong><p>{error.message}</p></div><button className="button secondary" onClick={retry}><ArrowClockwiseIcon size={16} aria-hidden="true" />Try again</button></div>;
}
export function Modal({ open, onClose, title, description, children, busy = false }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode; busy?: boolean }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return <Dialog.Root open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content" onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement; }} onCloseAutoFocus={event => { event.preventDefault(); const target = returnFocus.current?.isConnected ? returnFocus.current : document.querySelector<HTMLElement>("main button"); target?.focus(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => event.preventDefault()}><div className="modal-heading"><div><span className="eyebrow">WORKSPACE MANAGEMENT</span><Dialog.Title>{title}</Dialog.Title></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><XIcon size={20} aria-hidden="true" /></button></div><Dialog.Description className="modal-description">{description}</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function Skeleton({ rows = 4 }: { rows?: number }) { return <div className="skeleton-list" role="status" aria-label="Loading workspace data">{Array.from({ length: rows }, (_, index) => <div className="skeleton-row" key={index}><span /><span /><span /></div>)}</div>; }
