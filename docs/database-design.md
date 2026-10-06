# Proposed database design

This is the design proposed in Lesson 3. Lesson 4 implements it in
[001_initial_schema.sql](../apps/api/sql/001_initial_schema.sql); the executed
[schema experiments](database-schema-experiments.md) record constraint behavior.

## users

- `id`: `UUID`, **PRIMARY KEY**, **NOT NULL**. Identifies a user independently
  of their email or organization. Generated when the user is created.
- `name`: `TEXT`, **NOT NULL**. The user's display name; names are not unique.
- `email`: `TEXT`, **UNIQUE**, **NOT NULL**. The user's email address. Store it
  trimmed and lowercase, and enforce that format in the database with a
  **CHECK** constraint so casing cannot bypass uniqueness.
- `created_at`: `TIMESTAMPTZ`, **NOT NULL**, default to the current time.
  Records when the user was created.

## organizations

- `id`: `UUID`, **PRIMARY KEY**, **NOT NULL**. Identifies an organization and
  serves as its tenant identifier. Generated when the organization is created.
- `name`: `TEXT`, **NOT NULL**. The organization's display name. Different
  organizations may have the same name.
- `created_at`: `TIMESTAMPTZ`, **NOT NULL**, default to the current time.
  Records when the organization was created.

## organization_members

- `user_id`: `UUID`, **FOREIGN KEY** referencing `users.id`, **NOT NULL**.
  Identifies the user who belongs to the organization.
- `organization_id`: `UUID`, **FOREIGN KEY** referencing `organizations.id`,
  **NOT NULL**. Identifies the organization the user belongs to.
- `role`: `TEXT`, **NOT NULL**, with a **CHECK** constraint allowing `owner`,
  `admin`, or `developer`. Describes the user's role within this organization.
  Set it explicitly when creating the membership.
- `created_at`: `TIMESTAMPTZ`, **NOT NULL**, default to the current time.
  Records when the user joined the organization.

Use a composite **PRIMARY KEY** on (`user_id`, `organization_id`). Both columns
together identify a membership and enforce **UNIQUE** user/organization pairs.
A separate membership ID is unnecessary for this initial model.

## Rules and decisions

- Two users cannot share the same normalized email. The database's unique
  constraint protects this rule even when concurrent requests try to insert it.
- A user can belong to many organizations, and an organization can have many
  users, but each user can have only one membership per organization.
- Roles belong on memberships because the same user can be a developer in
  AlgoritX and an owner in My Startup. A user has no global organization role.
- Deleting an organization uses **ON DELETE CASCADE** on the membership's
  organization foreign key: its memberships disappear, but its users remain.
- Deleting a user uses **ON DELETE CASCADE** on the membership's user foreign
  key: their memberships disappear, but their organizations remain.
- Use UUIDs for users and organizations to allow IDs to be generated without
  a shared sequential counter. UUIDs are identifiers, not access controls.
- All proposed columns are **NOT NULL**. Require names and emails to be
  nonblank through database **CHECK** constraints as well.
- Membership records describe tenant access. The API must still check the
  requesting user's membership before allowing access to an organization.
- This initial model permits multiple owners. A rule such as keeping at least
  one owner requires additional design before implementing member removal.
