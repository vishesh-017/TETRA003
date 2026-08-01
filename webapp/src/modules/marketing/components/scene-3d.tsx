import { PointMaterial, Points } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

import { ErrorBoundary } from "@/components/feedback/error-boundary";

function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const sphereCount = 900;

  const positions = useMemo(() => {
    const p = new Float32Array(sphereCount * 3);
    for (let i = 0; i < sphereCount; i++) {
      const r = 4.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, []);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x -= delta / 12;
    ref.current.rotation.y -= delta / 18;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#0B6BCB"
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 1.25]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.6} />
      <DataParticles />
    </Canvas>
  );
}

/** Soft CSS fallback when WebGL is unavailable or reduced-motion is preferred. */
function SceneFallback() {
  return (
    <div
      className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(211_90%_42%/0.2),transparent_45%),radial-gradient(circle_at_70%_60%,hsl(160_55%_36%/0.14),transparent_40%)]"
      aria-hidden
    />
  );
}

export function Scene3D() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    setEnabled(!reduce && !narrow);
  }, []);

  if (!enabled) {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <SceneFallback />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-50">
      <ErrorBoundary fallback={<SceneFallback />}>
        <SceneCanvas />
      </ErrorBoundary>
    </div>
  );
}
