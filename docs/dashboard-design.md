# Eris Workspace dashboard

The dashboard adapts `eris ai design.md` to a working administration product.
The user's palette overrides the reference document's original colors.

| Token | Color | Usage |
| --- | --- | --- |
| Mint Cream | #eaf2ef | Content surfaces and text on dark surfaces |
| Vintage Berry | #912f56 | Primary actions, focus outlines, active navigation accent |
| Deep Purple | #521945 | Emphasis, owner badges, heading accents |
| Midnight Violet | #361f27 | Navigation surfaces and supporting text |
| Pitch Black | #0d090a | Sidebar and primary text |

Other surface, border, and muted colors are mixtures or alpha variants of these
five colors. The reference's Geist Sans/Mono fonts, heading tracking, 8px controls,
12px panels, restrained borders, low shadows, and reduced motion carry forward.
Dashboard density replaces the reference's large marketing-section padding.

UI UX Pro Max informed dashboard structure, loading/error states, focusable form
errors, accessible input labels, and touch targets. Its suggested blue/orange
palette and alternate fonts were overridden by the user's brand direction.
Taste Skill explicitly excludes dashboards from its marketing layout rules;
its applicable typography, shape, contrast, and motion guidance was retained.
Design settings: variance 4, motion 2, density 7.

## Structure

- `/`: Live overview counts, recent records, and setup checklist.
- `/organizations`: Create, read, edit, and delete organizations; links to members.
- `/users`: Create, read, edit, and delete directory users.
- `/memberships`: Select an organization; add, read, change roles, and remove members.
- `/integrations`: Clearly labeled roadmap for workflows, execution, and integrations.

Radix owns dialog focus trapping and action-menu keyboard behavior. TanStack
Table v8 owns current-page filtering/sorting; the existing API provides pagination.
The mobile navigation handles focus trapping and Escape. Error states retain
input, server field errors link to inputs, and destructive actions explain cascades.

The API client uses relative `/api/v1` URLs, aborts stale reads, bounds requests
with a timeout, and handles both JSON API errors and non-JSON proxy failures.
Directory selectors and exact overview counts load paginated records, with at
most four organization membership requests in flight. The selector guard stops
above 10,000 records rather than silently hiding records. Server-side searching
and aggregate-count endpoints are the next scaling improvements.

No demo data is inserted into the application's public tables. Browser tests use
the real Express routes in an isolated PostgreSQL schema and remove their fixtures.
Authentication, tenant authorization, and role enforcement remain backend work;
this dashboard uses the current local development management API.
