import "dotenv/config";
import { Pool } from "pg";
import { faker, id_ID } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import crypto from "crypto";

faker.locale = "id_ID";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "",
  ssl: { rejectUnauthorized: false },
});

const SCALE = parseFloat(process.env.SEED_SCALE || "0.05");
const PER_CITY = Math.max(10, Math.round(50 * SCALE));
const BATCH = 500;

const DOB_START = new Date("1960-01-01");
const DOB_END = new Date("2008-01-01");

const BLOOD_DIST: [string, number][] = [
  ["O+", 35], ["A+", 28], ["B+", 23], ["AB+", 6],
  ["O-", 3], ["A-", 2], ["B-", 2], ["AB-", 1],
];

const RHESUS: Record<string, string> = {
  "O+": "+", "A+": "+", "B+": "+", "AB+": "+",
  "O-": "-", "A-": "-", "B-": "-", "AB-": "-",
};

const URGENCIES = ["normal", "urgent", "critical"] as const;
const STATUSES = ["open", "fulfilled", "cancelled"] as const;
const EVENT_STATUSES = ["upcoming", "ongoing", "completed"] as const;

function weightedRandom(dist: [string, number][]): string {
  const r = Math.random() * 100;
  let cum = 0;
  for (const [v, p] of dist) {
    cum += p;
    if (r <= cum) return v;
  }
  return dist[dist.length - 1][0];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function nik(provinceCode: string, cityCode: string, dob: Date, seq: number): string {
  const dd = String(dob.getDate()).padStart(2, "0");
  const mm = String(dob.getMonth() + 1).padStart(2, "0");
  const yy = String(dob.getFullYear()).slice(-2);
  const genderAdj = dob.getDate() > 40 ? dob.getDate() - 40 : dob.getDate();
  const day = String(genderAdj).padStart(2, "0");
  const seqStr = String(seq).padStart(4, "0");
  return `${provinceCode}${cityCode}${day}${mm}${yy}${seqStr}`;
}

function nikFromKode(kode: string, dob: Date, seq: number): string {
  return nik(kode.slice(0, 2), kode.slice(2), dob, seq);
}

const DISTRICTS_BY_CITY: Record<string, string[]> = {
  "Jakarta Pusat": ["Gambir", "Tanah Abang", "Menteng", "Senen", "Cempaka Putih", "Johar Baru", "Kemayoran", "Sawah Besar"],
  "Jakarta Selatan": ["Tebet", "Setiabudi", "Mampang Prapatan", "Pasar Minggu", "Kebayoran Lama", "Kebayoran Baru", "Cilandak", "Pancoran", "Jagakarsa", "Pesanggrahan"],
  "Jakarta Barat": ["Kembangan", "Kebon Jeruk", "Palmerah", "Grogol Petamburan", "Tambora", "Taman Sari", "Cengkareng", "Kalideres"],
  "Jakarta Timur": ["Matraman", "Pulogadung", "Jatinegara", "Kramatjati", "Cakung", "Duren Sawit", "Makasar", "Ciracas", "Cipayung"],
  "Jakarta Utara": ["Penjaringan", "Tanjung Priok", "Koja", "Cilincing", "Pademangan", "Kelapa Gading"],
  "Bandung": ["Andir", "Antapani", "Arcamanik", "Astanaanyar", "Babakan Ciparay", "Bandung Kidul", "Bandung Kulon", "Bandung Wetan", "Batununggal", "Bojongloa Kaler", "Bojongloa Kidul", "Cibeunying Kaler", "Cibeunying Kidul", "Cicadap", "Cicendo", "Cidadap", "Cinambo", "Coblong", "Gedebage", "Kiaracondong", "Lengkong", "Mandalajati", "Panyileukan", "Rancasari", "Regol", "Sukajadi", "Sukasari", "Sumur Bandung", "Ujungberung"],
  "Surabaya": ["Asemrowo", "Benowo", "Bubutan", "Bulak", "Dukuh Pakis", "Gayungan", "Genteng", "Gubeng", "Gununganyar", "Jambangan", "Karangpilang", "Kenjeran", "Krembangan", "Lakar Santri", "Mulyorejo", "Pabean Cantian", "Pakal", "Rungkut", "Sambikerep", "Sawahan", "Semampir", "Simokerto", "Sukolilo", "Sukomanunggal", "Tambaksari", "Tandes", "Tegalsari", "Tenggilis Mejoyo", "Wiyung", "Wonocolo", "Wonokromo"],
  "Medan": ["Medan Amplas", "Medan Area", "Medan Barat", "Medan Baru", "Medan Belawan", "Medan Deli", "Medan Denai", "Medan Helvetia", "Medan Johor", "Medan Kota", "Medan Labuhan", "Medan Maimun", "Medan Marelan", "Medan Perjuangan", "Medan Petisah", "Medan Polonia", "Medan Selayang", "Medan Sunggal", "Medan Tembung", "Medan Timur", "Medan Tuntungan"],
  "Makassar": ["Biringkanaya", "Bontoala", "Kepulauan Sangkarrang", "Makassar", "Manggala", "Mariso", "Panakkukang", "Rappocini", "Tallo", "Tamalanrea", "Tamalate", "Ujung Pandang", "Ujung Tanah", "Wajo"],
  "Denpasar": ["Denpasar Barat", "Denpasar Selatan", "Denpasar Timur", "Denpasar Utara"],
  "Yogyakarta": ["Danurejan", "Gedongtengen", "Gondokusuman", "Gondomanan", "Jetis", "Kotagede", "Kraton", "Mantrijeron", "Mergangsan", "Ngampilan", "Pakualaman", "Tegalrejo", "Umbulharjo", "Wirobrajan"],
  "Semarang": ["Semarang Barat", "Semarang Timur", "Semarang Selatan", "Semarang Utara", "Semarang Tengah", "Gajahmungkur", "Genuk", "Gunungpati", "Mijen", "Ngaliyan", "Pedurungan", "Tembalang", "Banyumanik", "Tugu", "Candisari", "Gayamsari"],
  "Palembang": ["Alang-Alang Lebar", "Bukit Kecil", "Gandus", "Ilir Barat I", "Ilir Barat II", "Ilir Timur I", "Ilir Timur II", "Kalidoni", "Kemuning", "Kertapati", "Plaju", "Sako", "Seberang Ulu I", "Seberang Ulu II", "Sematang Borang", "Sukarami"],
  "Tangerang": ["Batuceper", "Benda", "Cibodas", "Ciledug", "Cipondoh", "Jatiuwung", "Karang Tengah", "Karawaci", "Larangan", "Neglasari", "Periuk", "Pinang", "Tangerang"],
  "Batam": ["Batam Kota", "Batu Aji", "Batu Ampar", "Belakang Padang", "Bengkong", "Bulang", "Galang", "Lubuk Baja", "Nongsa", "Sagulung", "Sei Beduk", "Sekupang"],
  "Bekasi": ["Bantar Gebang", "Bekasi Barat", "Bekasi Selatan", "Bekasi Timur", "Bekasi Utara", "Jatiasih", "Jatisampurna", "Medan Satria", "Mustika Jaya", "Pondok Gede", "Pondok Melati", "Rawalumbu"],
  "Depok": ["Beji", "Bojongsari", "Cilodong", "Cimanggis", "Cinere", "Cipayung", "Limo", "Pancoran Mas", "Sawangan", "Sukmajaya", "Tapos"],
  "Bogor": ["Bogor Barat", "Bogor Selatan", "Bogor Tengah", "Bogor Timur", "Bogor Utara", "Tanah Sareal"],
  "Malang": ["Blimbing", "Kedungkandang", "Klojen", "Lowokwaru", "Sukun"],
  "Samarinda": ["Palaran", "Samarinda Ilir", "Samarinda Kota", "Samarinda Seberang", "Samarinda Ulu", "Samarinda Utara", "Sungai Kunjang", "Sungai Pinang", "Loa Janan Ilir"],
  "Balikpapan": ["Balikpapan Barat", "Balikpapan Kota", "Balikpapan Selatan", "Balikpapan Tengah", "Balikpapan Timur", "Balikpapan Utara"],
  "Pontianak": ["Pontianak Barat", "Pontianak Kota", "Pontianak Selatan", "Pontianak Tenggara", "Pontianak Timur", "Pontianak Utara"],
  "Pekanbaru": ["Bukit Raya", "Lima Puluh", "Marpoyan Damai", "Payung Sekaki", "Pekanbaru Kota", "Rumbai", "Rumbai Pesisir", "Sail", "Senapelan", "Sukajadi", "Tenayan Raya", "Tuah Madani"],
  "Manado": ["Bunaken", "Malalayang", "Mapanget", "Paal Dua", "Sario", "Singkil", "Tikala", "Tuminiting", "Wanea", "Wenang"],
  "Padang": ["Bungus Teluk Kabung", "Koto Tangah", "Kuranji", "Lubuk Begalung", "Lubuk Kilangan", "Nanggalo", "Padang Barat", "Padang Selatan", "Padang Timur", "Padang Utara", "Pauh"],
  "Bandar Lampung": ["Bumi Waras", "Enggal", "Kedamaian", "Kedaton", "Kemiling", "Labuhan Ratu", "Langkapura", "Panjang", "Rajabasa", "Sukabumi", "Sukarame", "Tanjung Karang Barat", "Tanjung Karang Pusat", "Tanjung Karang Timur", "Tanjung Senang", "Telukbetung Barat", "Telukbetung Selatan", "Telukbetung Timur", "Telukbetung Utara", "Way Halim"],
  "Ambon": ["Nusaniwe", "Sirimau", "Teluk Ambon", "Baguala", "Leitimur Selatan"],
  "Jayapura": ["Abepura", "Heram", "Jayapura Selatan", "Jayapura Utara", "Muara Tami"],
  "Mataram": ["Ampenan", "Cakranegara", "Mataram", "Sandubaya", "Sekarbela", "Selaparang"],
  "Kupang": ["Alak", "Kelapa Lima", "Kota Lama", "Kota Raja", "Maulafa", "Oebobo"],
  "Mamuju": ["Bonebone", "Kalumpang", "Mamuju", "Simboro", "Tapalang"],
  "Palu": ["Mantikulore", "Palu Barat", "Palu Selatan", "Palu Timur", "Palu Utara", "Tatanga", "Tawaeli", "Ulujadi"],
  "Kendari": ["Abeli", "Barat", "Kadia", "Kendari", "Kendari Barat", "Mandonga", "Puuwatu", "Wua-Wua"],
  "Gorontalo": ["Dungingi", "Kota Barat", "Kota Selatan", "Kota Tengah", "Kota Timur", "Kota Utara", "Sipatana"],
  "Banjarmasin": ["Banjarmasin Barat", "Banjarmasin Selatan", "Banjarmasin Tengah", "Banjarmasin Timur", "Banjarmasin Utara"],
  "Banda Aceh": ["Baiturrahman", "Banda Raya", "Jaya Baru", "Kuta Alam", "Kuta Raja", "Lueng Bata", "Meuraxa", "Syiah Kuala", "Ulee Kareng"],
  "Ternate": ["Moti", "Pulau Batang Dua", "Pulau Hiri", "Pulau Ternate", "Ternate Selatan", "Ternate Tengah", "Ternate Utara"],
  "Sorong": ["Klawuyuk", "Maladum Mes", "Malaimsimsa", "Sorong", "Sorong Barat", "Sorong Kepulauan", "Sorong Manoi", "Sorong Timur", "Sorong Utara"],
  "Jambi": ["Danau Teluk", "Jambi Selatan", "Jambi Timur", "Jelutung", "Kota Baru", "Pasar Jambi", "Pelayangan", "Telanaipura"],
  "Tarakan": ["Tarakan Barat", "Tarakan Tengah", "Tarakan Timur", "Tarakan Utara"],
  "Cimahi": ["Cimahi Selatan", "Cimahi Tengah", "Cimahi Utara"],
  "Tasikmalaya": ["Bungursari", "Cibeureum", "Cihideung", "Cipedes", "Indihiang", "Kawalu", "Mangkubumi", "Purbaratu", "Tamansari", "Tawang"],
  "Cilegon": ["Cibeber", "Cilegon", "Citangkil", "Gerogol", "Jombang", "Pulomerak", "Purwakarta"],
  "Serang": ["Cipocok Jaya", "Curug", "Kasemen", "Serang", "Taktakan", "Walantaka"],
  "Probolinggo": ["Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", "Kraksaan", "Krejengan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"],
  "Pasuruan": ["Bugul Kidul", "Gadingrejo", "Panggungrejo", "Purworejo"],
  "Mojokerto": ["Kranggan", "Magersari", "Prajuritkulon"],
  "Blitar": ["Kepanjen Kidul", "Sananwetan", "Sukorejo"],
  "Kediri": ["Kediri Kota", "Mojoroto", "Pesantren"],
  "Madiun": ["Kartoharjo", "Manguharjo", "Taman"],
  "Salatiga": ["Argomulyo", "Sidomukti", "Sidorejo", "Tingkir"],
  "Pekalongan": ["Pekalongan Barat", "Pekalongan Selatan", "Pekalongan Timur", "Pekalongan Utara"],
  "Tegal": ["Margadana", "Tegal Barat", "Tegal Selatan", "Tegal Timur"],
  "Magelang": ["Magelang Selatan", "Magelang Tengah", "Magelang Utara"],
  "Sukabumi": ["Baros", "Cibeureum", "Cikole", "Citamiang", "Gunungpuyuh", "Lembursitu", "Warudoyong"],
  "Banjar": ["Banjar", "Langensari", "Pataruman", "Purwaharja"],
  "Pangkal Pinang": ["Bukit Intan", "Gabek", "Gerunggang", "Girimaya", "Pangkal Balam", "Rangkui", "Taman Sari"],
  "Lubuklinggau": ["Lubuklinggau Barat I", "Lubuklinggau Barat II", "Lubuklinggau Selatan I", "Lubuklinggau Selatan II", "Lubuklinggau Timur I", "Lubuklinggau Timur II", "Lubuklinggau Utara I", "Lubuklinggau Utara II"],
  "Bengkulu": ["Gading Cempaka", "Kampung Melayu", "Muara Bangka Hulu", "Ratu Agung", "Ratu Samban", "Selebar", "Sungai Serut", "Teluk Segara"],
  "Pagar Alam": ["Dempo Selatan", "Dempo Tengah", "Dempo Utara", "Pagar Alam Selatan", "Pagar Alam Utara"],
  "Prabumulih": ["Cambai", "Prabumulih Barat", "Prabumulih Selatan", "Prabumulih Timur", "Prabumulih Utara", "Rambang Kapak Tengah"],
  "Dumai": ["Bukit Kapur", "Dumai Barat", "Dumai Kota", "Dumai Selatan", "Dumai Timur", "Medang Kampai", "Sungai Sembilan"],
  "Sibolga": ["Sibolga Kota", "Sibolga Sambas", "Sibolga Selatan", "Sibolga Utara"],
  "Tanjungbalai": ["Datuk Bandar", "Datuk Bandar Timur", "Sei Tualang Raso", "Tanjungbalai Selatan", "Tanjungbalai Utara", "Teluk Nibung"],
  "Pematangsiantar": ["Siantar Barat", "Siantar Marihat", "Siantar Martoba", "Siantar Marimbun", "Siantar Selatan", "Siantar Sitalasari", "Siantar Timur", "Siantar Utara"],
  "Tebing Tinggi": ["Bajenis", "Padang Hilir", "Padang Hulu", "Rambutan", "Tebing Tinggi Kota"],
  "Binjai": ["Binjai Barat", "Binjai Kota", "Binjai Selatan", "Binjai Timur", "Binjai Utara"],
  "Padang Sidempuan": ["Padang Sidempuan Angkola Julu", "Padang Sidempuan Batunadua", "Padang Sidempuan Hutaimbaru", "Padang Sidempuan Selatan", "Padang Sidempuan Tenggara", "Padang Sidempuan Utara"],
  "Gunungsitoli": ["Gunungsitoli", "Gunungsitoli Alo\'oa", "Gunungsitoli Barat", "Gunungsitoli Idanoi", "Gunungsitoli Selatan", "Gunungsitoli Utara"],
  "Sungai Penuh": ["Hamparan Rawang", "Koto Baru", "Kumun Debai", "Pesisir Bukit", "Pondok Tinggi", "Sungai Bungkal", "Sungai Penuh", "Tanah Kampung"],
  "Bau-Bau": ["Batupoaro", "Betoambari", "Bungi", "Kokalukuna", "Lea-Lea", "Murhum", "Sorawolio", "Wolio"],
  "Palopo": ["Bara", "Mungkajang", "Sendana", "Telluwanua", "Wara", "Wara Barat", "Wara Selatan", "Wara Timur", "Wara Utara"],
  "Parepare": ["Bacukiki", "Bacukiki Barat", "Soreang", "Ujung"],
  "Bitung": ["Aertembaga", "Girian", "Lembeh Selatan", "Lembeh Utara", "Maesa", "Matuari", "Madidir", "Ranowulu"],
  "Tomohon": ["Tomohon Barat", "Tomohon Selatan", "Tomohon Tengah", "Tomohon Timur", "Tomohon Utara"],
  "Kotamobagu": ["Kotamobagu Barat", "Kotamobagu Selatan", "Kotamobagu Timur", "Kotamobagu Utara"],
  "Tidore Kepulauan": ["Tidore", "Tidore Barat", "Tidore Selatan", "Tidore Timur", "Tidore Utara"],
  "Subulussalam": ["Longkib", "Penanggalan", "Rundeng", "Simpang Kiri", "Sultan Daulat"],
  "Lhokseumawe": ["Banda Sakti", "Blang Mangat", "Muara Dua", "Muara Satu"],
  "Langsa": ["Langsa Barat", "Langsa Baro", "Langsa Kota", "Langsa Lama", "Langsa Teungoh", "Langsa Timur"],
  "Sabang": ["Sukajaya", "Sukakarya"],
  "Sawahlunto": ["Barangin", "Lembah Segar", "Silungkang", "Talawi"],
  "Padang Panjang": ["Padang Panjang Barat", "Padang Panjang Timur"],
  "Bukittinggi": ["Aur Birugo Tigo Baleh", "Guguk Panjang", "Mandiangin Koto Selayan"],
  "Payakumbuh": ["Lamposi Tigo Nagari", "Payakumbuh Barat", "Payakumbuh Selatan", "Payakumbuh Timur", "Payakumbuh Utara"],
  "Solok": ["Lubuk Sikarah", "Tanjung Harapan"],
  "Pariaman": ["Pariaman Selatan", "Pariaman Tengah", "Pariaman Timur", "Pariaman Utara"],
  "Metro": ["Metro Barat", "Metro Pusat", "Metro Selatan", "Metro Timur", "Metro Utara"],
  "Bontang": ["Bontang Barat", "Bontang Selatan", "Bontang Utara"],
  "Singkawang": ["Singkawang Barat", "Singkawang Selatan", "Singkawang Tengah", "Singkawang Timur", "Singkawang Utara"],
  "Palangka Raya": ["Bukit Batu", "Jekan Raya", "Pahandut", "Rakumpit", "Sabangau"],
  "Tanjung Pinang": ["Bukit Bestari", "Tanjung Pinang Barat", "Tanjung Pinang Kota", "Tanjung Pinang Timur"],
  "Tual": ["Kur", "Pulau Dullah Selatan", "Pulau Dullah Utara", "Tayando Tam"],
};

const VILLAGES = [
  "Kelurahan Kebon Sirih", "Kelurahan Menteng", "Kelurahan Gondangdia", "Kelurahan Cikini",
  "Kelurahan Pegangsaan", "Kelurahan Cempaka Putih Barat", "Kelurahan Cempaka Putih Timur",
  "Kelurahan Rawasari", "Kelurahan Karang Anyar", "Kelurahan Gunung Sahari",
  "Kelurahan Pasar Baru", "Kelurahan Bungur", "Kelurahan Senen", "Kelurahan Kramat",
  "Desa Suka Maju", "Desa Sumber Rejo", "Desa Mekar Jaya", "Desa Cinta Damai",
  "Desa Harapan Jaya", "Desa Karya Bakti", "Desa Marga Mulya", "Desa Tunas Muda",
  "Kelurahan Sukamulya", "Kelurahan Cibeureum", "Kelurahan Babakan", "Kelurahan Cipinang",
  "Kelurahan Kebon Pala", "Kelurahan Balimester", "Kelurahan Ujung Menteng",
  "Desa Sumber Sari", "Desa Bumi Agung", "Desa Tanjung Sari", "Desa Wanasari",
  "Kelurahan Pasir Putih", "Kelurahan Cigugur", "Kelurahan Cimahi", "Kelurahan Cipedes",
  "Desa Cilame", "Desa Cisarua", "Desa Cihanjuang", "Desa Cikadut",
  "Kelurahan Sukabumi", "Kelurahan Cibodas", "Kelurahan Cikembang",
  "Desa Cipageran", "Desa Cimareme", "Desa Cimerang",
];

const STREET_NAMES = [
  "Jl. Merdeka", "Jl. Sudirman", "Jl. Thamrin", "Jl. Ahmad Yani", "Jl. Diponegoro",
  "Jl. Gajah Mada", "Jl. Pahlawan", "Jl. Pemuda", "Jl. Veteran", "Jl. Siliwangi",
  "Jl. Hasanuddin", "Jl. Pattimura", "Jl. Teuku Umar", "Jl. Imam Bonjol", "Jl. Proklamasi",
  "Jl. Sisingamangaraja", "Jl. MT Haryono", "Jl. HR Rasuna Said", "Jl. Gatot Subroto",
  "Jl. Panglima Polim", "Jl. Cik Ditiro", "Jl. Sam Ratulangi", "Jl. Kapten Tendean",
  "Jl. Arief Rahman Hakim", "Jl. Ki Hajar Dewantara", "Jl. RA Kartini", "Jl. Dewi Sartika",
  "Jl. Cut Nyak Dien", "Jl. Agus Salim", "Jl. HOS Cokroaminoto", "Jl. Sunan Kalijaga",
  "Jl. Anggrek", "Jl. Mawar", "Jl. Melati", "Jl. Kenanga", "Jl. Flamboyan",
  "Jl. Cendrawasih", "Jl. Merpati", "Jl. Nuri", "Jl. Rajawali", "Jl. Kutilang",
  "Jl. Cemara", "Jl. Akasia", "Jl. Mahoni", "Jl. Angsana", "Jl. Beringin",
  "Jl. Pulosari", "Jl. Cikuray", "Jl. Gede", "Jl. Salak", "Jl. Tangkuban Perahu",
  "Jl. Slamet Riyadi", "Jl. Jenderal Soedirman", "Jl. Kapten Pattimura", "Jl. Letjen Suprapto",
  "Jl. Danau Toba", "Jl. Danau Singkarak", "Jl. Danau Maninjau", "Jl. Danau Poso",
  "Jl. Gunung Krakatau", "Jl. Gunung Merapi", "Jl. Gunung Rinjani", "Jl. Gunung Bromo",
];

const ORG_NAMES = [
  "PMI Pusat", "PMI Kota", "PMI Kabupaten", "PMI Provinsi",
  "RSUD Dr. Soetomo", "RSUD Dr. Sardjito", "RSUP Dr. Hasan Sadikin",
  "RSUD Tarakan", "RSUD Fatmawati", "RSUP Persahabatan", "RSCM",
  "Rumah Sakit Umum Daerah", "Rumah Sakit Umum Pusat",
  "Puskesmas Kecamatan", "Puskesmas Kelurahan",
  "Klinik Sehat", "Klinik Medika", "Klinik Pratama",
  "Unit Donor Darah PMI", "UDD PMI Kota",
];

interface Region {
  p: string;
  pc: string;
  cities: { n: string; cc: string }[];
}

const REGIONS: Region[] = [
  { p: "Aceh", pc: "11", cities: [
    { n: "Banda Aceh", cc: "01" }, { n: "Sabang", cc: "02" }, { n: "Langsa", cc: "03" },
    { n: "Lhokseumawe", cc: "04" }, { n: "Subulussalam", cc: "05" },
    { n: "Aceh Selatan", cc: "06" }, { n: "Aceh Tenggara", cc: "07" }, { n: "Aceh Timur", cc: "08" },
    { n: "Aceh Tengah", cc: "09" }, { n: "Aceh Barat", cc: "10" }, { n: "Aceh Besar", cc: "11" },
    { n: "Pidie", cc: "12" }, { n: "Aceh Utara", cc: "13" }, { n: "Simeulue", cc: "14" },
    { n: "Aceh Singkil", cc: "15" }, { n: "Bireuen", cc: "16" }, { n: "Aceh Barat Daya", cc: "17" },
    { n: "Gayo Lues", cc: "18" }, { n: "Aceh Jaya", cc: "19" }, { n: "Nagan Raya", cc: "20" },
    { n: "Pidie Jaya", cc: "21" }, { n: "Bener Meriah", cc: "22" },
  ]},
  { p: "Sumatera Utara", pc: "12", cities: [
    { n: "Medan", cc: "01" }, { n: "Pematangsiantar", cc: "02" }, { n: "Sibolga", cc: "03" },
    { n: "Tanjungbalai", cc: "04" }, { n: "Binjai", cc: "05" }, { n: "Tebing Tinggi", cc: "06" },
    { n: "Padang Sidempuan", cc: "07" }, { n: "Gunungsitoli", cc: "08" },
    { n: "Tapanuli Selatan", cc: "09" }, { n: "Tapanuli Tengah", cc: "10" }, { n: "Tapanuli Utara", cc: "11" },
    { n: "Toba", cc: "12" }, { n: "Labuhanbatu", cc: "13" }, { n: "Asahan", cc: "14" },
    { n: "Simalungun", cc: "15" }, { n: "Dairi", cc: "16" }, { n: "Karo", cc: "17" },
    { n: "Deli Serdang", cc: "18" }, { n: "Langkat", cc: "19" }, { n: "Nias", cc: "20" },
    { n: "Humbang Hasundutan", cc: "21" }, { n: "Pakpak Bharat", cc: "22" },
    { n: "Samosir", cc: "23" }, { n: "Serdang Bedagai", cc: "24" },
    { n: "Batu Bara", cc: "25" }, { n: "Padang Lawas", cc: "26" },
    { n: "Padang Lawas Utara", cc: "27" }, { n: "Labuhanbatu Selatan", cc: "28" },
    { n: "Labuhanbatu Utara", cc: "29" }, { n: "Nias Selatan", cc: "30" },
    { n: "Nias Barat", cc: "31" }, { n: "Nias Utara", cc: "32" },
  ]},
  { p: "Sumatera Barat", pc: "13", cities: [
    { n: "Padang", cc: "01" }, { n: "Solok", cc: "02" }, { n: "Sawahlunto", cc: "03" },
    { n: "Padang Panjang", cc: "04" }, { n: "Bukittinggi", cc: "05" },
    { n: "Payakumbuh", cc: "06" }, { n: "Pariaman", cc: "07" },
    { n: "Pesisir Selatan", cc: "08" }, { n: "Solok", cc: "09" },
    { n: "Sijunjung", cc: "10" }, { n: "Tanah Datar", cc: "11" },
    { n: "Padang Pariaman", cc: "12" }, { n: "Agam", cc: "13" },
    { n: "Lima Puluh Kota", cc: "14" }, { n: "Pasaman", cc: "15" },
    { n: "Kepulauan Mentawai", cc: "16" }, { n: "Dharmasraya", cc: "17" },
    { n: "Solok Selatan", cc: "18" }, { n: "Pasaman Barat", cc: "19" },
  ]},
  { p: "Riau", pc: "14", cities: [
    { n: "Pekanbaru", cc: "01" }, { n: "Dumai", cc: "02" },
    { n: "Kampar", cc: "03" }, { n: "Indragiri Hulu", cc: "04" },
    { n: "Indragiri Hilir", cc: "05" }, { n: "Pelalawan", cc: "06" },
    { n: "Rokan Hulu", cc: "07" }, { n: "Rokan Hilir", cc: "08" },
    { n: "Siak", cc: "09" }, { n: "Kuantan Singingi", cc: "10" },
    { n: "Bengkalis", cc: "11" }, { n: "Meranti Islands", cc: "12" },
  ]},
  { p: "Jambi", pc: "15", cities: [
    { n: "Jambi", cc: "01" }, { n: "Sungai Penuh", cc: "02" },
    { n: "Kerinci", cc: "03" }, { n: "Merangin", cc: "04" },
    { n: "Sarolangun", cc: "05" }, { n: "Batanghari", cc: "06" },
    { n: "Muaro Jambi", cc: "07" }, { n: "Tanjung Jabung Barat", cc: "08" },
    { n: "Tanjung Jabung Timur", cc: "09" }, { n: "Bungo", cc: "10" },
    { n: "Tebo", cc: "11" },
  ]},
  { p: "Sumatera Selatan", pc: "16", cities: [
    { n: "Palembang", cc: "01" }, { n: "Pagar Alam", cc: "02" },
    { n: "Lubuklinggau", cc: "03" }, { n: "Prabumulih", cc: "04" },
    { n: "Ogan Komering Ulu", cc: "05" },
    { n: "Ogan Komering Ilir", cc: "06" }, { n: "Muara Enim", cc: "07" },
    { n: "Lahat", cc: "08" }, { n: "Musi Rawas", cc: "09" },
    { n: "Musi Banyuasin", cc: "10" }, { n: "Banyuasin", cc: "11" },
    { n: "Ogan Komering Ulu Selatan", cc: "12" },
    { n: "Ogan Komering Ulu Timur", cc: "13" }, { n: "Ogan Ilir", cc: "14" },
    { n: "Empat Lawang", cc: "15" }, { n: "Musi Rawas Utara", cc: "16" },
  ]},
  { p: "Bengkulu", pc: "17", cities: [
    { n: "Bengkulu", cc: "01" },
    { n: "Bengkulu Selatan", cc: "02" }, { n: "Rejang Lebong", cc: "03" },
    { n: "Bengkulu Utara", cc: "04" }, { n: "Kaur", cc: "05" },
    { n: "Seluma", cc: "06" }, { n: "Mukomuko", cc: "07" },
    { n: "Lebong", cc: "08" }, { n: "Kepahiang", cc: "09" },
    { n: "Bengkulu Tengah", cc: "10" },
  ]},
  { p: "Lampung", pc: "18", cities: [
    { n: "Bandar Lampung", cc: "01" }, { n: "Metro", cc: "02" },
    { n: "Lampung Selatan", cc: "03" }, { n: "Lampung Tengah", cc: "04" },
    { n: "Lampung Utara", cc: "05" }, { n: "Lampung Barat", cc: "06" },
    { n: "Tulang Bawang", cc: "07" }, { n: "Tanggamus", cc: "08" },
    { n: "Lampung Timur", cc: "09" }, { n: "Way Kanan", cc: "10" },
    { n: "Pesawaran", cc: "11" }, { n: "Pringsewu", cc: "12" },
    { n: "Mesuji", cc: "13" }, { n: "Tulang Bawang Barat", cc: "14" },
    { n: "Pesisir Barat", cc: "15" },
  ]},
  { p: "Bangka Belitung", pc: "19", cities: [
    { n: "Pangkal Pinang", cc: "01" },
    { n: "Bangka", cc: "02" }, { n: "Belitung", cc: "03" },
    { n: "Bangka Selatan", cc: "04" }, { n: "Bangka Tengah", cc: "05" },
    { n: "Bangka Barat", cc: "06" }, { n: "Belitung Timur", cc: "07" },
  ]},
  { p: "Kepulauan Riau", pc: "21", cities: [
    { n: "Batam", cc: "01" }, { n: "Tanjung Pinang", cc: "02" },
    { n: "Bintan", cc: "03" }, { n: "Karimun", cc: "04" },
    { n: "Natuna", cc: "05" }, { n: "Lingga", cc: "06" },
    { n: "Kepulauan Anambas", cc: "07" },
  ]},
  { p: "DKI Jakarta", pc: "31", cities: [
    { n: "Jakarta Pusat", cc: "01" }, { n: "Jakarta Selatan", cc: "02" },
    { n: "Jakarta Barat", cc: "03" }, { n: "Jakarta Timur", cc: "04" },
    { n: "Jakarta Utara", cc: "05" },
  ]},
  { p: "Jawa Barat", pc: "32", cities: [
    { n: "Bandung", cc: "01" }, { n: "Bekasi", cc: "02" }, { n: "Bogor", cc: "03" },
    { n: "Cimahi", cc: "04" }, { n: "Cirebon", cc: "05" }, { n: "Depok", cc: "06" },
    { n: "Sukabumi", cc: "07" }, { n: "Tasikmalaya", cc: "08" }, { n: "Banjar", cc: "09" },
    { n: "Bandung Barat", cc: "10" }, { n: "Bogor", cc: "11" },
    { n: "Ciamis", cc: "12" }, { n: "Cianjur", cc: "13" }, { n: "Cirebon", cc: "14" },
    { n: "Garut", cc: "15" }, { n: "Indramayu", cc: "16" }, { n: "Karawang", cc: "17" },
    { n: "Kuningan", cc: "18" }, { n: "Majalengka", cc: "19" },
    { n: "Pangandaran", cc: "20" }, { n: "Purwakarta", cc: "21" },
    { n: "Subang", cc: "22" }, { n: "Sukabumi", cc: "23" },
    { n: "Sumedang", cc: "24" }, { n: "Tasikmalaya", cc: "25" },
  ]},
  { p: "Jawa Tengah", pc: "33", cities: [
    { n: "Semarang", cc: "01" }, { n: "Surakarta", cc: "02" }, { n: "Salatiga", cc: "03" },
    { n: "Pekalongan", cc: "04" }, { n: "Tegal", cc: "05" }, { n: "Magelang", cc: "06" },
    { n: "Cilacap", cc: "07" }, { n: "Banyumas", cc: "08" }, { n: "Purbalingga", cc: "09" },
    { n: "Banjarnegara", cc: "10" }, { n: "Kebumen", cc: "11" }, { n: "Purworejo", cc: "12" },
    { n: "Wonosobo", cc: "13" }, { n: "Magelang", cc: "14" }, { n: "Boyolali", cc: "15" },
    { n: "Klaten", cc: "16" }, { n: "Sukoharjo", cc: "17" }, { n: "Wonogiri", cc: "18" },
    { n: "Karanganyar", cc: "19" }, { n: "Sragen", cc: "20" }, { n: "Grobogan", cc: "21" },
    { n: "Blora", cc: "22" }, { n: "Rembang", cc: "23" }, { n: "Pati", cc: "24" },
    { n: "Kudus", cc: "25" }, { n: "Jepara", cc: "26" }, { n: "Demak", cc: "27" },
    { n: "Semarang", cc: "28" }, { n: "Temanggung", cc: "29" }, { n: "Kendal", cc: "30" },
    { n: "Batang", cc: "31" }, { n: "Pekalongan", cc: "32" }, { n: "Pemalang", cc: "33" },
    { n: "Tegal", cc: "34" }, { n: "Brebes", cc: "35" },
  ]},
  { p: "DI Yogyakarta", pc: "34", cities: [
    { n: "Yogyakarta", cc: "01" },
    { n: "Sleman", cc: "02" }, { n: "Bantul", cc: "03" },
    { n: "Kulon Progo", cc: "04" }, { n: "Gunung Kidul", cc: "05" },
  ]},
  { p: "Jawa Timur", pc: "35", cities: [
    { n: "Surabaya", cc: "01" }, { n: "Malang", cc: "02" }, { n: "Kediri", cc: "03" },
    { n: "Blitar", cc: "04" }, { n: "Madiun", cc: "05" }, { n: "Mojokerto", cc: "06" },
    { n: "Pasuruan", cc: "07" }, { n: "Probolinggo", cc: "08" }, { n: "Batu", cc: "09" },
    { n: "Pacitan", cc: "10" }, { n: "Ponorogo", cc: "11" }, { n: "Trenggalek", cc: "12" },
    { n: "Tulungagung", cc: "13" }, { n: "Blitar", cc: "14" }, { n: "Kediri", cc: "15" },
    { n: "Malang", cc: "16" }, { n: "Lumajang", cc: "17" }, { n: "Jember", cc: "18" },
    { n: "Banyuwangi", cc: "19" }, { n: "Bondowoso", cc: "20" }, { n: "Situbondo", cc: "21" },
    { n: "Probolinggo", cc: "22" }, { n: "Pasuruan", cc: "23" }, { n: "Sidoarjo", cc: "24" },
    { n: "Mojokerto", cc: "25" }, { n: "Jombang", cc: "26" }, { n: "Nganjuk", cc: "27" },
    { n: "Madiun", cc: "28" }, { n: "Magetan", cc: "29" }, { n: "Ngawi", cc: "30" },
    { n: "Bojonegoro", cc: "31" }, { n: "Tuban", cc: "32" }, { n: "Lamongan", cc: "33" },
    { n: "Gresik", cc: "34" }, { n: "Bangkalan", cc: "35" }, { n: "Sampang", cc: "36" },
    { n: "Pamekasan", cc: "37" }, { n: "Sumenep", cc: "38" },
  ]},
  { p: "Banten", pc: "36", cities: [
    { n: "Tangerang", cc: "01" }, { n: "Cilegon", cc: "02" }, { n: "Serang", cc: "03" },
    { n: "Tangerang Selatan", cc: "04" },
    { n: "Pandeglang", cc: "05" }, { n: "Lebak", cc: "06" }, { n: "Tangerang", cc: "07" },
    { n: "Serang", cc: "08" },
  ]},
  { p: "Bali", pc: "51", cities: [
    { n: "Denpasar", cc: "01" },
    { n: "Badung", cc: "02" }, { n: "Bangli", cc: "03" }, { n: "Buleleng", cc: "04" },
    { n: "Gianyar", cc: "05" }, { n: "Jembrana", cc: "06" }, { n: "Karangasem", cc: "07" },
    { n: "Klungkung", cc: "08" }, { n: "Tabanan", cc: "09" },
  ]},
  { p: "Nusa Tenggara Barat", pc: "52", cities: [
    { n: "Mataram", cc: "01" }, { n: "Bima", cc: "02" },
    { n: "Lombok Barat", cc: "03" }, { n: "Lombok Tengah", cc: "04" },
    { n: "Lombok Timur", cc: "05" }, { n: "Sumbawa", cc: "06" },
    { n: "Dompu", cc: "07" }, { n: "Bima", cc: "08" },
    { n: "Sumbawa Barat", cc: "09" }, { n: "Lombok Utara", cc: "10" },
  ]},
  { p: "Nusa Tenggara Timur", pc: "53", cities: [
    { n: "Kupang", cc: "01" },
    { n: "Kupang", cc: "02" }, { n: "Timor Tengah Selatan", cc: "03" },
    { n: "Timor Tengah Utara", cc: "04" }, { n: "Belu", cc: "05" },
    { n: "Alor", cc: "06" }, { n: "Flores Timur", cc: "07" },
    { n: "Sikka", cc: "08" }, { n: "Ende", cc: "09" }, { n: "Ngada", cc: "10" },
    { n: "Manggarai", cc: "11" }, { n: "Sumba Timur", cc: "12" },
    { n: "Sumba Barat", cc: "13" }, { n: "Lembata", cc: "14" },
    { n: "Rote Ndao", cc: "15" }, { n: "Manggarai Barat", cc: "16" },
    { n: "Manggarai Timur", cc: "17" }, { n: "Sabu Raijua", cc: "18" },
    { n: "Malaka", cc: "19" }, { n: "Sumba Tengah", cc: "20" },
    { n: "Sumba Barat Daya", cc: "21" }, { n: "Nagekeo", cc: "22" },
  ]},
  { p: "Kalimantan Barat", pc: "61", cities: [
    { n: "Pontianak", cc: "01" }, { n: "Singkawang", cc: "02" },
    { n: "Sambas", cc: "03" }, { n: "Bengkayang", cc: "04" },
    { n: "Landak", cc: "05" }, { n: "Mempawah", cc: "06" },
    { n: "Sanggau", cc: "07" }, { n: "Ketapang", cc: "08" },
    { n: "Sintang", cc: "09" }, { n: "Kapuas Hulu", cc: "10" },
    { n: "Sekadau", cc: "11" }, { n: "Melawi", cc: "12" },
    { n: "Kayong Utara", cc: "13" }, { n: "Kubu Raya", cc: "14" },
  ]},
  { p: "Kalimantan Tengah", pc: "62", cities: [
    { n: "Palangka Raya", cc: "01" },
    { n: "Kotawaringin Barat", cc: "02" }, { n: "Kotawaringin Timur", cc: "03" },
    { n: "Kapuas", cc: "04" }, { n: "Barito Selatan", cc: "05" },
    { n: "Barito Utara", cc: "06" }, { n: "Katingan", cc: "07" },
    { n: "Seruyan", cc: "08" }, { n: "Sukamara", cc: "09" },
    { n: "Lamandau", cc: "10" }, { n: "Gunung Mas", cc: "11" },
    { n: "Pulang Pisau", cc: "12" }, { n: "Murung Raya", cc: "13" },
    { n: "Barito Timur", cc: "14" },
  ]},
  { p: "Kalimantan Selatan", pc: "63", cities: [
    { n: "Banjarmasin", cc: "01" }, { n: "Banjarbaru", cc: "02" },
    { n: "Tanah Laut", cc: "03" }, { n: "Kotabaru", cc: "04" },
    { n: "Banjar", cc: "05" }, { n: "Barito Kuala", cc: "06" },
    { n: "Tapin", cc: "07" }, { n: "Hulu Sungai Selatan", cc: "08" },
    { n: "Hulu Sungai Tengah", cc: "09" }, { n: "Hulu Sungai Utara", cc: "10" },
    { n: "Tabalong", cc: "11" }, { n: "Tanah Bumbu", cc: "12" },
    { n: "Balangan", cc: "13" },
  ]},
  { p: "Kalimantan Timur", pc: "64", cities: [
    { n: "Samarinda", cc: "01" }, { n: "Balikpapan", cc: "02" },
    { n: "Bontang", cc: "03" },
    { n: "Paser", cc: "04" }, { n: "Kutai Kartanegara", cc: "05" },
    { n: "Berau", cc: "06" }, { n: "Kutai Barat", cc: "07" },
    { n: "Kutai Timur", cc: "08" }, { n: "Penajam Paser Utara", cc: "09" },
    { n: "Mahakam Ulu", cc: "10" },
  ]},
  { p: "Kalimantan Utara", pc: "65", cities: [
    { n: "Tarakan", cc: "01" },
    { n: "Bulungan", cc: "02" }, { n: "Malinau", cc: "03" },
    { n: "Nunukan", cc: "04" }, { n: "Tana Tidung", cc: "05" },
  ]},
  { p: "Sulawesi Utara", pc: "71", cities: [
    { n: "Manado", cc: "01" }, { n: "Bitung", cc: "02" }, { n: "Tomohon", cc: "03" },
    { n: "Kotamobagu", cc: "04" },
    { n: "Sangihe", cc: "05" }, { n: "Minahasa", cc: "06" },
    { n: "Kepulauan Talaud", cc: "07" }, { n: "Minahasa Selatan", cc: "08" },
    { n: "Minahasa Utara", cc: "09" }, { n: "Minahasa Tenggara", cc: "10" },
    { n: "Bolaang Mongondow", cc: "11" }, { n: "Bolaang Mongondow Selatan", cc: "12" },
    { n: "Bolaang Mongondow Timur", cc: "13" }, { n: "Bolaang Mongondow Utara", cc: "14" },
    { n: "Kepulauan Siau Tagulandang Biaro", cc: "15" },
  ]},
  { p: "Sulawesi Tengah", pc: "72", cities: [
    { n: "Palu", cc: "01" },
    { n: "Banggai", cc: "02" }, { n: "Poso", cc: "03" }, { n: "Donggala", cc: "04" },
    { n: "Toli-Toli", cc: "05" }, { n: "Buol", cc: "06" }, { n: "Parigi Moutong", cc: "07" },
    { n: "Tojo Una-Una", cc: "08" }, { n: "Banggai Kepulauan", cc: "09" },
    { n: "Morowali", cc: "10" }, { n: "Banggai Laut", cc: "11" },
    { n: "Morowali Utara", cc: "12" }, { n: "Sigi", cc: "13" },
  ]},
  { p: "Sulawesi Selatan", pc: "73", cities: [
    { n: "Makassar", cc: "01" }, { n: "Parepare", cc: "02" }, { n: "Palopo", cc: "03" },
    { n: "Bantaeng", cc: "04" }, { n: "Barru", cc: "05" },
    { n: "Bone", cc: "06" }, { n: "Bulukumba", cc: "07" }, { n: "Enrekang", cc: "08" },
    { n: "Gowa", cc: "09" }, { n: "Jeneponto", cc: "10" },
    { n: "Kepulauan Selayar", cc: "11" }, { n: "Luwu", cc: "12" },
    { n: "Luwu Timur", cc: "13" }, { n: "Luwu Utara", cc: "14" },
    { n: "Maros", cc: "15" }, { n: "Pangkajene Kepulauan", cc: "16" },
    { n: "Pinrang", cc: "17" }, { n: "Sidenreng Rappang", cc: "18" },
    { n: "Sinjai", cc: "19" }, { n: "Soppeng", cc: "20" }, { n: "Takalar", cc: "21" },
    { n: "Tana Toraja", cc: "22" }, { n: "Toraja Utara", cc: "23" },
    { n: "Wajo", cc: "24" },
  ]},
  { p: "Sulawesi Tenggara", pc: "74", cities: [
    { n: "Kendari", cc: "01" }, { n: "Bau-Bau", cc: "02" },
    { n: "Kolaka", cc: "03" }, { n: "Konawe", cc: "04" },
    { n: "Muna", cc: "05" }, { n: "Buton", cc: "06" },
    { n: "Konawe Selatan", cc: "07" }, { n: "Bombana", cc: "08" },
    { n: "Wakatobi", cc: "09" }, { n: "Kolaka Utara", cc: "10" },
    { n: "Konawe Utara", cc: "11" }, { n: "Buton Utara", cc: "12" },
    { n: "Konawe Kepulauan", cc: "13" }, { n: "Muna Barat", cc: "14" },
    { n: "Buton Tengah", cc: "15" }, { n: "Buton Selatan", cc: "16" },
    { n: "Kolaka Timur", cc: "17" },
  ]},
  { p: "Gorontalo", pc: "75", cities: [
    { n: "Gorontalo", cc: "01" },
    { n: "Gorontalo", cc: "02" }, { n: "Boalemo", cc: "03" },
    { n: "Bone Bolango", cc: "04" }, { n: "Pahuwato", cc: "05" },
    { n: "Gorontalo Utara", cc: "06" },
  ]},
  { p: "Sulawesi Barat", pc: "76", cities: [
    { n: "Mamuju", cc: "01" },
    { n: "Mamuju Selatan", cc: "02" }, { n: "Mamuju Tengah", cc: "03" },
    { n: "Majene", cc: "04" }, { n: "Polewali Mandar", cc: "05" },
    { n: "Pasangkayu", cc: "06" },
  ]},
  { p: "Maluku", pc: "81", cities: [
    { n: "Ambon", cc: "01" }, { n: "Tual", cc: "02" },
    { n: "Maluku Tengah", cc: "03" }, { n: "Maluku Tenggara", cc: "04" },
    { n: "Maluku Tenggara Barat", cc: "05" }, { n: "Buru", cc: "06" },
    { n: "Seram Bagian Timur", cc: "07" }, { n: "Seram Bagian Barat", cc: "08" },
    { n: "Kepulauan Aru", cc: "09" }, { n: "Buru Selatan", cc: "10" },
  ]},
  { p: "Maluku Utara", pc: "82", cities: [
    { n: "Ternate", cc: "01" }, { n: "Tidore Kepulauan", cc: "02" },
    { n: "Halmahera Barat", cc: "03" }, { n: "Halmahera Tengah", cc: "04" },
    { n: "Halmahera Timur", cc: "05" }, { n: "Halmahera Selatan", cc: "06" },
    { n: "Halmahera Utara", cc: "07" }, { n: "Kepulauan Sula", cc: "08" },
    { n: "Pulau Morotai", cc: "09" }, { n: "Pulau Taliabu", cc: "10" },
  ]},
  { p: "Papua", pc: "91", cities: [
    { n: "Jayapura", cc: "01" },
    { n: "Jayapura", cc: "02" }, { n: "Biak Numfor", cc: "03" },
    { n: "Kepulauan Yapen", cc: "04" }, { n: "Mamberamo Raya", cc: "05" },
    { n: "Sarmi", cc: "06" }, { n: "Keerom", cc: "07" },
    { n: "Waropen", cc: "08" }, { n: "Supiori", cc: "09" },
  ]},
  { p: "Papua Barat", pc: "92", cities: [
    { n: "Sorong", cc: "01" },
    { n: "Sorong", cc: "02" }, { n: "Manokwari", cc: "03" },
    { n: "Fakfak", cc: "04" }, { n: "Kaimana", cc: "05" },
    { n: "Teluk Wondama", cc: "06" }, { n: "Teluk Bintuni", cc: "07" },
    { n: "Manokwari Selatan", cc: "08" }, { n: "Pegunungan Arfak", cc: "09" },
  ]},
  { p: "Papua Selatan", pc: "93", cities: [
    { n: "Merauke", cc: "01" },
    { n: "Mappi", cc: "02" }, { n: "Asmat", cc: "03" },
    { n: "Boven Digoel", cc: "04" },
  ]},
  { p: "Papua Tengah", pc: "94", cities: [
    { n: "Nabire", cc: "01" },
    { n: "Mimika", cc: "02" }, { n: "Paniai", cc: "03" },
    { n: "Dogiyai", cc: "04" }, { n: "Deiyai", cc: "05" },
    { n: "Puncak", cc: "06" }, { n: "Puncak Jaya", cc: "07" },
    { n: "Intan Jaya", cc: "08" },
  ]},
  { p: "Papua Pegunungan", pc: "95", cities: [
    { n: "Wamena", cc: "01" },
    { n: "Jayawijaya", cc: "02" }, { n: "Lanny Jaya", cc: "03" },
    { n: "Mamberamo Tengah", cc: "04" }, { n: "Nduga", cc: "05" },
    { n: "Tolikara", cc: "06" }, { n: "Yalimo", cc: "07" },
    { n: "Yahukimo", cc: "08" },
  ]},
  { p: "Papua Barat Daya", pc: "96", cities: [
    { n: "Sorong Selatan", cc: "01" },
    { n: "Raja Ampat", cc: "02" }, { n: "Tambrauw", cc: "03" },
    { n: "Maybrat", cc: "04" },
  ]},
];

const ALL_CITIES = REGIONS.flatMap(r =>
  r.cities.map(c => ({ ...c, province: r.p, pc: r.pc, kode: r.pc + c.cc }))
);

console.log(`Loaded ${ALL_CITIES.length} cities across ${REGIONS.length} provinces`);
const totalTarget = ALL_CITIES.reduce((s, _) => s + PER_CITY, 0);
console.log(`Target: ~${totalTarget.toLocaleString()} users (scale=${SCALE}, per_city=${PER_CITY})`);

function getDistricts(cityName: string): string[] {
  return DISTRICTS_BY_CITY[cityName] || [
    "Kecamatan " + faker.location.street().replace(/\s+/g, " "),
    "Kecamatan " + faker.location.street().replace(/\s+/g, " "),
    "Kecamatan " + faker.location.street().replace(/\s+/g, " "),
  ];
}

function generateUser(city: typeof ALL_CITIES[0], seq: number) {
  const gender = faker.helpers.arrayElement(["male", "female"]);
  const firstName = gender === "male" ? faker.person.firstName("male") : faker.person.firstName("female");
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const dob = randomDate(DOB_START, DOB_END);
  const bloodType = weightedRandom(BLOOD_DIST);
  const rhesus = RHESUS[bloodType];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${seq}@gmail.com`.replace(/[^a-z0-9.@]/g, "");
  const phone = `08${faker.string.numeric(10)}`;
  const weightKg = faker.number.int({ min: 45, max: 95 });
  const heightCm = faker.number.int({ min: 148, max: 185 });
  const districts = getDistricts(city.n);
  const district = faker.helpers.arrayElement(districts);
  const village = faker.helpers.arrayElement(VILLAGES);
  const street = faker.helpers.arrayElement(STREET_NAMES);
  const streetNo = faker.number.int({ min: 1, max: 200 });
  const lat = faker.location.latitude({ min: -8.5, max: 5.5 });
  const lng = faker.location.longitude({ min: 95, max: 141 });
  const totalDonations = faker.helpers.weightedArrayElement([
    { weight: 30, value: 0 },
    { weight: 25, value: faker.number.int({ min: 1, max: 3 }) },
    { weight: 20, value: faker.number.int({ min: 4, max: 10 }) },
    { weight: 12, value: faker.number.int({ min: 11, max: 20 }) },
    { weight: 7, value: faker.number.int({ min: 21, max: 50 }) },
    { weight: 4, value: faker.number.int({ min: 51, max: 100 }) },
    { weight: 2, value: faker.number.int({ min: 101, max: 200 }) },
  ]);
  const avgVol = weightKg <= 55 ? 0.35 : 0.45;
  const donationVolume = +(totalDonations * avgVol).toFixed(2);
  const points = totalDonations * 10;
  const eligibility = totalDonations >= 3 ? "eligible" : totalDonations > 0 ? "eligible" : "eligible";
  const availabilityStatus = faker.helpers.arrayElement(["available", "available", "available", "temporarily_unavailable", "inactive"]);
  const trustScore = totalDonations > 0
    ? Math.min(50 + totalDonations * 3 + Math.random() * 20, 100)
    : faker.number.int({ min: 20, max: 50 });
  const verificationLevel = totalDonations >= 10 ? 2 : totalDonations >= 3 ? 1 : 0;
  const createdAt = formatDate(randomDate(new Date("2023-01-01"), new Date("2026-06-09")));
  const lastDonationDate = totalDonations > 0
    ? formatDate(randomDate(new Date("2024-01-01"), new Date("2026-05-01")))
    : null;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${String(seq).padStart(3, "0")}`.replace(/[^a-z0-9]/g, "").slice(0, 30);
  const nikValue = nikFromKode(city.kode, dob, seq);
  const nationalDonorId = totalDonations > 0 ? `ND-${nikValue.slice(0, 12)}` : null;

  return {
    full_name: fullName,
    phone,
    email,
    password_hash: "",
    role: "donor",
    date_of_birth: formatDate(dob),
    gender,
    blood_type: bloodType,
    rhesus,
    weight_kg: weightKg,
    height_cm: heightCm,
    province: city.province,
    city: city.n,
    district,
    address: `${street} No. ${streetNo}, ${village}, ${district}, ${city.n}, ${city.province}`,
    latitude: lat,
    longitude: lng,
    username,
    avatar_url: null,
    availability_mode: "automatic",
    availability_status: availabilityStatus,
    ready_again_date: null,
    unavailable_reason: null,
    total_donations: totalDonations,
    last_donation_date: lastDonationDate,
    eligibility_status: eligibility,
    total_points: points,
    email_verified: true,
    national_donor_id: nationalDonorId,
    donation_volume_total: donationVolume,
    verification_level: verificationLevel,
    trust_score: +trustScore.toFixed(2),
    nik: nikValue,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function userColumns(): string[] {
  return [
    "full_name", "phone", "email", "password_hash", "role", "date_of_birth", "gender",
    "blood_type", "rhesus", "weight_kg", "height_cm", "province", "city", "district",
    "address", "latitude", "longitude", "username", "avatar_url", "availability_mode",
    "availability_status", "ready_again_date", "unavailable_reason", "total_donations",
    "last_donation_date", "eligibility_status", "total_points", "email_verified",
    "national_donor_id", "donation_volume_total", "verification_level", "trust_score",
    "nik", "created_at", "updated_at",
  ];
}

function userValues(u: ReturnType<typeof generateUser>): any[] {
  return [
    u.full_name, u.phone, u.email, u.password_hash, u.role, u.date_of_birth, u.gender,
    u.blood_type, u.rhesus, u.weight_kg, u.height_cm, u.province, u.city, u.district,
    u.address, u.latitude, u.longitude, u.username, u.avatar_url, u.availability_mode,
    u.availability_status, u.ready_again_date, u.unavailable_reason, u.total_donations,
    u.last_donation_date, u.eligibility_status, u.total_points, u.email_verified,
    u.national_donor_id, u.donation_volume_total, u.verification_level, u.trust_score,
    u.nik, u.created_at, u.updated_at,
  ];
}

function placeholderRow(cols: string[], offset: number): string {
  return `(${cols.map((_, i) => `$${offset + i + 1}`).join(", ")})`;
}

async function batchInsert(table: string, cols: string[], rows: any[][], conflict?: string) {
  if (rows.length === 0) return;
  const placeholders = rows.map((_, i) => placeholderRow(cols, i * cols.length)).join(", ");
  const flat = rows.flat();
  let sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${placeholders}`;
  if (conflict) sql += ` ON CONFLICT (${conflict}) DO NOTHING`;
  await pool.query(sql, flat);
}

function progressBar(current: number, total: number, label: string, startTime: number) {
  const pct = Math.min((current / total) * 100, 100);
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = current / elapsed || 0;
  const remaining = rate > 0 ? (total - current) / rate : 0;
  const barLen = 30;
  const filled = Math.round((pct / 100) * barLen);
  const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
  process.stdout.write(`\r${label}: [${bar}] ${pct.toFixed(1)}% | ${current.toLocaleString()}/${total.toLocaleString()} | ${rate.toFixed(0)}/s | ETA: ${remaining.toFixed(0)}s`);
}

async function seedProductionLike() {
  const hash = await bcrypt.hash("donor123", 12);
  const startTime = Date.now();

  console.log("Starting production-like seed...\n");

  // Phase 1: Users
  console.log("Phase 1/5: Generating users...");
  const userCols = userColumns();
  let totalInserted = 0;
  let batch: ReturnType<typeof generateUser>[] = [];
  let seq = 0;
  let skipped = 0;
  let phaseStart = Date.now();

  // Check existing emails to skip
  const { rows: existing } = await pool.query("SELECT email FROM users");
  const existingEmails = new Set(existing.map((r: any) => r.email));
  console.log(`  ${existingEmails.size} existing users in DB`);

  for (const city of ALL_CITIES) {
    for (let i = 0; i < PER_CITY; i++) {
      seq++;
      const user = generateUser(city, seq);
      if (existingEmails.has(user.email)) {
        skipped++;
        continue;
      }
      user.password_hash = hash;
      batch.push(user);

      if (batch.length >= BATCH) {
        await batchInsert("users", userCols, batch.map(userValues), "email");
        totalInserted += batch.length;
        batch = [];
        progressBar(totalInserted, totalTarget, "  Users", phaseStart);
      }
    }
  }
  if (batch.length > 0) {
    await batchInsert("users", userCols, batch.map(userValues), "email");
    totalInserted += batch.length;
  }
  progressBar(totalInserted, totalTarget, "  Users", phaseStart);
  console.log(`\n  Inserted: ${totalInserted.toLocaleString()}, Skipped: ${skipped.toLocaleString()}`);

  // Phase 2: Donor Histories (for users with donations)
  console.log("\nPhase 2/5: Generating donor histories...");
  const { rows: donors } = await pool.query(
    "SELECT id, total_donations, last_donation_date, blood_type FROM users WHERE total_donations > 0"
  );
  let histTotal = 0;
  phaseStart = Date.now();
  const histCols = ["user_id", "donation_date", "location", "institution", "bags", "notes", "verification_status", "created_at"];

  // Pre-generate donation records in batches
  let histBatch: any[][] = [];
  for (const donor of donors) {
    const count = donor.total_donations;
    let lastDate = donor.last_donation_date ? new Date(donor.last_donation_date) : new Date("2026-05-01");
    for (let h = 0; h < Math.min(count, 30); h++) {
      const donationDate = new Date(lastDate);
      donationDate.setDate(donationDate.getDate() - faker.number.int({ min: 90, max: 365 }));
      if (donationDate < new Date("2020-01-01")) continue;
      const inst = faker.helpers.arrayElement(ORG_NAMES);
      const bags = faker.number.int({ min: 1, max: 2 });
      const verified = faker.helpers.arrayElement(["verified", "verified", "verified", "pending"]);
      histBatch.push([
        donor.id, formatDate(donationDate),
        `${inst}, ${faker.helpers.arrayElement(STREET_NAMES)}`,
        inst, bags, "Donasi rutin", verified,
        formatDate(donationDate),
      ]);
      lastDate = donationDate;

      if (histBatch.length >= BATCH) {
        await batchInsert("donor_histories", histCols, histBatch);
        histTotal += histBatch.length;
        histBatch = [];
        progressBar(histTotal, donors.length * 5, "  Histories", phaseStart);
      }
    }
  }
  if (histBatch.length > 0) {
    await batchInsert("donor_histories", histCols, histBatch);
    histTotal += histBatch.length;
  }
  progressBar(histTotal, donors.length * 5, "  Histories", phaseStart);
  console.log(`\n  Inserted: ${histTotal.toLocaleString()} histories`);

  // Phase 3: Badges (award badges to users based on donations)
  console.log("\nPhase 3/5: Awarding badges...");
  const { rows: badgeList } = await pool.query("SELECT id, min_donations FROM badges ORDER BY min_donations");
  let badgeTotal = 0;
  phaseStart = Date.now();
  let badgeBatch: any[][] = [];

  for (const donor of donors) {
    const earned = badgeList.filter((b: any) => donor.total_donations >= b.min_donations);
    for (const badge of earned) {
      badgeBatch.push([donor.id, badge.id]);
      if (badgeBatch.length >= BATCH) {
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES ${badgeBatch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")} ON CONFLICT DO NOTHING`,
          badgeBatch.flat()
        );
        badgeTotal += badgeBatch.length;
        badgeBatch = [];
      }
    }
  }
  if (badgeBatch.length > 0) {
    await pool.query(
      `INSERT INTO user_badges (user_id, badge_id) VALUES ${badgeBatch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")} ON CONFLICT DO NOTHING`,
      badgeBatch.flat()
    );
    badgeTotal += badgeBatch.length;
  }
  console.log(`  Awarded: ${badgeTotal.toLocaleString()} badges`);

  // Phase 4: Blood requests
  console.log("\nPhase 4/5: Generating blood requests...");
  const { rows: requesterPool } = await pool.query("SELECT id, city, province FROM users ORDER BY RANDOM() LIMIT 1000");
  const reqCols = ["requester_id", "patient_name", "hospital", "blood_type", "rhesus", "bags", "fulfilled_bags", "urgency", "latitude", "longitude", "city", "contact_phone", "notes", "status", "created_at", "updated_at"];
  let reqTotal = 0;
  phaseStart = Date.now();
  let reqBatch: any[][] = [];

  for (const city of ALL_CITIES) {
    const requestsPerCity = faker.number.int({ min: 2, max: 5 });
    for (let r = 0; r < requestsPerCity; r++) {
      const requester = faker.helpers.arrayElement(requesterPool);
      const patient = `${faker.person.firstName()} ${faker.person.lastName().charAt(0)}.`;
      const hospital = faker.helpers.arrayElement(ORG_NAMES);
      const bt = weightedRandom(BLOOD_DIST);
      const rh = RHESUS[bt];
      const bags = faker.number.int({ min: 1, max: 5 });
      const urgency = faker.helpers.arrayElement(URGENCIES);
      const status = faker.helpers.arrayElement(STATUSES);
      const fulfillPct = status === "fulfilled" ? 1 : status === "cancelled" ? 0 : faker.number.float({ min: 0, max: 0.8 });
      const fulfilledBags = Math.round(bags * fulfillPct);
      const createdAt = formatDate(randomDate(new Date("2025-01-01"), new Date("2026-06-09")));

      reqBatch.push([
        requester.id, patient, hospital, bt, rh, bags, fulfilledBags, urgency,
        requester.latitude || 0, requester.longitude || 0,
        city.n, `08${faker.string.numeric(10)}`, "Permintaan darah", status,
        createdAt, createdAt,
      ]);

      if (reqBatch.length >= BATCH) {
        await batchInsert("blood_requests", reqCols, reqBatch);
        reqTotal += reqBatch.length;
        reqBatch = [];
        progressBar(reqTotal, ALL_CITIES.length * 3, "  Requests", phaseStart);
      }
    }
  }
  if (reqBatch.length > 0) {
    await batchInsert("blood_requests", reqCols, reqBatch);
    reqTotal += reqBatch.length;
  }
  progressBar(reqTotal, ALL_CITIES.length * 3, "  Requests", phaseStart);
  console.log(`\n  Inserted: ${reqTotal.toLocaleString()} requests`);

  // Phase 5: Events
  console.log("\nPhase 5/5: Generating events...");
  const eventCols = ["title", "description", "location", "city", "event_date", "start_time", "end_time", "organizer", "contact_phone", "quota", "status", "created_at", "updated_at"];
  let eventTotal = 0;
  phaseStart = Date.now();
  let eventBatch: any[][] = [];

  for (const city of ALL_CITIES) {
    const eventDate = formatDate(randomDate(new Date("2025-06-01"), new Date("2026-12-31")));
    const org = faker.helpers.arrayElement(ORG_NAMES);
    const venue = faker.helpers.arrayElement(STREET_NAMES);
    const stTime = `${String(faker.number.int({ min: 7, max: 10 })).padStart(2, "0")}:00`;
    const endTime = `${String(faker.number.int({ min: 13, max: 16 })).padStart(2, "0")}:00`;

    eventBatch.push([
      `Donor Darah - ${city.n}`, `Kegiatan donor darah bersama ${org} di ${city.n}. Ayo donor dan selamatkan nyawa!`,
      `${venue}, ${city.n}`, city.n, eventDate, stTime, endTime,
      org, `08${faker.string.numeric(10)}`,
      faker.number.int({ min: 30, max: 200 }),
      faker.helpers.arrayElement(EVENT_STATUSES),
      formatDate(randomDate(new Date("2025-01-01"), new Date("2026-06-09"))),
      formatDate(randomDate(new Date("2025-01-01"), new Date("2026-06-09"))),
    ]);
    eventTotal++;

    if (eventBatch.length >= BATCH) {
      await batchInsert("events", eventCols, eventBatch);
      eventBatch = [];
      progressBar(eventTotal, ALL_CITIES.length, "  Events", phaseStart);
    }
  }
  if (eventBatch.length > 0) {
    await batchInsert("events", eventCols, eventBatch);
  }
  progressBar(eventTotal, ALL_CITIES.length, "  Events", phaseStart);
  console.log(`\n  Inserted: ${eventTotal.toLocaleString()} events`);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(50)}`);
  console.log("SEED COMPLETE");
  console.log(`${"=".repeat(50)}`);
  console.log(`  Users:         ${totalInserted.toLocaleString()}`);
  console.log(`  Donor histories: ${histTotal.toLocaleString()}`);
  console.log(`  Badges awarded:  ${badgeTotal.toLocaleString()}`);
  console.log(`  Blood requests:  ${reqTotal.toLocaleString()}`);
  console.log(`  Events:         ${eventTotal.toLocaleString()}`);
  console.log(`  Time:           ${elapsed}s`);
  console.log(`${"=".repeat(50)}`);
  console.log("Dev login: any donor email / donor123");
  console.log("Example: budi.santoso1@gmail.com / donor123");

  await pool.end();
}

seedProductionLike().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
