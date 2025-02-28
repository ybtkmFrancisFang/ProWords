import { Profession, Word, DictionaryEntry } from '../types/types';

// Helper function to create an empty sentences map
function createEmptySentences(): Map<string, string> {
  return new Map<string, string>();
}

export function getWordsFromChapter(data: DictionaryEntry[], chapter: number): Word[] {
  const wordsPerChapter = 20;
  const startIndex = (chapter - 1) * wordsPerChapter;
  const endIndex = startIndex + wordsPerChapter;
  
  return data.slice(startIndex, endIndex).map(entry => ({
    word: entry.name,
    trans: entry.trans,
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


  return `You are a language learning assistant. I need you to create memorable example sentences for English vocabulary words.

  Professional Context:
  ${profession.id} (${profession.description})

  Requirements:
  1. For each word, create a sentence that naturally incorporates the word in the context of ${profession.id}'s work environment
  2. Make sentences moderately difficult - not too simple, not too complex
  3. Use everyday expressions and relatable scenarios that professionals encounter
  4. Create sentences that help learners remember the word through practical usage
  5. Connect the sentences to common workplace situations or daily professional activities
  6. Focus on practical language that would actually be used in this professional context
  7. Ensure sentences feel natural and conversational, not academic or textbook-like

  Words to create sentences for:
  ${wordStrings.map(w => `"${w}"`).join(', ')}

  Format the response as a JSON object with this structure:
  {
    "data": [
      {
        "word": "example",
        "sentences": "The software developer created an example to demonstrate how the new feature works in real-world scenarios."
      },
      // more words with sentences
    ]
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
    if (!parsedResponse.data || !Array.isArray(parsedResponse.data)) {
      throw new Error('Invalid AI response format: data array is missing');
    }

    const sentencesData = parsedResponse.data as Array<{ word: string; sentences: string }>;
  
    words.map(word => {
      if (!word || !word.word) {
        console.warn('Invalid word object:', word);
      }

      const matchingSentence = sentencesData.find(s => s.word === word.word);
      if (matchingSentence && matchingSentence.sentences) {
        word.sentences.set(profession.id, matchingSentence.sentences);
      }
    });
  } catch (error) {
    console.error('Error merging words with sentences:', error);
  }
}