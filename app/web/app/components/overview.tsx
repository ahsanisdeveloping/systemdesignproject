"use client";
import Link from "next/link";
import { BuildingsIcon, UsersIcon, IdentificationBadgeIcon, ArrowUpRightIcon, ArrowRightIcon, PlusIcon, CheckIcon, ArrowClockwiseIcon, PlugsConnectedIcon, FlowArrowIcon } from "@phosphor-icons/react";
import { directory, dateLabel, initials, type User, type Organization, type Membership } from "../../lib/api";
import { useRemote } from "../../lib/use-remote";
import { ErrorState, Skeleton } from "./ui";

async function loadSnapshot(signal: AbortSignal) {
  const [users, organizations] = await Promise.all([directory<User>("/users", signal), directory<Organization>("/organizations", signal)]);
  let memberships = 0;
  const sizes: Record<string, number> = {};
  for (let start = 0; start < organizations.length; start += 4) {
    await Promise.all(organizations.slice(start, start + 4).map(async organization => {
      const members = await directory<Membership>(`/organizations/${organization.id}/members`, signal);
      sizes[organization.id] = members.length;
      memberships += members.length;
    }));
  }
  return { users, organizations, memberships, sizes };
}
export function Overview() {
  const { data, error, loading, refresh } = useRemote("overview", loadSnapshot);
  const stats = [
    { label: "Organizations", value: data?.organizations.length, icon: BuildingsIcon, description: "Spaces for your teams", href: "/organizations" },
    { label: "People", value: data?.users.length, icon: UsersIcon, description: "People in your directory", href: "/users" },
    { label: "Memberships", value: data?.memberships, icon: IdentificationBadgeIcon, description: "Connections across teams", href: "/memberships" },
  ];
  const steps = [
    { title: "Create an organization", text: "Give your team a place to belong.", done: Boolean(data?.organizations.length), href: "/organizations" },
    { title: "Bring your people together", text: "Build your workspace directory.", done: Boolean(data?.users.length), href: "/users" },
    { title: "Connect people to their teams", text: "Add memberships and assign roles.", done: Boolean(data?.memberships), href: "/memberships" },
  ];
  return <><div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE, AT A GLANCE</span><h1>Overview<span className="heading-period">.</span></h1><p>A clear picture of your people and the places they work.</p></div><button className="button secondary" onClick={refresh} disabled={loading}><ArrowClockwiseIcon className={loading ? "spin" : ""} size={17} aria-hidden="true" />Refresh</button></div>
    <section className="welcome-panel"><div><span className="eyebrow">A FOUNDATION FOR WHAT’S NEXT</span><h2>A little structure.<br />A lot of possibility.</h2><p>Organize your teams. Connect your people.<br />Make room for the work ahead.</p><Link className="button primary" href="/organizations"><PlusIcon size={17} aria-hidden="true" />Create an organization</Link></div><div className="welcome-index" aria-hidden="true"><span>01 / ORGANIZE</span><div><BuildingsIcon size={35} weight="thin" /><span className="connection-line" /><UsersIcon size={35} weight="thin" /><span className="connection-line" /><FlowArrowIcon size={35} weight="thin" /></div><p>People. Teams. Possibilities.</p></div></section>
    {error && <ErrorState error={error} retry={refresh} />}
    <section className="stat-grid" aria-label="Workspace statistics">{stats.map(({ label, value, icon: Icon, description, href }) => <Link className="stat-card" href={href} key={label}><div><span>{label}</span><Icon size={20} aria-hidden="true" /></div><strong>{loading ? <span className="number-skeleton" /> : value ?? "–"}</strong><footer><span>{description}</span><ArrowUpRightIcon size={17} aria-hidden="true" /></footer></Link>)}</section>
    <div className="overview-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">YOUR TEAM SPACES</span><h2>Organizations</h2></div><Link className="text-link" href="/organizations">View all<ArrowUpRightIcon size={15} aria-hidden="true" /></Link></div>{loading ? <Skeleton rows={3} /> : data?.organizations.length ? <div className="organization-preview">{data.organizations.slice(-4).reverse().map(organization => <Link href={`/memberships?organization=${organization.id}`} key={organization.id}><span className="avatar organization-avatar"><BuildingsIcon size={20} aria-hidden="true" /></span><div><strong>{organization.name}</strong><small>Created {dateLabel(organization.created_at)}</small></div><span className="member-count">{data.sizes[organization.id]} members</span><ArrowUpRightIcon size={18} aria-hidden="true" /></Link>)}</div> : <div className="empty-state compact"><BuildingsIcon size={34} weight="light" aria-hidden="true" /><h3>Your first team starts here</h3><p>Create an organization to start connecting people.</p><Link className="text-link" href="/organizations">Create an organization<ArrowRightIcon size={16} aria-hidden="true" /></Link></div>}</section>
    <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h2>A good place to start</h2></div><span className="badge">{steps.filter(item => item.done).length} / 3</span></div><div className="setup-list">{steps.map((step, index) => <Link key={step.title} href={step.href}><span className={`step-marker ${step.done ? "done" : ""}`}>{step.done ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : `0${index + 1}`}</span><div><strong>{step.title}</strong><p>{step.text}</p></div><ArrowUpRightIcon size={16} aria-hidden="true" /></Link>)}</div></section></div>
    <div className="overview-grid bottom-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE WORK</span><h2>Recently added</h2></div><Link className="text-link" href="/users">Directory<ArrowUpRightIcon size={15} aria-hidden="true" /></Link></div>{loading ? <Skeleton rows={2} /> : data?.users.length ? <div className="people-preview">{data.users.slice(-3).reverse().map(user => <Link href="/users" key={user.id}><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div><span className="date-label">{dateLabel(user.created_at)}</span></Link>)}</div> : <div className="empty-state compact"><UsersIcon size={30} aria-hidden="true" /><h3>There’s room for everyone</h3><p>Add your first person to the directory.</p><Link className="text-link" href="/users">Add a person<ArrowRightIcon size={16} aria-hidden="true" /></Link></div>}</section><section className="future-panel"><PlugsConnectedIcon size={28} weight="light" aria-hidden="true" /><span className="eyebrow">ON THE HORIZON</span><h2>Good work.<br />Better connected.</h2><p>A dedicated home for future workflows and integrations. Ready when you are.</p><Link href="/integrations" className="text-link">Explore the roadmap<ArrowUpRightIcon size={16} aria-hidden="true" /></Link></section></div></>;
}
