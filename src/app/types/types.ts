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


export interface DictionaryEntry {
  name: string;
  trans: string[];
  usphone: string;
  ukphone: string;
}

// Add a declaration for canvas-confetti
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

  type ConfettiFunction = (options?: ConfettiOptions) => Promise<null>;

  const confetti: ConfettiFunction;
  export default confetti;
}
