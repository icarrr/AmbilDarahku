import React from 'react';
import { Composition } from 'remotion';
import { FPS, Showcase, TOTAL_FRAMES } from './Showcase';
import { Story, STORY_FRAMES } from './Story';
import { Checklist } from './reels/Checklist';
import { EventList } from './reels/EventList';
import { MythFact } from './reels/MythFact';
import { Quiz } from './reels/Quiz';
import {
  ChecklistProps, EventListProps, MythFactProps, QuizProps, REEL_FPS,
  checklistTimes, eventListTimes, mythFactTimes, quizTimes, totalFrames,
} from './reels/durations';
import mythDefault from '../content/week-1/senin-mitos-gemuk.json';
import checklistDefault from '../content/week-1/selasa-syarat-donor.json';
import quizDefault from '../content/week-1/jumat-kuis-golongan-o.json';
import eventsDefault from '../content/example-events.json';

/** Data-driven Reels (1080x1920): render with `npm run reel -- <id> <props.json>`. */
const reel = { fps: REEL_FPS, width: 1080, height: 1920, durationInFrames: 1 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Showcase" component={Showcase} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="Story" component={Story} durationInFrames={STORY_FRAMES} fps={FPS} width={1080} height={1920} />

    <Composition id="MythFact" component={MythFact} {...reel} defaultProps={mythDefault as MythFactProps}
      calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(mythFactTimes(props).content) })} />
    <Composition id="Checklist" component={Checklist} {...reel} defaultProps={checklistDefault as ChecklistProps}
      calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(checklistTimes(props).content) })} />
    <Composition id="Quiz" component={Quiz} {...reel} defaultProps={quizDefault as QuizProps}
      calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(quizTimes(props).content) })} />
    <Composition id="EventList" component={EventList} {...reel} defaultProps={eventsDefault as EventListProps}
      calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(eventListTimes(props).content) })} />
  </>
);
