import { Profession, Word, DictionaryEntry } from '../types/types';

// Helper function to create an empty sentences map
function createEmptySentences(): Map<string, { en: string; zh?: string }> {
  return new Map<string, { en: string; zh?: string }>();
}

export function getWordsFromChapter(data: DictionaryEntry[], chapter: number): Word[] {
  const wordsPerChapter = 20;
  const startIndex = (chapter - 1) * wordsPerChapter;
  const endIndex = startIndex + wordsPerChapter;
  
  return data.slice(startIndex, endIndex).map(entry => ({
    word: entry.name,
    translations: [],
    usphone: entry.usphone,
    ukphone: entry.ukphone,
    sentences: createEmptySentences(),
  }));
}

export function generatePrompt(words: Word[], profession: Profession): string {
  // Validate profession
  if (!profession) {
    throw new Error('Invalid profession: profession object is required');
  }
  if (!profession.id) {
    throw new Error(`Invalid profession: name is required, got ${JSON.stringify(profession)}`);
  }

  // Validate and extract word strings
  const wordStrings = words.map(w => {
    if (!w || !w.word) {
      throw new Error('Invalid word object: word property is required');
    }
    return w.word;
  }).filter(Boolean); // Remove any undefined/null values

  if (wordStrings.length === 0) {
    throw new Error('No valid words provided');
  }


  return `为以下单词提供词性、释义和专业例句。每个单词需要至少1-3个释义，每个释义都需要指出词性。例句应该体现该单词在${profession.label}领域中的专业用法。

单词列表：
${wordStrings.join('\n')}

请以JSON格式返回，格式如下：
{
  "words": {
    "word1": {
      "translations": [
        {
          "partOfSpeech": "词性",
          "meaning": "中文释义"
        }
      ],
      "sentence": {
        "en": "English sentence",
        "zh": "中文翻译"
      }
    }
  }
}
`;
}

export function mergeWordsWithSentences(words: Word[], aiResponse: string, profession: Profession) {
  // Validate inputs
  if (!words || !Array.isArray(words)) {
    throw new Error('Invalid words: must be an array');
  }

  if (!profession || !profession.id) {
    throw new Error('Invalid profession: id is required');
  }

  if (!aiResponse) {
    throw new Error('Invalid aiResponse: response is required');
  }
  
  try {
    const parsedResponse = JSON.parse(aiResponse);
    if (!parsedResponse.words) {
      throw new Error('Invalid AI response format: words object is missing');
    }

    words.forEach(word => {
      if (!word || !word.word) {
        console.warn('Invalid word object:', word);
        return;
      }

      const wordData = parsedResponse.words[word.word];
      if (wordData) {
        // Update translations
        if (wordData.translations) {
          word.translations = wordData.translations;
        }

        // Update sentence
        if (wordData.sentence && wordData.sentence.en) {
          word.sentences.set(profession.label, {
            en: wordData.sentence.en,
            zh: wordData.sentence.zh
          });
        }
      }
    });
  } catch (error) {
    console.error('Error merging words with sentences:', error);
  }
}