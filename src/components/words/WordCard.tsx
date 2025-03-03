import { motion } from "framer-motion";
import { Word } from "@/app/types/types";
import { WordSentences } from "@/components/words/WordSentences";

interface WordCardProps {
  currentWord: Word;
  currentWordIndex: number;
  wordsLength: number;
  handlePrevWord: () => void;
  handleNextWord: () => void;
  playWordAudio: (word: string) => void;
  handleRegenerateSentence: (profession: string) => Promise<boolean>;
  playSentenceAudio: (sentence: string) => void;
  isLastWord: boolean;
  onChapterComplete: () => void;
}

export function WordCard({
  currentWord,
  currentWordIndex,
  wordsLength,
  handlePrevWord,
  handleNextWord,
  playWordAudio,
  handleRegenerateSentence,
  playSentenceAudio,
  isLastWord,
  onChapterComplete
}: WordCardProps) {
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* WordSentences component with all word-related UI */}
      <WordSentences 
        currentWord={currentWord} 
        currentWordIndex={currentWordIndex}
        wordsLength={wordsLength}
        handlePrevWord={handlePrevWord}
        handleNextWord={handleNextWord}
        playWordAudio={playWordAudio}
        handleRegenerateSentence={handleRegenerateSentence}
        playSentenceAudio={playSentenceAudio}
        onNextChapter={isLastWord ? onChapterComplete : undefined}
      />
    </motion.div>
  );
}
