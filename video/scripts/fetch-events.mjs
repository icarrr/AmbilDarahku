// Build EventList props from the PUBLIC events API (privacy-filtered by toPublicEvent).
// usage: node scripts/fetch-events.mjs [--city Denpasar] [--from 2026-12-05] [--to 2026-12-06] [--max 3] [--title "..."]
// Writes content/events-<from>[-<city>].json. Only display fields are copied.
import fs from 'node:fs';
import path from 'node:path';

const API = process.env.EVENTS_API ?? 'https://ambildarahku.vercel.app/api/v1/events';
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) =>
  (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));

const today = new Date().toISOString().slice(0, 10);
const from = args.from ?? today;
const to = args.to ?? from;
const city = args.city?.toLowerCase();
const max = Number(args.max ?? 3);

// PMI titles arrive in ALL CAPS; title-case them for the video.
const nice = (s = '') => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()).replace(/\b(Pmi|Pt|Cv|Rs|Rsud|Smk|Sma|Smp|Sd|Bni|Bri|Bca|Gkpb|Gpib|Hkbp|Udd|Tni|Polri|Polres|Polda)\b/g, (w) => w.toUpperCase()).replace(/\s+/g, ' ').trim();

const found = [];
for (let offset = 0; offset < 600 && found.length < max; offset += 60) {
  const res = await fetch(`${API}?status=upcoming&limit=60&offset=${offset}`);
  if (!res.ok) throw new Error(`events API ${res.status}`);
  const { events = [] } = await res.json();
  for (const e of events) {
    if (e.event_date < from || e.event_date > to) continue;
    if (city && !(e.city ?? '').toLowerCase().includes(city)) continue;
    found.push({
      title: nice(e.title), city: e.city, event_date: e.event_date,
      start_time: e.start_time ?? undefined, end_time: e.end_time ?? undefined, organizer: e.organizer ?? undefined,
    });
    if (found.length >= max) break;
  }
  if (events.length < 60 || events.some((e) => e.event_date > to)) break; // sorted by date ascending
}

if (!found.length) {
  console.error(`No upcoming events between ${from} and ${to}${city ? ` in "${args.city}"` : ''}.`);
  process.exit(1);
}

const props = {
  title: args.title ?? (from === to ? 'Jadwal donor darah hari ini' : 'Jadwal donor akhir pekan ini'),
  subtitle: args.city ? `di ${found[0].city}` : '',
  sourceLabel: `Sumber: ${new Set(found.map((e) => e.organizer)).size === 1 && found[0].organizer ? found[0].organizer : 'PMI'} · selengkapnya di ambildarahku.vercel.app`,
  events: found,
};
// Copy-paste Instagram caption (reel.mjs writes it next to the MP4 as .txt).
const fmtDay = (d) => { const [y, m, dd] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); };
const cities = [...new Set(found.map((e) => e.city).filter(Boolean))];
const cityTags = cities.slice(0, 2).map((c) => `#donordarah${c.toLowerCase().replace(/[^a-z]/g, '')}`);
props.caption = [
  `${props.title}${cities.length === 1 ? ` di ${cities[0]}` : ''} 📍 Tag teman buat donor bareng!`,
  '',
  found.map((e) => `📍 ${e.title}\n🗓 ${fmtDay(e.event_date)}${e.start_time ? `, ${e.start_time}${e.end_time ? `–${e.end_time}` : ''} (waktu setempat)` : ''}`).join('\n\n'),
  '',
  `${props.sourceLabel.split(' · ')[0]}. Jadwal bisa berubah, cek lagi sebelum berangkat ya.`,
  'Jadwal lengkap per kota + daftar jadi pendonor 👉 link di bio @ambildarahku',
  '',
  ['#jadwaldonordarah', '#donordarah', ...cityTags, '#pmi', '#ambildarahku', '#satutetessejutaharapan'].join(' '),
].join('\n');

const out = path.join('content', `events-${from}${args.city ? `-${args.city.toLowerCase().replace(/\s+/g, '-')}` : ''}.json`);
fs.writeFileSync(out, JSON.stringify(props, null, 2) + '\n');
console.log(`wrote ${out} (${found.length} events)`);
