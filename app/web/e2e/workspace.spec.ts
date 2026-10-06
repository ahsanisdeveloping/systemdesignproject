import { test, expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Server } from "node:http";

const requireApi = createRequire(path.resolve("../api/package.json"));
// The API is CommonJS and its exports intentionally support an injected pool.
const { createApp } = requireApi("./src/app.js");
const defaultPool = requireApi("./src/db.js");
const { Pool } = requireApi("pg");
const schema = `ui_test_${randomUUID().replaceAll("-", "")}`;
const config = { database: process.env.PGDATABASE || "workflow_platform", connectionTimeoutMillis: 3000 };
const admin = new Pool(config);
const db = new Pool({ ...config, options: `-c search_path=${schema}` });
let server: Server;
let schemaCreated = false;

test.beforeAll(async () => {
  if (!/^ui_test_[a-f0-9]{32}$/.test(schema)) throw new Error("Invalid test schema");
  await admin.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  await db.query(readFileSync(path.resolve("../../apps/api/sql/001_initial_schema.sql"), "utf8"));
  const users = await db.query("INSERT INTO users (name, email) VALUES ('Ahsan Khan', 'ahsan@example.com'), ('Maya Patel', 'maya@example.com'), ('Daniel Kim', 'daniel@example.com') RETURNING id");
  const orgs = await db.query("INSERT INTO organizations (name) VALUES ('AlgoritX'), ('Product Studio'), ('Engineering') RETURNING id");
  await db.query("INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, 'owner'), ($3, $4, 'developer')", [users.rows[0].id, orgs.rows[0].id, users.rows[1].id, orgs.rows[1].id]);
  server = createApp(db).listen(5127, "127.0.0.1");
  await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
});

test.afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  await db.end();
  if (schemaCreated) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
  await admin.end();
  await defaultPool.end();
});

async function menu(page: Page, label: string, action: string) {
  await page.getByRole("button", { name: `Actions for ${label}`, exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test("create, read, update, and delete all three resources through the dashboard", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Create organization", exact: true }).click();
  await page.getByLabel("Organization name").fill("Interface Test Org");
  await page.getByRole("dialog").getByRole("button", { name: "Create organization", exact: true }).click();
  await expect(page.locator(".success-notice")).toContainText("added successfully");
  await menu(page, "Interface Test Org", "View details");
  await expect(page.getByRole("dialog")).toContainText("Interface Test Org");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await menu(page, "Interface Test Org", "Edit details");
  await page.getByLabel("Organization name").fill("Interface Test Team");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: "Actions for Interface Test Team" })).toBeVisible();

  await page.goto("/users");
  await page.getByRole("button", { name: "Add a person", exact: true }).click();
  await page.getByLabel("Full name").fill("Interface Test Person");
  await page.getByLabel("Email address").fill("interface-test@example.com");
  await page.getByRole("dialog").getByRole("button", { name: "Add a person", exact: true }).click();
  await expect(page.getByRole("button", { name: "Actions for Interface Test Person" })).toBeVisible();
  await menu(page, "Interface Test Person", "Edit details");
  await page.getByLabel("Full name").fill("Interface Test Member");
  await page.getByRole("button", { name: "Save changes" }).click();
  await menu(page, "Interface Test Member", "View details");
  await expect(page.getByRole("dialog")).toContainText("interface-test@example.com");
  await page.keyboard.press("Escape");

  const org = (await db.query("SELECT id FROM organizations WHERE name = $1", ["Interface Test Team"])).rows[0];
  const user = (await db.query("SELECT id FROM users WHERE email = $1", ["interface-test@example.com"])).rows[0];
  await page.goto(`/memberships?organization=${org.id}`);
  await page.getByRole("button", { name: "Add member", exact: true }).click();
  await page.getByLabel("Person", { exact: false }).selectOption(user.id);
  await page.getByLabel("Organization role").selectOption("developer");
  await page.getByRole("dialog").getByRole("button", { name: "Add member", exact: true }).click();
  await menu(page, "Interface Test Member", "View details");
  await expect(page.getByRole("dialog")).toContainText("developer");
  await page.keyboard.press("Escape");
  await menu(page, "Interface Test Member", "Change role");
  await page.getByLabel("Organization role").selectOption("admin");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("tbody")).toContainText("admin");
  await menu(page, "Interface Test Member", "Remove member");
  await page.getByRole("button", { name: "Remove member", exact: true }).click();
  await expect(page.getByRole("button", { name: "Actions for Interface Test Member" })).toHaveCount(0);

  await page.goto("/users");
  await menu(page, "Interface Test Member", "Delete");
  await expect(page.getByRole("dialog")).toContainText("Their organizations will remain");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("button", { name: "Actions for Interface Test Member" })).toHaveCount(0);
  await page.goto("/organizations");
  await menu(page, "Interface Test Team", "Delete");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("button", { name: "Actions for Interface Test Team" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("duplicate errors retain input, announce the problem, and keep keyboard focus in the dialog", async ({ page }) => {
  await page.goto("/users");
  await page.getByRole("button", { name: "Add a person", exact: true }).click();
  await page.getByLabel("Full name").fill("Duplicate Person");
  await page.getByLabel("Email address").fill("ahsan@example.com");
  await page.getByRole("dialog").getByRole("button", { name: "Add a person", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByLabel("Full name")).toHaveValue("Duplicate Person");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("overview uses real counts and desktop layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Organizations 3 Spaces/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /People 3 People/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Memberships 2 Connections/ })).toBeVisible();
  await expect(page.getByText("API connected", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/overview-desktop.png", fullPage: true });
});

test("mobile, tablet, and landscape layouts stay within the viewport and navigation works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Organizations 3 Spaces/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "People", exact: true }).click();
  await expect(page.getByRole("heading", { name: "People.", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/people-mobile.png", fullPage: true });
  await page.goto("/integrations");
  await expect(page.getByText("Workflow builder", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 667, height: 375 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("server pagination and current-page filters handle long directory values", async ({ page }) => {
  const longName = "A".repeat(190);
  try {
    for (let index = 0; index < 12; index++) {
      await db.query("INSERT INTO users (name, email) VALUES ($1, $2)", [index === 0 ? longName : `Pagination Person ${index}`, `pagination-${index}@example.com`]);
    }
    await page.goto("/users");
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Previous page", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await page.getByRole("textbox", { name: "Filter records on this page" }).fill("no-matching-person");
    await expect(page.getByRole("heading", { name: "No matches on this page" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filter" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally {
    await db.query("DELETE FROM users WHERE email LIKE $1", ["pagination-%@example.com"]);
  }
});

test("non-JSON proxy errors have a recoverable error state", async ({ page }) => {
  await page.route("**/api/v1/organizations?*", route => route.fulfill({ status: 502, contentType: "text/html", body: "<html>Bad gateway</html>" }));
  await page.goto("/organizations");
  await expect(page.locator(".error-state[role='alert']")).toContainText("workspace is unavailable");
  await expect(page.getByRole("button", { name: "Create organization", exact: true })).toBeDisabled();
  await page.unroute("**/api/v1/organizations?*");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator(".error-state[role='alert']")).toHaveCount(0);
});
