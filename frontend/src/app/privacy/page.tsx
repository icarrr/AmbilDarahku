import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi AmbilDarahku — platform donor darah berbasis komunitas.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground">Kebijakan Privasi</h1>
      <p className="mt-1 text-sm text-muted-foreground">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">1. Pengumpulan Data</h2>
          <p>Kami mengumpulkan data pribadi yang Anda berikan saat mendaftar, termasuk nama, nomor telepon, email, golongan darah, rhesus, tanggal lahir, jenis kelamin, berat badan, tinggi badan, dan lokasi.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">2. Penggunaan Data</h2>
          <p>Data Anda digunakan untuk:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Mempertemukan pendonor dengan penerima donor darah</li>
            <li>Verifikasi riwayat donor darah</li>
            <li>Peringkat donor dan sistem badge</li>
            <li>Notifikasi permintaan darah darurat</li>
            <li>Pengembangan layanan komunitas donor darah</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">3. Keamanan Data</h2>
          <p>Kami melindungi data Anda dengan enkripsi dan praktik keamanan standar industri. Data sensitif seperti kata sandi disimpan dalam bentuk hash.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">4. Berbagi Data</h2>
          <p>Data profil publik (nama, golongan darah, lokasi) dapat dilihat oleh pengguna lain. Data kontak hanya dibagikan saat terjadi permintaan donor yang relevan.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">5. Hak Anda</h2>
          <p>Anda berhak mengakses, mengoreksi, atau menghapus data Anda kapan saja melalui pengaturan profil. Hubungi kami di info@ambildarahku.id untuk pertanyaan lebih lanjut.</p>
        </section>
      </div>
    </div>
  );
}
