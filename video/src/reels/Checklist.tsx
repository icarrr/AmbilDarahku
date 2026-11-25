import React from 'react';
import { Sfx } from '../cartoon/Sfx';
import { Mark, ReelFrame, body, gradText, headline, rise, useIn } from './ReelFrame';
import { CHECK_ITEM_SEC, CHECK_TITLE_SEC, ChecklistProps, checklistTimes } from './durations';

/** Selasa: judul lalu poin-poin yang dicentang satu per satu. */
export const Checklist: React.FC<ChecklistProps> = (p) => {
  const t = checklistTimes(p);
  return (
    <ReelFrame contentSec={t.content}>
      <Sfx at={0.2} name="pop" volume={0.6} />
      {p.items.map((_, i) => <Sfx key={i} at={CHECK_TITLE_SEC + i * CHECK_ITEM_SEC + 0.3} name="tap" volume={0.7} />)}
      {p.footnote && <Sfx at={t.footnoteAt} name="ping" volume={0.5} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <Title text={p.title} />
        {p.items.map((item, i) => <Item key={i} text={item} at={CHECK_TITLE_SEC + i * CHECK_ITEM_SEC} />)}
        {p.footnote && <Footnote text={p.footnote} at={t.footnoteAt} />}
      </div>
    </ReelFrame>
  );
};

const Title: React.FC<{ text: string }> = ({ text }) => {
  const a = useIn(0.1);
  return <div style={{ ...headline, fontSize: 80, marginBottom: 20, ...rise(a) }}><span style={gradText}>{text}</span></div>;
};

const Item: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const a = useIn(at), tick = useIn(at + 0.3, 12);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 28, padding: '26px 30px', borderRadius: 28,
      background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', ...rise(a, 30),
    }}>
      <div style={{ transform: `scale(${0.4 + 0.6 * tick})`, opacity: tick }}><Mark kind="yes" size={64} /></div>
      <div style={{ ...headline, fontSize: 52 }}>{text}</div>
    </div>
  );
};

const Footnote: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const a = useIn(at);
  return <div style={{ ...body, fontSize: 38, color: '#d6d3d1', marginTop: 10, ...rise(a, 20) }}>{text}</div>;
};
