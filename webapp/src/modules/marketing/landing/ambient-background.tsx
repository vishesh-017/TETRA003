import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${6 + ((i * 17) % 88)}%`,
  top: `${8 + ((i * 23) % 80)}%`,
  size: 2 + (i % 4),
  delay: (i % 7) * 0.35,
  duration: 4 + (i % 5),
}));

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="hn-mesh absolute inset-0" />
      <div className="hn-grid absolute inset-0 opacity-70" />

      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#2563EB]/20 blur-[90px]" />
      <div className="absolute right-[-4rem] top-32 h-80 w-80 rounded-full bg-[#14B8A6]/18 blur-[100px]" />
      <div className="absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#22C55E]/12 blur-[90px]" />

      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#2563EB]/40"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 12px rgba(37,99,235,0.45)",
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -10, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
