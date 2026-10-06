"use client";

import { useCallback, useEffect, useState } from "react";

export function useRemote<T>(key: string | null, loader: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const token = `${key}:${revision}`;
  const [state, setState] = useState<{ token: string; data?: T; error?: Error }>({ token: "" });
  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    loader(controller.signal).then(
      data => { if (!controller.signal.aborted) setState({ token, data }); },
      error => { if (!controller.signal.aborted) setState({ token, error: error instanceof Error ? error : new Error("Something went wrong") }); },
    );
    return () => controller.abort();
  }, [key, loader, token]);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  return { data: state.token === token ? state.data : undefined, error: state.token === token ? state.error : undefined, loading: key !== null && (state.token !== token || (!state.data && !state.error)), refresh };
}
