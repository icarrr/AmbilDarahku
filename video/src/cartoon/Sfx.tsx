import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';

export type SfxName = 'pop' | 'tap' | 'click' | 'whoosh' | 'ping' | 'coin' | 'moth' | 'sigh' | 'tada';

/** Play a generated sound effect (public/audio/<name>.wav) at `at` seconds into the current sequence. */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume = 1 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} layout="none">
      <Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};
