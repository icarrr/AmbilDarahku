import React from 'react';
import { BRAND } from '../brand';
import { Sfx } from '../cartoon/Sfx';
import { FONT_SANS } from '../theme';
import { ReelFrame, body, gradText, headline, rise, useIn } from './ReelFrame';
import { EVENT_ITEM_SEC, EVENT_TITLE_SEC, EventListProps, ReelEvent, eventListTimes } from './durations';

const MAX_EVENTS = 4;

/** "2026-12-05" → "Sabtu, 5 Desember" (parsed as a calendar date, no timezone drift). */
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
};
const fmtTime = (e: ReelEvent) => {
  const s = e.start_time?.slice(0, 5), en = e.end_time?.slice(0, 5);
  return s ? (en ? `${s}–${en}` : s) : ''; // local venue time; no zone label (PMI data spans WIB/WITA/WIT)
};

/** Sabtu: jadwal donor dari data event publik (/api/v1/events). */
export const EventList: React.FC<EventListProps> = (p) => {
  const t = eventListTimes(p);
  const events = p.events.slice(0, MAX_EVENTS);
  return (
    <ReelFrame contentSec={t.content}>
      <Sfx at={0.2} name="pop" volume={0.6} />
      {events.map((_, i) => <Sfx key={i} at={EVENT_TITLE_SEC + i * EVENT_ITEM_SEC} name="tap" volume={0.6} />)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Title title={p.title} subtitle={p.subtitle} />
        {events.map((e, i) => <Card key={i} e={e} at={EVENT_TITLE_SEC + i * EVENT_ITEM_SEC} />)}
        <Source text={p.sourceLabel} at={EVENT_TITLE_SEC + events.length * EVENT_ITEM_SEC} />
      </div>
    </ReelFrame>
  );
};

const Title: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const a = useIn(0.1), b = useIn(0.35);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...headline, fontSize: 66, ...rise(a) }}><span style={gradText}>{title}</span></div>
      {subtitle && <div style={{ ...body, fontSize: 36, marginTop: 10, ...rise(b, 20) }}>{subtitle}</div>}
    </div>
  );
};

const Card: React.FC<{ e: ReelEvent; at: number }> = ({ e, at }) => {
  const a = useIn(at);
  return (
    <div style={{
      display: 'flex', gap: 26, padding: '20px 26px', borderRadius: 28, background: 'rgba(255,255,255,.07)',
      border: '1px solid rgba(255,255,255,.12)', borderLeft: `8px solid ${BRAND.colors.accent}`, ...rise(a, 30),
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 28, color: BRAND.colors.accentLight, letterSpacing: '0.04em' }}>
          {fmtDate(e.event_date)}{fmtTime(e) ? ` · ${fmtTime(e)}` : ''}
        </div>
        <div style={{
          ...headline, fontSize: 38, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{e.title}</div>
        <div style={{ ...body, fontSize: 30, color: '#d6d3d1' }}>{[e.city, e.organizer].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
  );
};

const Source: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const a = useIn(at + 0.3);
  return <div style={{ ...body, fontSize: 30, color: '#a8a29e', marginTop: 8, ...rise(a, 16) }}>{text}</div>;
};
