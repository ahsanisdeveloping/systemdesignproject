import { ResourcePage } from "../components/resource-page";
import { Suspense } from "react";
export const metadata = { title: "People" };
export default function Page() { return <Suspense fallback={<p>Loading people…</p>}><ResourcePage kind="users" /></Suspense>; }
