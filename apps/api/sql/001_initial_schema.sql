-- Create the referenced tables before organization_members.
-- Apply once to an empty schema; the transaction prevents partial creation.
BEGIN;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_name_nonblank CHECK (name ~ '[^[:space:]]'),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_nonblank CHECK (email ~ '[^[:space:]]'),
    CONSTRAINT users_email_normalized CHECK (
        email = lower(btrim(email)) AND email !~ '[[:space:]]'
    )
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT organizations_name_nonblank CHECK (name ~ '[^[:space:]]')
);

CREATE TABLE organization_members (
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT organization_members_pkey PRIMARY KEY (user_id, organization_id),
    CONSTRAINT organization_members_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT organization_members_organization_fk FOREIGN KEY (organization_id)
        REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT organization_members_role_check CHECK (
        role IN ('owner', 'admin', 'developer')
    )
);

COMMIT;
