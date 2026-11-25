import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Sfx } from '../cartoon/Sfx';
import { Badge, ReelFrame, body, gradText, headline, rise, useIn } from './ReelFrame';
import { MythFactProps, mythFactTimes } from './durations';

/** Senin: MITOS ❌ → FAKTA ✅ → penjelasan singkat. */
export const MythFact: React.FC<MythFactProps> = (p) => {
  const t = mythFactTimes(p);
  return (
    <ReelFrame contentSec={t.content}>
      <Sfx at={0.2} name="pop" volume={0.7} />
      <Sfx at={t.factAt} name="whoosh" volume={0.6} />
      <Sfx at={t.factAt + 0.25} name="ping" volume={0.7} />
      <Sfx at={t.detailAt} name="pop" volume={0.5} />
      <Body {...p} factAt={t.factAt} detailAt={t.detailAt} />
    </ReelFrame>
  );
};

const Body: React.FC<MythFactProps & { factAt: number; detailAt: number }> = ({ myth, fact, detail, source, factAt, detailAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0.1), b = useIn(0.35);
  const f1 = useIn(factAt), f2 = useIn(factAt + 0.2), d = useIn(detailAt);
  // the myth shrinks back and gets struck through once the fact lands
  const m = interpolate(frame, [factAt * fps, factAt * fps + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shake = frame >= factAt * fps && frame < factAt * fps + 10 ? Math.sin(frame * 2.4) * 8 * (1 - m) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ ...rise(a), transform: `translateX(${shake}px) scale(${1 - 0.18 * m})`, transformOrigin: 'left top', opacity: a * (1 - 0.45 * m) }}>
        <Badge kind="no" text="MITOS" />
        <div style={{
          ...headline, fontSize: 84, marginTop: 28, ...rise(b),
          textDecoration: m > 0.5 ? 'line-through' : 'none', textDecorationColor: '#ef4444', textDecorationThickness: 8,
        }}>“{myth}”</div>
      </div>

      <div style={{ ...rise(f1) }}>
        <Badge kind="yes" text="FAKTA" />
        <div style={{ ...headline, fontSize: 76, marginTop: 28, ...rise(f2) }}>
          <span style={gradText}>{fact}</span>
        </div>
      </div>

      <div style={{ ...rise(d, 24) }}>
        <div style={{ ...body, fontSize: 44 }}>{detail}</div>
        {source && <div style={{ ...body, fontSize: 30, color: '#a8a29e', marginTop: 20 }}>Sumber: {source}</div>}
      </div>
    </div>
  );
};
