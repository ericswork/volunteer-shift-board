// Temporary token preview; group 8 replaces this with the page layout and routes
const statuses = [
  { label: 'Spots open', pill: 'bg-status-open-bg text-status-open-text', bar: 'bg-status-open-bar', fill: '30%' },
  { label: 'Filling up', pill: 'bg-status-filling-bg text-status-filling-text', bar: 'bg-status-filling-bar', fill: '90%' },
  { label: 'Full', pill: 'bg-status-full-bg text-status-full-text', bar: 'bg-status-full-bar', fill: '100%' },
];

export function App() {
  return (
    <main className="mx-auto max-w-page px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Volunteer Shift Board</h1>
      <p className="mt-2 text-lg text-text-muted">Design token preview</p>

      <section className="mt-8 grid gap-6 sm:grid-cols-3">
        {statuses.map((status) => (
          <div key={status.label} className="rounded-card border border-border bg-surface p-5">
            <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${status.pill}`}>
              {status.label}
            </span>
            <div className="mt-4 h-2 rounded-full bg-divider">
              <div className={`h-2 rounded-full ${status.bar}`} style={{ width: status.fill }} />
            </div>
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button className="min-h-11 rounded-control bg-primary px-5 font-semibold text-white">
          View shifts
        </button>
        <button className="min-h-11 rounded-control border border-input-border bg-surface px-5 font-semibold">
          View details
        </button>
        <button
          disabled
          className="min-h-11 rounded-control border border-disabled-border bg-disabled-bg px-5 font-semibold text-disabled-text"
        >
          Shift full
        </button>
      </div>
    </main>
  );
}
