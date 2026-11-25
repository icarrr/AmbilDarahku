import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { Bubble } from './cartoon/Bubble';
import { Character, SmallPhone } from './cartoon/Character';
import { CartoonPhone, ChatCard } from './cartoon/Props';
import { EndCardV, HeartRain, HospitalV, RoomV } from './cartoon/Vertical';
import { Sfx } from './cartoon/Sfx';
import type { Layout, Timeline } from './timeline';
import { BRAND } from './brand';

/**
 * COPY — every line the audience reads. Bubbles ≤ ~40 chars, no emoji.
 * Product claims come from the live landing page (https://ambildarahku.vercel.app/):
 *  - "Cari Donor: Temukan donor berdasarkan golongan darah dan lokasi terdekat secara real-time."
 *  - "Hubungi Koordinasi: Terhubung langsung dengan koordinator atau donor melalui integrasi WhatsApp."
 *  - "Verifikasi Donor: Setiap donor melewati sistem verifikasi ..."
 * The coordinator's reply (chatReply) is the platform's voice: keep it polite and accurate.
 */
const COPY = {
  problem: 'Ibu butuh darah O, cari di mana ya…', // scene 1, thought bubble
  found: `Wih, ada ${BRAND.short}!`, // scene 2
  offer: 'Cari donor sesuai golongan darah!', // scene 2
  koor: 'Bisa langsung chat koordinator!', // scene 3
  verif: 'Donornya terverifikasi, aman!', // scene 3
  chatTitle: `Koordinator ${BRAND.short}`, // scene 4 chat header
  chatMe: 'Kak, Ibu saya butuh darah O di Jakarta', // scene 4: customer message
  chatReply: 'Baik, kami bantu hubungkan dengan pendonor terdekat.', // scene 4: coordinator reply
  thanks: 'Cepet banget, makasih kak!', // scene 4
  payoff: `Makasih ${BRAND.short}, Ibu aman!`, // scene 5
};

export const FPS = 30;
const TR = 15;
const sec = (s: number) => Math.round(s * FPS);
const SCENES = [sec(5), sec(10), sec(10), sec(7.5), sec(6), sec(4.5)];
export const STORY_FRAMES = SCENES.reduce((a, b) => a + b, 0) - TR * (SCENES.length - 1);
const TRANSITION_STARTS = SCENES.slice(0, -1).map((_, i) => SCENES.slice(0, i + 1).reduce((a, b) => a + b, 0) - TR * (i + 1));

const base = (): Timeline => ({
  duration: 0, cursor: [], clicks: [], scroll: [{ t: 0, y: 0 }],
  popup: { show: 999, hide: 999 }, lightbox: { open: 999, close: 999 }, hovers: [], swipes: [],
});

// ---------- portrait layout: phone on the right, character bottom-left, bubbles above the character ----------
const PHONE = { x: 467, y: 250, scale: 1.35 };
const GUY = { x: 225, floor: 1990, scale: 1 };
const TAIL = { x: 130, y: GUY.floor - 654 * GUY.scale - 26 };
const BW = 390; // bubble width in the narrow left column

// ---------- page scripts ----------
const phoneFind = (L: Layout): Timeline => {
  const S = (n: string) => Math.min(L.sections[n] ?? 0, L.max);
  return {
    ...base(),
    scroll: [{ t: 0, y: 0 }, { t: 2.4, y: 0 }, { t: 3.2, y: S('stats') - 24 }, { t: 4.8, y: S('stats') - 24 }, { t: 5.6, y: S('bantu') - 40 }],
    swipes: [{ from: 2.3, to: 3.05, up: true }, { from: 4.7, to: 5.45, up: true }],
  };
};

const phoneFeatures = (L: Layout): Timeline => {
  const b = Math.min((L.sections.bantu ?? 0) - 40, L.max);
  const deeper = Math.min(b + L.vh * 0.55, L.max);
  return {
    ...base(),
    scroll: [{ t: 0, y: b }, { t: 3.6, y: b }, { t: 4.4, y: deeper }, { t: 7.0, y: deeper }, { t: 7.9, y: 0 }],
    swipes: [{ from: 3.5, to: 4.25, up: true }, { from: 6.9, to: 7.75, up: false }],
    hovers: [{ target: 'heroCta', from: 8.5, to: 8.9 }],
    clicks: [{ t: 8.6, ...L.targets.heroCta }],
  };
};

// ---------- scenes ----------

