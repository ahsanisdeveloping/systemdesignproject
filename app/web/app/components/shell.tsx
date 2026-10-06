"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { SquaresFourIcon, BuildingsIcon, UsersIcon, IdentificationBadgeIcon, PlugsConnectedIcon, FlowArrowIcon, ArrowUpRightIcon, CaretRightIcon, ListIcon, XIcon, CommandIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { api } from "../../lib/api";

const navigation = [
  { href: "/", label: "Overview", icon: SquaresFourIcon },
  { href: "/organizations", label: "Organizations", icon: BuildingsIcon },
  { href: "/users", label: "People", icon: UsersIcon },
  { href: "/memberships", label: "Memberships", icon: IdentificationBadgeIcon },
  { href: "/integrations", label: "Integrations", icon: PlugsConnectedIcon },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    const elements = sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    elements?.[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenu(false); return; }
      if (event.key !== "Tab" || !elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); if (previous.isConnected) previous.focus(); };
  }, [menu]);
  const [connection, setConnection] = useState<"checking" | "connected" | "offline">("checking");
  const [check, setCheck] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ database: string }>("/health", { signal: controller.signal }).then(
      result => { if (!controller.signal.aborted) setConnection(result.database === "connected" ? "connected" : "offline"); },
      () => { if (!controller.signal.aborted) setConnection("offline"); },
    );
    return () => controller.abort();
  }, [check]);
  const label = navigation.find(item => item.href === pathname)?.label ?? "Workspace";
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    <aside ref={sidebarRef} className={`sidebar ${menu ? "is-open" : ""}`} role={menu ? "dialog" : undefined} aria-modal={menu || undefined} aria-label="Workspace navigation">
      <Link className="brand" href="/" onClick={() => setMenu(false)}><span className="brand-mark"><CommandIcon weight="bold" size={24} aria-hidden="true" /></span><span>eris<span className="brand-period">.</span><small>WORKSPACE</small></span></Link>
      <div className="workspace-switch"><span className="workspace-monogram">E</span><div><strong>Eris workspace</strong><small>Organization management</small></div></div>
      <span className="nav-label">WORKSPACE</span>
      <nav>{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${pathname === href ? "active" : ""}`} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenu(false)}><Icon size={20} weight={pathname === href ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span>{pathname === href && <span className="nav-active-mark" />}</Link>)}</nav>
      <div className="nav-future"><span className="nav-label">BUILD WHAT’S NEXT</span><div><FlowArrowIcon size={20} aria-hidden="true" /><span>Workflows</span><small>Planned</small></div></div>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="eyebrow">ROOM TO GROW</span><strong>Your workspace.<br />Your next possibility.</strong><p>A foundation for people, workflows, and connected tools.</p><Link href="/integrations" onClick={() => setMenu(false)}>Explore what’s next<ArrowUpRightIcon size={16} aria-hidden="true" /></Link></div><div className="workspace-footer"><span className="workspace-monogram">E</span><div><strong>Local workspace</strong><small>Development environment</small></div></div></div>
    </aside>
    {menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <div className="workspace-main"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label={menu ? "Close navigation" : "Open navigation"} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <XIcon size={22} /> : <ListIcon size={22} />}</button><span>Workspace</span><CaretRightIcon size={12} aria-hidden="true" /><strong>{label}</strong></div><div className="topbar-right"><button className={`connection ${connection}`} onClick={() => { setConnection("checking"); setCheck(value => value + 1); }} title="Check API connection"><span className="status-dot" />{connection === "connected" ? "API connected" : connection === "offline" ? "API offline" : "Checking connection"}<ArrowClockwiseIcon size={12} aria-hidden="true" /></button><span className="environment">LOCAL</span></div></header><main id="main-content" className="content" tabIndex={-1}>{children}</main><footer className="page-footer"><span>Built for a more connected workspace.</span><span>Eris / Workspace console</span></footer></div>
  </div>;
}
