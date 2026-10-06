# Lesson 4: schema experiments

Executed against local `workflow_platform` on PostgreSQL 18.6 after applying
[001_initial_schema.sql](../apps/api/sql/001_initial_schema.sql).
Each statement ran separately in autocommit mode, so an expected error did not
abort the remaining experiments. The errors below are actual PostgreSQL output.

## Create and inspect the relationship

```sql
INSERT INTO users (name, email)
VALUES ('Ahsan', 'ahsan@example.com') RETURNING *;

INSERT INTO organizations (name)
VALUES ('AlgoritX') RETURNING *;
```

Neither insert supplied an ID or timestamp. PostgreSQL generated:

| Table | ID | Name | Email | created_at (UTC) |
| --- | --- | --- | --- | --- |
| users | 046a1c1e-35b8-40e5-a8c6-99dd188eba75 | Ahsan | ahsan@example.com | 2026-10-06T06:01:35.725Z |
| organizations | 455439c0-d885-40ea-874c-33f8b2a77234 | AlgoritX | — | 2026-10-06T06:01:35.737Z |

Use the returned IDs to create the relationship:

```sql
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (
    '046a1c1e-35b8-40e5-a8c6-99dd188eba75',
    '455439c0-d885-40ea-874c-33f8b2a77234',
    'developer'
) RETURNING *;

SELECT * FROM users;
SELECT * FROM organizations;
SELECT * FROM organization_members;
```

The SELECTs returned the two records above and this membership:

```json
{
  "user_id": "046a1c1e-35b8-40e5-a8c6-99dd188eba75",
  "organization_id": "455439c0-d885-40ea-874c-33f8b2a77234",
  "role": "developer",
  "created_at": "2026-10-06T06:01:35.738Z"
}
```

## Duplicate email

```sql
INSERT INTO users (name, email)
VALUES ('Another Ahsan', 'ahsan@example.com');
```

```text
ERROR: duplicate key value violates unique constraint "users_email_unique"
DETAIL: Key (email)=(ahsan@example.com) already exists.
SQLSTATE: 23505
```

`UNIQUE` prevents two users from sharing the same stored email, even when
application validation is skipped or concurrent requests pass the same check.
The normalization CHECK also requires lowercase emails without whitespace;
it rejects unnormalized input rather than transforming it.

## Duplicate membership

```sql
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (
    '046a1c1e-35b8-40e5-a8c6-99dd188eba75',
    '455439c0-d885-40ea-874c-33f8b2a77234',
    'developer'
);
```

```text
ERROR: duplicate key value violates unique constraint "organization_members_pkey"
DETAIL: Key (user_id, organization_id)=(046a1c1e-35b8-40e5-a8c6-99dd188eba75, 455439c0-d885-40ea-874c-33f8b2a77234) already exists.
SQLSTATE: 23505
```

The composite primary key makes the pair unique. Neither foreign key alone
is unique, so users can join multiple organizations and organizations can
have multiple users.

## Nonexistent user

Confirmed the all-zero UUID did not exist in users before this insert.

```sql
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '455439c0-d885-40ea-874c-33f8b2a77234',
    'developer'
);
```

```text
ERROR: insert or update on table "organization_members" violates foreign key constraint "organization_members_user_fk"
DETAIL: Key (user_id)=(00000000-0000-0000-0000-000000000000) is not present in table "users".
SQLSTATE: 23503
```

The foreign key prevents a membership from referencing a nonexistent user.
The referenced tables must exist when PostgreSQL creates these foreign keys,
so users and organizations are created before organization_members.

## Invalid role

```sql
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (
    '046a1c1e-35b8-40e5-a8c6-99dd188eba75',
    '455439c0-d885-40ea-874c-33f8b2a77234',
    'superman'
);
```

```text
ERROR: new row for relation "organization_members" violates check constraint "organization_members_role_check"
DETAIL: Failing row contains (046a1c1e-35b8-40e5-a8c6-99dd188eba75, 455439c0-d885-40ea-874c-33f8b2a77234, superman, 2026-10-06 11:01:35.873959+05).
SQLSTATE: 23514
```

The role CHECK permits only owner, admin, or developer. This attempted row
also duplicates the existing membership, but PostgreSQL reported the role
violation first. Do not depend on constraint evaluation order.

## Delete AlgoritX and inspect the remaining rows

```sql
DELETE FROM organizations
WHERE id = '455439c0-d885-40ea-874c-33f8b2a77234' RETURNING *;

SELECT * FROM organization_members;
SELECT * FROM users;
SELECT * FROM organizations;
```

The DELETE returned AlgoritX. Memberships and organizations then returned
zero rows. Users still returned the original Ahsan record, with the same ID,
email, and timestamp.

`ON DELETE CASCADE` removes the membership that references the deleted
organization. It does not delete the user referenced by that membership.
The final database state is **one user, zero organizations, zero memberships**.

To repeat the exercise, use the existing Ahsan record, create a new AlgoritX
organization, and use its newly returned UUID. The old organization UUID in
this transcript no longer exists. The initial schema file is meant to be
applied once, not rerun against existing tables.

References: PostgreSQL's [constraints documentation](https://www.postgresql.org/docs/current/ddl-constraints.html)
and [UUID functions documentation](https://www.postgresql.org/docs/current/functions-uuid.html).
