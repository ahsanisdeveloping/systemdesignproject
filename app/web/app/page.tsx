import { HealthStatus } from "./components/health-status";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 font-sans">
      <HealthStatus />
    </main>
  );
}
