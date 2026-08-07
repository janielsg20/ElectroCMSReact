export function App() {
  return (
    <main className="foundation-shell" aria-labelledby="app-title">
      <section className="foundation-card">
        <div className="foundation-brand" aria-hidden="true">
          ⚡
        </div>
        <p className="foundation-kicker">Local-first visual CMS</p>
        <h1 id="app-title">ElectroCMS</h1>
        <p className="foundation-copy">
          React + TypeScript foundation. Product modules are enabled only as their phase gates are completed.
        </p>
        <dl className="foundation-status" aria-label="Foundation status">
          <div>
            <dt>Runtime</dt>
            <dd>React</dd>
          </div>
          <div>
            <dt>Architecture</dt>
            <dd>Canonical model</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>Local-first</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
