import { useEffect, useState, type ReactNode } from "react";
import { MapContainer, type MapContainerProps } from "react-leaflet";

/**
 * Mount Leaflet only after first paint to avoid StrictMode
 * "Map container is already initialized" remount crashes.
 */
export function SafeMapContainer({
  children,
  className,
  ...props
}: MapContainerProps & { children?: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div
        className={className}
        style={{ background: "hsl(var(--muted))" }}
        aria-hidden
      />
    );
  }

  return (
    <MapContainer className={className} {...props}>
      {children}
    </MapContainer>
  );
}