const PhoneIn: React.FC<{ script: (L: Layout) => Timeline; enter?: boolean }> = ({ script, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = enter ? spring({ frame, fps, config: { damping: 14 } }) : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - up) * 1500}px) rotate(${(1 - up) * 8}deg)` }}>
      <CartoonPhone x={PHONE.x} y={PHONE.y} scale={PHONE.scale} script={script} hands />
    </div>
  );
};

const Masalah: React.FC = () => (
  <AbsoluteFill>
    <RoomV />
    <Character x={540} floor={1760} scale={1.4} poses={[{ t: 0, v: 'stand' }, { t: 0.5, v: 'think' }]} moods={[{ t: 0, v: 'worried' }]} sweat />
    <Sfx at={0.5} name="sigh" volume={0.7} />
    <Bubble x={470} y={1760 - 654 * 1.4 - 30} from={0.9} to={4.7} text={COPY.problem} width={560} thought />
  </AbsoluteFill>
);

const CariDiHP: React.FC = () => (
  <AbsoluteFill>
    <RoomV dim={0.12} table={false} />
    <PhoneIn script={phoneFind} enter />
    <Character x={GUY.x} floor={GUY.floor} scale={GUY.scale}
      poses={[{ t: 0, v: 'holdPhone' }]} moods={[{ t: 0, v: 'curious' }, { t: 5.8, v: 'happy' }]}
      talk={[[0.9, 2.0], [5.8, 7.0]]} rightHand={<SmallPhone />} />
    <Bubble x={TAIL.x} y={TAIL.y} from={0.9} to={4.4} width={BW} text={COPY.found} />
    <Bubble x={TAIL.x} y={TAIL.y} from={5.8} to={9.6} width={BW} text={COPY.offer} />
  </AbsoluteFill>
);

const CekFitur: React.FC = () => (
  <AbsoluteFill>
    <RoomV dim={0.12} table={false} />
    <PhoneIn script={phoneFeatures} />
    <Character x={GUY.x} floor={GUY.floor} scale={GUY.scale}
      poses={[{ t: 0, v: 'holdPhone' }, { t: 0.4, v: 'point' }, { t: 7.4, v: 'holdPhone' }]}
      moods={[{ t: 0, v: 'happy' }]} talk={[[0.6, 1.8], [4.7, 5.8]]} rightHand={<SmallPhone />} />
    <Bubble x={TAIL.x} y={TAIL.y} from={0.6} to={3.5} width={BW} text={COPY.koor} />
    <Bubble x={TAIL.x} y={TAIL.y} from={4.7} to={7.2} width={BW} text={COPY.verif} />
  </AbsoluteFill>
);

const ChatWA: React.FC = () => (
  <AbsoluteFill>
    <RoomV dim={0.15} />
    <div style={{ position: 'absolute', left: 84, top: 300, transform: 'scale(1.2)', transformOrigin: '0 0' }}>
    <ChatCard x={0} y={0} width={760} from={0.6} title={COPY.chatTitle} typing={[2.2, 3.3]} msgs={[
      { t: 1.2, me: true, text: COPY.chatMe },
      { t: 3.3, me: false, text: COPY.chatReply },
    ]} />
    </div>
    <Character x={540} floor={2010} scale={1} poses={[{ t: 0, v: 'holdPhone' }, { t: 4.2, v: 'cheer' }]}
      moods={[{ t: 0, v: 'curious' }, { t: 3.6, v: 'happy' }]} talk={[[4.4, 5.6]]} rightHand={<SmallPhone />} />
    <Bubble x={440} y={2010 - 654 - 26} from={4.4} to={7.2} width={520} text={COPY.thanks} />
  </AbsoluteFill>
);

const Payoff: React.FC = () => (
  <AbsoluteFill>
    <HospitalV />
    <HeartRain from={0.4} />
    <Sfx at={0.35} name="tada" volume={0.8} />
    <Character x={540} floor={1800} scale={1.3} poses={[{ t: 0, v: 'stand' }, { t: 0.3, v: 'cheer' }]} moods={[{ t: 0, v: 'happy' }]}
      jump={[0.4, 2.6]} talk={[[0.7, 2.2]]} />
    <Bubble x={440} y={1800 - 654 * 1.3 - 30} from={0.7} to={5.6} width={580} text={COPY.payoff} />
  </AbsoluteFill>
);

const slideT = () => <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: TR })} />;

export const Story: React.FC = () => (
  <>
    <Audio src={staticFile('audio/music.wav')}
      volume={(f) => 0.3 * interpolate(f, [STORY_FRAMES - 60, STORY_FRAMES - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    {TRANSITION_STARTS.map((f, i) => <Sfx key={i} at={f / FPS} name="whoosh" volume={0.55} />)}
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES[0]}><Masalah /></TransitionSeries.Sequence>
      {slideT()}
      <TransitionSeries.Sequence durationInFrames={SCENES[1]}><CariDiHP /></TransitionSeries.Sequence>
      {slideT()}
      <TransitionSeries.Sequence durationInFrames={SCENES[2]}><CekFitur /></TransitionSeries.Sequence>
      {slideT()}
      <TransitionSeries.Sequence durationInFrames={SCENES[3]}><ChatWA /></TransitionSeries.Sequence>
      {slideT()}
      <TransitionSeries.Sequence durationInFrames={SCENES[4]}><Payoff /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={SCENES[5]}><EndCardV /></TransitionSeries.Sequence>
    </TransitionSeries>
  </>
);
