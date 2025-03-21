import { Word } from '../types/types';

export const CURRENT_VERSION = 2;

interface WordLearningState {
  version?: number;
  selectedIdentities: any[];
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
export const migrateToLatestVersion = (oldData: any): WordLearningState => {
  let data = { ...oldData };
  const version = data.version || 1;

  if (version < 2) {
    // 迁移 words 数组中的每个单词项
    if (Array.isArray(data.words)) {
      data.words = data.words.map((word: any) => {
        // 处理旧版本的单词结构
        if (word.trans && !word.translations) {
          const newSentences = new Map<string, { en: string; zh?: string }>();
          //抓换旧的trans结构为translations
          if (Array.isArray(word.trans)) {
            word.translations = word.trans.map((trans: string) => ({
              partOfSpeech: "",  // 默认设置为动词，新数据会由 AI 重新生成正确的词性
              meaning: trans
            }));
          }
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

          return {
            ...word,
            translations: Array.isArray(word.trans) ? word.trans : [word.trans],
            sentences: newSentences
          };
        }
        return word;
      });
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
export const validateData = (data: any): boolean => {
  try {
    console.log('Validating data structure...');
    
    if (!data || typeof data !== 'object') {
      console.log('Failed: data is not an object');
      return false;
    }
    if (!Array.isArray(data.selectedIdentities)) {
      console.log('Failed: selectedIdentities is not an array');
      return false;
    }
    if (!Array.isArray(data.words)) {
      console.log('Failed: words is not an array');
      return false;
    }
    if (typeof data.currentWordIndex !== 'number') {
      console.log('Failed: currentWordIndex is not a number');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Data validation failed:', e);
    return false;
  }
};
