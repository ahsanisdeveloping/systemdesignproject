"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type FormEvent,
} from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  BuildingsIcon,
  UsersIcon,
  IdentificationBadgeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpRightIcon,
  ArrowClockwiseIcon,
  ArrowDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  XIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import {
  api,
  directory,
  recordId,
  dateLabel,
  initials,
  ApiError,
  type RecordItem,
  type User,
  type Organization,
  type Membership,
  type Page,
} from "../../lib/api";
import { useRemote } from "../../lib/use-remote";
import { Modal, Spinner, Skeleton, ErrorState } from "./ui";

type Kind = "users" | "organizations" | "memberships";
const config = {
  users: {
    title: "People",
    singular: "person",
    action: "Add a person",
    description:
      "Good work starts with great people. Keep everyone in one place.",
    icon: UsersIcon,
  },
  organizations: {
    title: "Organizations",
    singular: "organization",
    action: "Create organization",
    description: "A dedicated space for every team and every possibility.",
    icon: BuildingsIcon,
  },
  memberships: {
    title: "Memberships",
    singular: "membership",
    action: "Add member",
    description:
      "Connect your people to the right teams, with the right roles.",
    icon: IdentificationBadgeIcon,
  },
};
const loadUsers = (signal: AbortSignal) => directory<User>("/users", signal);
const loadOrganizations = (signal: AbortSignal) =>
  directory<Organization>("/organizations", signal);

