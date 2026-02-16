export {
  secondsToFrames,
  framesToSeconds,
  durationInFrames,
  clamp,
  getEasing,
  getProgress,
  isInRange,
} from './timing';

export { springConfigs } from './spring-configs';
export type { SpringConfigName } from './spring-configs';

export {
  parseTranscriptToWords,
  groupWordsIntoSegments,
  segmentTimedWords,
  parseAndSegment,
  getActiveWord,
  getActiveSegment,
} from './caption-parser';
