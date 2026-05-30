export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-b from-red-50 to-white dark:from-red-950 dark:to-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-6 text-center">
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">AD</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-red-700 dark:text-red-400 mb-4">
          AmbilDarahku
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Platform donor darah berbasis komunitas. Temukan pendonor darah terdekat
          dengan cepat, tepat, dan terverifikasi.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-red-600 px-8 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Daftar Jadi Donor
          </a>
          <a
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-red-300 px-8 text-red-700 font-medium hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
          >
            Masuk
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-2xl">
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <div className="text-2xl mb-2">🩸</div>
            <h3 className="font-semibold text-sm">Cari Donor</h3>
            <p className="text-xs text-gray-500 mt-1">
              Temukan donor berdasarkan golongan darah & lokasi
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-sm">Darurat</h3>
            <p className="text-xs text-gray-500 mt-1">
              Permintaan donor darah darurat
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold text-sm">Leaderboard</h3>
            <p className="text-xs text-gray-500 mt-1">
              Lihat peringkat donor aktif
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
