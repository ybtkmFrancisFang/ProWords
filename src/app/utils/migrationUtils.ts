import { Word } from '../types/types';

export const CURRENT_VERSION = 2;

interface Identity {
  id: string;
  name: string;
}

type OldSentenceType = string | { en: string; zh?: string };

interface OldWordStructure {
  word: string;
  usphone?: string;
  ukphone?: string;
  trans?: string[] | string;
  sentences?: Record<string, OldSentenceType>;
  translations?: Array<{ partOfSpeech: string; meaning: string }>;
}

interface WordLearningState {
  version: number;
  selectedIdentities: Identity[];
  words: Word[];
  currentWordIndex: number;
  examType?: string;
  chapter?: string;
}

/**
 * 迁移数据到最新版本
 * @param oldData 旧版本的数据
 * @returns 迁移后的新版本数据
 */
export const migrateToLatestVersion = (oldData: Partial<WordLearningState> & { words?: OldWordStructure[] }): WordLearningState => {
  const data: WordLearningState = {
    version: oldData.version || 1,
    selectedIdentities: oldData.selectedIdentities || [],
    words: [],
    currentWordIndex: oldData.currentWordIndex || 0,
    examType: oldData.examType,
    chapter: oldData.chapter
  };
  const version = data.version || 1;

  if (version < 2) {
    // 迁移 words 数组中的每个单词项
    if (Array.isArray(oldData.words)) {
      const newWords: Word[] = oldData.words.map((word: OldWordStructure): Word => {
        const newSentences = new Map<string, { en: string; zh?: string }>();
        
        // 转换旧的 sentences 结构为新的 Map 结构
        if (word.sentences) {
          Object.entries(word.sentences).forEach(([role, sentence]) => {
            if (typeof sentence === 'string') {
              newSentences.set(role, { en: sentence });
            } else if (sentence && typeof sentence === 'object' && 'en' in sentence) {
              newSentences.set(role, { 
                en: sentence.en as string,
                zh: 'zh' in sentence ? sentence.zh as string : undefined
              });
            }
          });
        }

        // 处理旧版本的单词结构
        if (word.trans && !word.translations) {
          return {
            word: word.word,
            usphone: word.usphone || '',
            ukphone: word.ukphone || '',
            translations: Array.isArray(word.trans) ? word.trans.map(t => ({ partOfSpeech: '', meaning: t })) : [{ partOfSpeech: '', meaning: word.trans as string }],
            sentences: newSentences
          };
        }

        return {
          word: word.word,
          usphone: word.usphone || '',
          ukphone: word.ukphone || '',
          translations: word.translations || [],
          sentences: newSentences
        };
      });
      data.words = newWords;
    }
  }

  // 设置新版本号
  data.version = CURRENT_VERSION;
  return data;
};

/**
 * 验证数据结构是否有效
 * @param data 需要验证的数据
 * @returns 数据是否有效
 */
export const validateData = (data: unknown): boolean => {
  try {
    console.log('Validating data structure...');
    
    if (!data || typeof data !== 'object') {
      console.log('Failed: data is not an object');
      return false;
    }

    const typedData = data as Partial<WordLearningState>;
    
    if (!Array.isArray(typedData.selectedIdentities)) {
      console.log('Failed: selectedIdentities is not an array');
      return false;
    }
    if (!Array.isArray(typedData.words)) {
      console.log('Failed: words is not an array');
      return false;
    }
    if (typeof typedData.currentWordIndex !== 'number') {
      console.log('Failed: currentWordIndex is not a number');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Data validation failed:', e);
    return false;
  }
};
