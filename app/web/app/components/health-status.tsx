"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isHealthResponse, type HealthResponse } from "@/lib/health";

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; health: HealthResponse }
  | { status: "error"; message: string };

export function HealthStatus() {
  const [state, setState] = useState<CheckState>({ status: "idle" });
  const activeRequest = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async () => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/v1/health", {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(response.status === 504
          ? "The API took too long to respond. Try again."
          : "The API health check failed. Try again.");
      }
      const health: unknown = await response.json();
      if (!isHealthResponse(health)) throw new Error("The health response was invalid.");
      if (activeRequest.current === controller) {
        console.log("Health check result:", health);
        setState({ status: "success", health });
      }
    } catch (error) {
      if (activeRequest.current !== controller) return;
      console.error("Health check failed:", error);
      setState({
        status: "error",
        message: controller.signal.aborted
          ? "The health check timed out. Try again."
          : error instanceof Error ? error.message : "Unable to check API health.",
      });
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, []);

  return (
    <section aria-labelledby="health-heading" className="w-full max-w-lg rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h1 id="health-heading" className="text-2xl font-semibold">API health</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Check whether the API is responding.</p>
      <div role="status" aria-live="polite" aria-atomic="true" className="my-6">
        {state.status === "idle" && <p>Click the button to check API health.</p>}
        {state.status === "loading" && <p>Checking API health…</p>}
        {state.status === "error" && <p className="text-red-700 dark:text-red-400">{state.message}</p>}
        {state.status === "success" && (
          <>
            <p className="font-medium text-green-700 dark:text-green-400">API is healthy</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-zinc-600 dark:text-zinc-400">API timestamp (UTC)</dt><dd><time dateTime={state.health.timestamp}>{state.health.timestamp}</time></dd></div>
              <div><dt className="text-zinc-600 dark:text-zinc-400">Process uptime</dt><dd>{Math.floor(state.health.uptime).toLocaleString()} seconds</dd></div>
            </dl>
          </>
        )}
      </div>
      <button type="button" onClick={() => void checkHealth()} disabled={state.status === "loading"}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-50">
        {state.status === "loading" ? "Checking…" : "Check API health"}
      </button>
      <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">This check confirms the API process responds. It does not check databases or other dependencies.</p>
    </section>
  );
}
