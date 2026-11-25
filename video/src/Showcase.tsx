import React from 'react';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SiteScene } from './SiteScene';
import { BrandCard, LabelCard } from './theme';
import { DURATION } from './timeline';
import { BRAND } from './brand';

export const FPS = 30;
const TR = 15; // transition frames
const s = (sec: number) => Math.round(sec * FPS);

const SCENES = [s(3), s(1.8), s(DURATION.desktop), s(1.8), s(DURATION.mobile), s(3.5)];
export const TOTAL_FRAMES = SCENES.reduce((a, b) => a + b, 0) - TR * (SCENES.length - 1);

const T = () => <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />;

export const Showcase: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENES[0]}><BrandCard tagline={BRAND.eyebrow} /></TransitionSeries.Sequence>
    {T()}
    <TransitionSeries.Sequence durationInFrames={SCENES[1]}><LabelCard title="Desktop" sub="1440 × 900" /></TransitionSeries.Sequence>
    {T()}
    <TransitionSeries.Sequence durationInFrames={SCENES[2]}><SiteScene device="desktop" /></TransitionSeries.Sequence>
    {T()}
    <TransitionSeries.Sequence durationInFrames={SCENES[3]}><LabelCard title="Mobile" sub="390 × 844" /></TransitionSeries.Sequence>
    {T()}
    <TransitionSeries.Sequence durationInFrames={SCENES[4]}><SiteScene device="mobile" /></TransitionSeries.Sequence>
    {T()}
    <TransitionSeries.Sequence durationInFrames={SCENES[5]}><BrandCard tagline={BRAND.tagline} /></TransitionSeries.Sequence>
  </TransitionSeries>
);
