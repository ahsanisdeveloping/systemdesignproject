import { ResourcePage } from "../components/resource-page";
import { Suspense } from "react";
export const metadata = { title: "Organizations" };
export default function Page() { return <Suspense fallback={<p>Loading organizations…</p>}><ResourcePage kind="organizations" /></Suspense>; }
