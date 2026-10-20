import { Droplets } from "lucide-react";

export default function MaintenancePage() {
  return (
    // Fixed overlay: this page is served via a rewrite, so the URL is the original
    // path and the root layout's nav still renders underneath. Cover it.
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-y-auto bg-background px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <Droplets className="h-10 w-10 text-red-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Sedang Dalam Pemeliharaan</h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        AmbilDarahku sedang dalam masa pemeliharaan. Kami akan segera kembali. Silakan coba lagi beberapa saat.
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        Pemeliharaan terjadwal
      </div>
    </div>
  );
}
