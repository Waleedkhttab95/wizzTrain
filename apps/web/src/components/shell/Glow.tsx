/**
 * The two decorative glow blobs from the handoff: orange at the top-end
 * corner, lime at the bottom-start. Purely atmospheric — behind everything,
 * never interactive.
 */
export function Glow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-[140px] h-[460px] w-[460px] rounded-full"
        style={{
          insetInlineEnd: '-120px',
          background: 'radial-gradient(circle, rgba(255,90,31,.3), rgba(255,90,31,0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-[180px] h-[500px] w-[500px] rounded-full"
        style={{
          insetInlineStart: '-160px',
          background: 'radial-gradient(circle, rgba(163,230,53,.18), rgba(163,230,53,0) 70%)',
        }}
      />
    </div>
  );
}
