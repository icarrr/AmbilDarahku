import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description: "Ketentuan layanan AmbilDarahku — platform donor darah berbasis komunitas.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="font-heading text-3xl font-bold text-foreground">Ketentuan Layanan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">1. Penerimaan Ketentuan</h2>
          <p>Dengan menggunakan AmbilDarahku, Anda menyetujui ketentuan layanan ini. Jika Anda tidak setuju, jangan gunakan platform ini.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">2. Pengguna Terdaftar</h2>
          <p>Anda bertanggung jawab atas kebenaran data yang Anda berikan. Data palsu atau menyesatkan dapat mengakibatkan penghapusan akun.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">3. Donor Darah</h2>
          <p>Donor darah bersifat sukarela. Kami tidak menjamin ketersediaan donor untuk setiap permintaan. Keputusan donor adalah hak pribadi masing-masing pengguna.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">4. Permintaan Darurat</h2>
          <p>Permintaan darah darurat harus disertai data yang akurat. Penyalahgunaan fitur darurat dapat mengakibatkan sanksi termasuk pemblokiran akun.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">5. Batasan Tanggung Jawab</h2>
          <p>AmbilDarahku hanyalah platform penghubung. Kami tidak bertanggung jawab atas insiden medis atau kerugian yang timbul dari transaksi donor darah.</p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">6. Perubahan Ketentuan</h2>
          <p>Kami dapat memperbarui ketentuan ini sewaktu-waktu. Pengguna akan diberitahu tentang perubahan signifikan melalui email atau notifikasi aplikasi.</p>
        </section>
      </div>
    </div>
  );
}
