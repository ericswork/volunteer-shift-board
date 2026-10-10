const PANEL = 'rounded-card border border-border bg-surface p-4 sm:p-5';

export function EventSidePanels() {
  return (
    <div className="space-y-6">
      <section aria-labelledby="good-to-know" className={PANEL}>
        <h2 id="good-to-know" className="text-xl font-bold">
          Good to know
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px]">
          <li>Wear closed-toe shoes.</li>
          <li>Bring a water bottle.</li>
          <li>Arrive 10 minutes early for check-in.</li>
          <li>Can't make it? Cancel at least 24 hours ahead so someone else can take the spot.</li>
        </ul>
      </section>

      <section aria-labelledby="questions" className={PANEL}>
        <h2 id="questions" className="text-xl font-bold">
          Questions?
        </h2>
        <p className="mt-2 text-[15px] text-text-muted">Contact the event organizer before your shift.</p>
        <a
          href="mailto:organizer@example.org"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-ink underline underline-offset-2"
        >
          Message the organizer
        </a>
      </section>
    </div>
  );
}
