import React from 'react';
import { Composition } from 'remotion';
import { FPS, Showcase, TOTAL_FRAMES } from './Showcase';
import { Story, STORY_FRAMES } from './Story';

export const Root: React.FC = () => (
  <>
    <Composition id="Showcase" component={Showcase} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="Story" component={Story} durationInFrames={STORY_FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
