export interface Word {
  word: string;
  trans: string[];
  usphone: string;
  ukphone: string;
  sentences: Map<string, string>;
}

export interface Profession {
  id: string;
  label: string;
  icon?: React.ElementType;
  description: string;
  isCustom?: boolean;
}


export interface WordRequest {
  professions: Profession[];
  words: Word[];
  category?: string;
}

export interface WordResponse {
  words: Word[];
}


export interface Identity {
  id: string;
  description: string;
}

export enum DictType {
  CET4 = 'CET4',
  CET6 = 'CET6',
  GRE = 'GRE',
  PTE='PTE',
  TOEFL='TOEFL',
  IELTS='IELTS',
  KAOYAN='KAOYAN',
}

export interface DictionaryEntry {
  name: string;
  trans: string[];
  usphone: string;
  ukphone: string;
}

// Correctly declare the canvas-confetti module
declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ('square' | 'circle')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  // Just declare the function as the default value without export syntax
  function confetti(options?: ConfettiOptions): Promise<null>;
  // No export statement at all in module augmentation
}