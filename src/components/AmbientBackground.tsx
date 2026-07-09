export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="zen-orb zen-orb-cyan -left-24 top-[8%] h-72 w-72" />
      <div className="zen-orb zen-orb-purple -right-16 top-[22%] h-96 w-96" />
      <div className="zen-orb zen-orb-sage bottom-[12%] left-[18%] h-64 w-64" />
      <div className="zen-orb zen-orb-purple bottom-[28%] right-[12%] h-56 w-56 opacity-60" />
    </div>
  );
}