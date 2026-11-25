import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ACCENT_GRAD, BRAND } from '../brand';
import { Sfx } from '../cartoon/Sfx';
import { FONT_SANS } from '../theme';
import { Badge, Mark, ReelFrame, body, headline, rise, useIn } from './ReelFrame';
import { QUIZ_COUNTDOWN_SEC, QuizProps, quizTimes } from './durations';

/** Jumat: pertanyaan → hitung mundur → jawaban menyala → penjelasan. */
export const Quiz: React.FC<QuizProps> = (p) => {
  const t = quizTimes(p);
  return (
    <ReelFrame contentSec={t.content}>
      <Sfx at={0.2} name="pop" volume={0.6} />
      {Array.from({ length: QUIZ_COUNTDOWN_SEC }, (_, i) => <Sfx key={i} at={t.countdownAt + i} name="click" volume={0.8} />)}
      <Sfx at={t.revealAt} name="tada" volume={0.7} />
      <Body {...p} {...t} />
    </ReelFrame>
  );
};

const Body: React.FC<QuizProps & ReturnType<typeof quizTimes>> = ({ question, options, correct, explanation, countdownAt, revealAt, explainAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0.1), b = useIn(0.3), e = useIn(explainAt);
  const revealed = frame >= revealAt * fps;
  const counting = frame >= countdownAt * fps && !revealed;
  const n = QUIZ_COUNTDOWN_SEC - Math.floor((frame - countdownAt * fps) / fps);
  const tickP = ((frame - countdownAt * fps) % fps) / fps;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div style={rise(a)}><Badge kind="plain" text="KUIS" /></div>
      <div style={{ ...headline, fontSize: 74, ...rise(b) }}>{question}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, position: 'relative' }}>
        {options.map((o, i) => <Option key={i} label={o} at={0.5 + i * 0.12} revealed={revealed} isCorrect={correct.includes(i)} />)}
        {counting && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              width: 220, height: 220, borderRadius: '50%', background: ACCENT_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_SANS, fontWeight: 600, fontSize: 130, color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.45)',
              transform: `scale(${1.25 - 0.25 * Math.min(1, tickP * 4)})`,
            }}>{n}</div>
          </div>
        )}
      </div>

      <div style={{ ...body, fontSize: 44, ...rise(e, 24) }}>{explanation}</div>
    </div>
  );
};

const Option: React.FC<{ label: string; at: number; revealed: boolean; isCorrect: boolean }> = ({ label, at, revealed, isCorrect }) => {
  const a = useIn(at);
  const on = revealed && isCorrect, off = revealed && !isCorrect;
  return (
    <div style={{
      height: 200, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, position: 'relative',
      background: on ? BRAND.colors.accent : 'rgba(255,255,255,.08)',
      border: `3px solid ${on ? BRAND.colors.accentLight : 'rgba(255,255,255,.15)'}`,
      boxShadow: on ? `0 0 50px ${BRAND.colors.accent}99` : 'none',
      opacity: a * (off ? 0.35 : 1), transform: `translateY(${(1 - a) * 30}px) scale(${on ? 1.04 : 1})`,
    }}>
      <div style={{ ...headline, fontSize: 96 }}>{label}</div>
      {on && <Mark kind="yes" size={60} />}
    </div>
  );
};
