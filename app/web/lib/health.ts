export type HealthResponse = {
  status: "ok";
  timestamp: string;
  uptime: number;
};

export function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) return false;
  const health = value as Record<string, unknown>;
  return health.status === "ok" &&
    typeof health.timestamp === "string" &&
    Number.isFinite(Date.parse(health.timestamp)) &&
    typeof health.uptime === "number" &&
    Number.isFinite(health.uptime) && health.uptime >= 0;
}
