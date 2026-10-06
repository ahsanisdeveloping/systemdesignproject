import { Suspense } from "react";
import { ResourcePage } from "../components/resource-page";
export const metadata = { title: "Memberships" };
export default function Page() { return <Suspense fallback={<p>Loading memberships…</p>}><ResourcePage kind="memberships" /></Suspense>; }
