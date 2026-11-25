/**
 * Timing for the data-driven Reels templates. Pure functions of the props, so
 * `calculateMetadata` in Root.tsx can size each composition to its content.
 * All values are seconds; convert with `sec()`.
 */
export const REEL_FPS = 30;
export const OUTRO_SEC = 3;

export const sec = (s: number) => Math.round(s * REEL_FPS);

/** Rough reading time: ~3 words per second, clamped so short lines still breathe. */
export const readSec = (text: string | undefined, min: number, max: number) => {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.min(max, Math.max(min, words / 3));
};

// ---------- props ----------
export type MythFactProps = { myth: string; fact: string; detail: string; source?: string };
export type ChecklistProps = { title: string; items: string[]; footnote?: string };
export type QuizProps = { question: string; options: string[]; correct: number[]; explanation: string };
export type ReelEvent = {
  title: string;
  city: string;
  location?: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string;
  organizer?: string;
};
export type EventListProps = { title: string; subtitle?: string; events: ReelEvent[]; sourceLabel: string };

// ---------- timelines (content only; the outro is appended by ReelFrame) ----------
export const mythFactTimes = (p: MythFactProps) => {
  const myth = readSec(p.myth, 3, 5);
  const fact = readSec(p.fact, 3, 5);
  const detail = readSec(p.detail, 3.5, 7) + (p.source ? 1 : 0);
  return { factAt: myth, detailAt: myth + fact, content: myth + fact + detail };
};

export const CHECK_TITLE_SEC = 2;
export const CHECK_ITEM_SEC = 1.8;
export const checklistTimes = (p: ChecklistProps) => {
  const itemsEnd = CHECK_TITLE_SEC + p.items.length * CHECK_ITEM_SEC;
  const footnoteAt = itemsEnd + 0.4;
  return { itemsEnd, footnoteAt, content: footnoteAt + (p.footnote ? readSec(p.footnote, 2.5, 4) : 1.6) };
};

export const QUIZ_COUNTDOWN_SEC = 3;
export const quizTimes = (p: QuizProps) => {
  const question = readSec(p.question, 3, 5);
  const revealAt = question + QUIZ_COUNTDOWN_SEC;
  const explainAt = revealAt + 1.6;
  return { countdownAt: question, revealAt, explainAt, content: explainAt + readSec(p.explanation, 3, 6) };
};

export const EVENT_TITLE_SEC = 1.6;
export const EVENT_ITEM_SEC = 0.9;
export const eventListTimes = (p: EventListProps) => {
  const n = Math.min(p.events.length, 4);
  // cards stagger in fast, then the whole list holds long enough to read
  return { content: EVENT_TITLE_SEC + n * EVENT_ITEM_SEC + 2.5 + n * 1.4 };
};

export const totalFrames = (contentSec: number) => sec(contentSec + OUTRO_SEC);