export function ResourcePage({ kind }: { kind: Kind }) {
  const settings = config[kind];
  const Icon = settings.icon;
  const query = useSearchParams();
  const [organization, setOrganization] = useState(
    query.get("organization") ?? "",
  );
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [active, setActive] = useState<{
    mode: "create" | "edit" | "view" | "delete";
    row?: RecordItem;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const organizations = useRemote(
    kind === "memberships" ? "organizations-directory" : null,
    loadOrganizations,
  );
  const people = useRemote(
    kind === "memberships" ? "people-directory" : null,
    loadUsers,
  );
  const organizationId = organization || organizations.data?.[0]?.id || "";
  const endpoint =
    kind === "memberships"
      ? organizationId
        ? `/organizations/${organizationId}/members`
        : null
      : `/${kind}`;
  const loader = useCallback(
    (signal: AbortSignal) =>
      api<Page<RecordItem>>(`${endpoint}?limit=${limit}&offset=${offset}`, {
        signal,
      }),
    [endpoint, limit, offset],
  );
  const result = useRemote(
    endpoint ? `${endpoint}:${limit}:${offset}` : null,
    loader,
  );
  const rows = useMemo(() => result.data?.data ?? [], [result.data]);
  const names = useMemo(
    () => new Map(people.data?.map((user) => [user.id, user])),
    [people.data],
  );
  const rowLabel = useCallback(
    (row: RecordItem) =>
      "name" in row ? row.name : (names.get(row.user_id)?.name ?? row.user_id),
    [names],
  );
  const itemPath = (row: RecordItem) => `${endpoint}/${recordId(row)}`;
  const refresh = () => {
    result.refresh();
    if (kind === "memberships") {
      people.refresh();
      organizations.refresh();
    }
  };
  const open = (mode: "edit" | "view" | "delete", row: RecordItem) =>
    setActive({ mode, row });
  const columns = useMemo<ColumnDef<RecordItem>[]>(
    () => [
      {
        id: "name",
        accessorFn: rowLabel,
        header: kind === "organizations" ? "Organization" : "Person",
        cell: ({ row }) => (
          <button
            className="record-identity"
            onClick={() => open("view", row.original)}
          >
            <span
              className={`avatar ${kind === "organizations" ? "organization-avatar" : ""}`}
            >
              {kind === "organizations" ? (
                <BuildingsIcon size={20} aria-hidden="true" />
              ) : (
                initials(rowLabel(row.original))
              )}
            </span>
            <span>
              <strong>{rowLabel(row.original)}</strong>
              <small>
                {kind === "organizations"
                  ? "Organization workspace"
                  : "email" in row.original
                    ? row.original.email
                    : (names.get(recordId(row.original))?.email ??
                      "Directory record unavailable")}
              </small>
            </span>
          </button>
        ),
      },
      ...(kind === "memberships"
        ? [
            {
              id: "role",
              accessorFn: (row: RecordItem) => (row as Membership).role,
              header: "Role",
              cell: ({ row }: { row: { original: RecordItem } }) => (
                <span
                  className={`role-badge ${(row.original as Membership).role}`}
                >
                  {(row.original as Membership).role}
                </span>
              ),
            },
          ]
        : [
            {
              id: "id",
              accessorFn: (row: RecordItem) => recordId(row),
              header: "Identifier",
              cell: ({ row }: { row: { original: RecordItem } }) => (
                <span className="record-id" title={recordId(row.original)}>
                  {recordId(row.original).slice(0, 8)}…
                </span>
              ),
            },
          ]),
      {
        accessorKey: "created_at",
        header: kind === "memberships" ? "Joined" : "Created",
        cell: ({ row }) => (
          <span className="date-label">
            {dateLabel(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Menu.Root>
            <Menu.Trigger asChild>
              <button
                className="icon-button row-menu"
                aria-label={`Actions for ${rowLabel(row.original)}`}
              >
                <DotsThreeIcon size={23} weight="bold" aria-hidden="true" />
              </button>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content
                className="dropdown-menu"
                align="end"
                sideOffset={6}
              >
                <Menu.Item onSelect={() => open("view", row.original)}>
                  <EyeIcon size={16} aria-hidden="true" />
                  View details
                </Menu.Item>
                <Menu.Item onSelect={() => open("edit", row.original)}>
                  <PencilSimpleIcon size={16} aria-hidden="true" />
                  {kind === "memberships" ? "Change role" : "Edit details"}
                </Menu.Item>
                {kind === "organizations" && (
                  <Menu.Item asChild>
                    <Link
                      href={`/memberships?organization=${recordId(row.original)}`}
                    >
                      <UsersIcon size={16} aria-hidden="true" />
                      Manage members
                    </Link>
                  </Menu.Item>
                )}
                <Menu.Separator />
                <Menu.Item
                  className="destructive"
                  onSelect={() => open("delete", row.original)}
                >
                  <TrashIcon size={16} aria-hidden="true" />
                  {kind === "memberships" ? "Remove member" : "Delete"}
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
        ),
      },
    ],
    [kind, rowLabel, names],
  );
  // TanStack v8 owns its table state; this component is deliberately not compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: recordId,
  });
  const error = result.error ?? organizations.error ?? people.error;
  const loading = result.loading || organizations.loading || people.loading;
  const ready = Boolean(endpoint) && !loading && !error;
  const finish = (message: string) => {
    setActive(null);
    setNotice(message);
    setFilter("");
    if (active?.mode === "delete" && rows.length === 1 && offset > 0)
      setOffset(Math.max(0, offset - limit));
    else result.refresh();
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {kind === "users"
              ? "THE PEOPLE BEHIND THE WORK"
              : kind === "organizations"
                ? "A PLACE FOR EVERY TEAM"
                : "PEOPLE, CONNECTED"}
          </span>
          <h1>
            {settings.title}
            <span className="heading-period">.</span>
          </h1>
          <p>{settings.description}</p>
        </div>
        <button
          className="button primary"
          onClick={() => setActive({ mode: "create" })}
          disabled={!ready || (kind === "memberships" && !people.data?.length)}
        >
          <PlusIcon size={18} aria-hidden="true" />
          {settings.action}
        </button>
      </div>
      {notice && (
        <div className="success-notice" role="status">
          <CheckCircleIcon size={20} aria-hidden="true" />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            className="icon-button"
            onClick={() => setNotice("")}
          >
            <XIcon size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {kind === "memberships" && (
        <div className="organization-selector">
          <span className="avatar organization-avatar">
            <BuildingsIcon size={22} aria-hidden="true" />
          </span>
          <div>
            <label htmlFor="organization-selector">
              Organization workspace
            </label>
            <select
              id="organization-selector"
              value={organizationId}
              disabled={organizations.loading || !organizations.data?.length}
              onChange={(event) => {
                setOrganization(event.target.value);
                setOffset(0);
                setFilter("");
              }}
            >
              <option value="">Choose an organization</option>
              {organizations.data?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>
          <span className="selector-description">
            Roles belong to each organization.
          </span>
        </div>
      )}
      {error && <ErrorState error={error} retry={refresh} />}
      <section
        className="panel directory-panel"
        aria-label={`${settings.title} directory`}
      >
        <div className="directory-heading">
          <div>
            <h2>
              {kind === "memberships"
                ? "Organization members"
                : kind === "users"
                  ? "People directory"
                  : "Organization directory"}
            </h2>
            <p>
              {kind === "memberships"
                ? "One person. Many teams. A role in each."
                : "Everything you need, in one place."}
            </p>
          </div>
          <span className="badge">
            {loading ? "Loading" : `${rows.length} on this page`}
          </span>
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <MagnifyingGlassIcon size={18} aria-hidden="true" />
            <input
              aria-label="Filter records on this page"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={`Filter ${kind === "users" ? "people" : kind} on this page…`}
            />
            <kbd>/</kbd>
          </div>
          <button
            className="button secondary"
            onClick={refresh}
            disabled={loading}
          >
            <ArrowClockwiseIcon
              className={loading ? "spin" : ""}
              size={16}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        </div>
        {loading ? (
          <Skeleton rows={5} />
        ) : !error && table.getRowModel().rows.length ? (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                {settings.title}, page {Math.floor(offset / limit) + 1}. Sorting
                and filtering apply to the current page.
              </caption>
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th key={header.id}>
                        {header.column.getCanSort() ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            aria-label={`Sort this page by ${String(header.column.columnDef.header)}`}
                            className="sort-button"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <ArrowDownIcon
                              size={12}
                              className={
                                header.column.getIsSorted() === "asc"
                                  ? "sort-ascending"
                                  : ""
                              }
                              aria-hidden="true"
                            />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="empty-state">
              <Icon size={40} weight="light" aria-hidden="true" />
              <h3>
                {filter
                  ? "No matches on this page"
                  : kind === "memberships" && !organizationId
                    ? "A team needs a place to belong"
                    : offset > 0
                      ? "You’ve reached the end"
                      : `Your first ${settings.singular} starts here`}
              </h3>
              <p>
                {filter
                  ? "Try a different name or clear your filter."
                  : kind === "memberships" && !organizationId
                    ? "Create an organization, then connect your people to it."
                    : kind === "memberships" && !people.data?.length
                      ? "Add a person to the directory before creating a membership."
                      : `Add a ${settings.singular} to make this workspace your own.`}
              </p>
              {filter ? (
                <button
                  className="button secondary"
                  onClick={() => setFilter("")}
                >
                  Clear filter
                </button>
              ) : kind === "memberships" &&
                (!organizationId || !people.data?.length) ? (
                <Link
                  className="button secondary"
                  href={!organizationId ? "/organizations" : "/users"}
                >
                  {!organizationId ? "Create an organization" : "Add a person"}
                  <ArrowUpRightIcon size={16} />
                </Link>
              ) : (
                offset === 0 && (
                  <button
                    className="button secondary"
                    disabled={!ready}
                    onClick={() => setActive({ mode: "create" })}
                  >
                    <PlusIcon size={16} aria-hidden="true" />
                    {settings.action}
                  </button>
                )
              )}
            </div>
          )
        )}
        <div className="table-pagination">
          <span>
            Page {Math.floor(offset / limit) + 1}
            <small>Filters and sorting apply to this page.</small>
          </span>
          <div>
            <label htmlFor="page-size">Rows</label>
            <select
              id="page-size"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setOffset(0);
                setFilter("");
              }}
            >
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={!ready || offset === 0}
              onClick={() => {
                setOffset(Math.max(0, offset - limit));
                setFilter("");
              }}
            >
              <CaretLeftIcon size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={!ready || rows.length < limit}
              onClick={() => {
                setOffset(offset + limit);
                setFilter("");
              }}
            >
              <CaretRightIcon size={17} />
            </button>
          </div>
        </div>
      </section>
      <div className="directory-footnote">
        <IdentificationBadgeIcon size={18} aria-hidden="true" />
        <p>
          {kind === "memberships"
            ? "A person can belong to several organizations, with a different role in each."
            : kind === "organizations"
              ? "Organizations keep teams connected. Manage memberships from an organization’s action menu."
              : "One shared directory. Connect each person to the organizations where they belong."}
        </p>
      </div>
      {active && endpoint && (
        <RecordDialog
          key={`${active.mode}:${active.row ? recordId(active.row) : "new"}`}
          kind={kind}
          mode={active.mode}
          row={active.row}
          path={active.row ? itemPath(active.row) : endpoint}
          label={active.row ? rowLabel(active.row) : settings.singular}
          people={people.data ?? []}
          onClose={() => setActive(null)}
          onSuccess={finish}
          onEdit={() => setActive({ mode: "edit", row: active.row })}
        />
      )}
    </>
  );
}

function RecordDialog({
  kind,
  mode,
  row,
  path,
  label,
  people,
  onClose,
  onSuccess,
  onEdit,
}: {
  kind: Kind;
  mode: "create" | "edit" | "view" | "delete";
  row?: RecordItem;
  path: string;
  label: string;
  people: User[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({
    name: row && "name" in row ? row.name : "",
    email: row && "email" in row ? row.email : "",
    user_id: "",
    role: row && "role" in row ? row.role : "developer",
  });
  const loadDetails = useCallback(
    (signal: AbortSignal) => api<{ data: RecordItem }>(path, { signal }),
    [path],
  );
  const details = useRemote(mode === "view" ? path : null, loadDetails);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const fieldError = (field: string) =>
    error?.details.find((detail) => detail.field === field)?.message;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data =
        kind === "memberships"
          ? mode === "edit"
            ? { role: values.role }
            : { user_id: values.user_id, role: values.role }
          : kind === "users"
            ? { name: values.name, email: values.email }
            : { name: values.name };
      await api(path, {
        method:
          mode === "delete" ? "DELETE" : mode === "create" ? "POST" : "PATCH",
        ...(mode === "delete" ? {} : { body: JSON.stringify(data) }),
      });
      onSuccess(
        mode === "delete"
          ? `${label} ${kind === "memberships" ? "removed from this organization" : "deleted"}.`
          : mode === "create"
            ? `${config[kind].singular[0].toUpperCase() + config[kind].singular.slice(1)} added successfully.`
            : "Changes saved successfully.",
      );
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure
          : new ApiError("Something went wrong. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "view"
      ? "Record details"
      : mode === "delete"
        ? kind === "memberships"
          ? "Remove membership?"
          : `Delete ${config[kind].singular}?`
        : mode === "edit"
          ? kind === "memberships"
            ? "Change membership role"
            : `Edit ${config[kind].singular}`
          : config[kind].action;
  const description =
    mode === "delete"
      ? "Please review the impact before continuing. This action cannot be undone."
      : mode === "view"
        ? "A closer look at this workspace record."
        : kind === "memberships"
          ? "A role defines this person’s relationship with this organization."
          : "A few details are all you need. You can update them at any time.";
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      busy={busy}
    >
      {mode === "view" ? (
        <>
          {details.loading ? (
            <Skeleton rows={3} />
          ) : details.error ? (
            <ErrorState error={details.error} retry={details.refresh} />
          ) : (
            details.data && (
              <>
                <div className="detail-identity">
                  <span className="avatar">{initials(label)}</span>
                  <h3>{label}</h3>
                </div>
                <dl className="record-details">
                  {Object.entries(details.data.data).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ")}</dt>
                      <dd className={key.includes("id") ? "mono" : ""}>
                        {key === "created_at"
                          ? `${dateLabel(String(value))} (UTC)`
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="modal-actions">
                  <button
                    className="button secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          recordId(details.data!.data),
                        );
                        setCopied(true);
                      } catch {
                        setError(
                          new ApiError(
                            "Couldn’t copy the identifier. You can select it above.",
                          ),
                        );
                      }
                    }}
                  >
                    <CopyIcon size={16} />
                    {copied ? "Copied" : "Copy identifier"}
                  </button>
                  <button className="button primary" onClick={onEdit}>
                    <PencilSimpleIcon size={16} />
                    Edit details
                  </button>
                </div>
              </>
            )
          )}
          {error && (
            <p role="alert" className="field-error">
              {error.message}
            </p>
          )}
        </>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <div
              className="form-error"
              tabIndex={-1}
              role="alert"
              ref={errorRef}
            >
              <strong>We couldn’t save this change</strong>
              <p>{error.message}</p>
              {error.details.map((detail) => (
                <a key={detail.field} href={`#field-${detail.field}`}>
                  {detail.message}
                </a>
              ))}
              {error.requestId && <small>Reference: {error.requestId}</small>}
            </div>
          )}
          {mode === "delete" ? (
            <div className="delete-impact">
              <TrashIcon size={26} aria-hidden="true" />
              <strong>{label}</strong>
              <p>
                {kind === "users"
                  ? "This person and all their memberships will be deleted. Their organizations will remain."
                  : kind === "organizations"
                    ? "This organization and all its memberships will be deleted. People will remain in the directory."
                    : "This person will be removed from this organization. Their directory record and other memberships will remain."}
              </p>
            </div>
          ) : (
            <div className="form-fields">
              {(kind === "memberships"
                ? mode === "edit"
                  ? ["role"]
                  : ["user_id", "role"]
                : kind === "users"
                  ? ["name", "email"]
                  : ["name"]
              ).map((field) => (
                <div className="form-field" key={field}>
                  <label htmlFor={`field-${field}`}>
                    {field === "user_id"
                      ? "Person"
                      : field === "name"
                        ? kind === "organizations"
                          ? "Organization name"
                          : "Full name"
                        : field === "email"
                          ? "Email address"
                          : "Organization role"}
                    <span>Required</span>
                  </label>
                  {field === "role" || field === "user_id" ? (
                    <select
                      id={`field-${field}`}
                      required
                      value={values[field]}
                      disabled={busy}
                      aria-invalid={Boolean(fieldError(field))}
                      aria-describedby={
                        fieldError(field) ? `error-${field}` : undefined
                      }
                      onChange={(event) =>
                        setValues({ ...values, [field]: event.target.value })
                      }
                    >
                      {field === "role" ? (
                        <>
                          <option value="developer">Developer</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </>
                      ) : (
                        <>
                          <option value="">Select a person</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name} · {person.email}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  ) : (
                    <input
                      id={`field-${field}`}
                      type={field === "email" ? "email" : "text"}
                      autoComplete={
                        field === "email"
                          ? "email"
                          : kind === "users"
                            ? "name"
                            : "organization"
                      }
                      required
                      maxLength={field === "email" ? 254 : 200}
                      value={values[field]}
                      disabled={busy}
                      placeholder={
                        field === "name"
                          ? kind === "users"
                            ? "e.g. Ahsan Khan"
                            : "e.g. AlgoritX"
                          : "name@company.com"
                      }
                      aria-invalid={Boolean(fieldError(field))}
                      aria-describedby={
                        fieldError(field) ? `error-${field}` : undefined
                      }
                      onChange={(event) =>
                        setValues({ ...values, [field]: event.target.value })
                      }
                    />
                  )}
                  {fieldError(field) && (
                    <p id={`error-${field}`} className="field-error">
                      {fieldError(field)}
                    </p>
                  )}
                  {field === "role" && (
                    <p className="field-hint">
                      This role applies only to the selected organization.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`button ${mode === "delete" ? "danger" : "primary"}`}
              disabled={busy}
            >
              {busy ? (
                <Spinner />
              ) : mode === "delete" ? (
                <TrashIcon size={16} aria-hidden="true" />
              ) : (
                <PlusIcon size={16} aria-hidden="true" />
              )}
              {busy
                ? "Saving…"
                : mode === "delete"
                  ? kind === "memberships"
                    ? "Remove member"
                    : "Delete permanently"
                  : mode === "edit"
                    ? "Save changes"
                    : config[kind].action}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
