/**
 * The identity's gradient field, reduced to two atmospheric blobs behind the
 * shell. The brand book draws these as soft multi-colour blurs on Midnight
 * Navy; each one here blends magenta, amber, cyan and Electric Blue in the
 * same order. Purely decorative — behind everything, never interactive.
 */
export function Glow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-[150px] h-[480px] w-[480px] rounded-full blur-[40px]"
        style={{
          insetInlineEnd: '-130px',
          background:
            'radial-gradient(38% 42% at 34% 30%, rgba(237,32,150,.38), transparent 70%),' +
            'radial-gradient(40% 44% at 68% 36%, rgba(255,190,74,.26), transparent 70%),' +
            'radial-gradient(46% 50% at 60% 70%, rgba(23,211,255,.3), transparent 72%),' +
            'radial-gradient(60% 64% at 30% 68%, rgba(0,0,184,.5), transparent 74%)',
        }}
      />
      <div
        className="absolute -bottom-[190px] h-[520px] w-[520px] rounded-full blur-[46px]"
        style={{
          insetInlineStart: '-170px',
          background:
            'radial-gradient(44% 48% at 66% 36%, rgba(23,211,255,.26), transparent 72%),' +
            'radial-gradient(42% 46% at 32% 56%, rgba(0,0,184,.55), transparent 74%),' +
            'radial-gradient(34% 38% at 56% 74%, rgba(237,32,150,.24), transparent 70%)',
        }}
      />
    </div>
  );
}
