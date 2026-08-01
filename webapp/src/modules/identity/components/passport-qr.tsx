import QRCode from "react-qr-code";

import { identityRepository } from "@/modules/identity/repository";
import { cn } from "@/lib/utils";

export function PassportQr({
  token,
  size = 128,
  className,
}: {
  token: string;
  size?: number;
  className?: string;
}) {
  const url = identityRepository.emergencyQrUrl(token);

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5",
        className,
      )}
    >
      <QRCode
        value={url}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#0f2744"
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
      <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-slate-500">
        Scan for Emergency Profile
      </p>
    </div>
  );
}
