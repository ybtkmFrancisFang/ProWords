import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { WordRequest, WordResponse } from '../../types/types';
import { generatePrompt, mergeWordsWithSentences } from '../../utils/wordUtils';

// 初始化 OpenAI 客户端
const client = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: process.env.NEXT_PUBLIC_BASE_URL
});
  

export async function POST(req: NextRequest) {
  try {
      const { professions, words } = (await req.json()) as WordRequest;
      //define response
      const response: WordResponse = {
        words: [],
      };

      // Validate professions array
      if (!professions || !Array.isArray(professions) || professions.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request: professions must be a non-empty array' },
          { status: 400 }
        );
      }

      // Validate each profession has required fields
      const invalidProfession = professions.find(p => !p || !p.id);
      if (invalidProfession) {
        return NextResponse.json(
          { error: 'Invalid profession: each profession must have id' },
          { status: 400 }
        );
      }
      
      // Validate words array
      if (!words || !Array.isArray(words) || words.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request: words must be a non-empty array' },
          { status: 400 }
        );
      }

      // Validate each word has required fields
      const invalidWord = words.find(w => !w || !w.word || !Array.isArray(w.trans));
      if (invalidWord) {
        return NextResponse.json(
          { error: 'Invalid word: each word must have word and trans array', word: invalidWord },
          { status: 400 }
        );
      }
      // Initialize response with deep copy of words array
      response.words = words.map(word => ({
        ...word,
        sentences: new Map<string, string>(),
      }));

      for (const profession of professions) {
        // 生成提示词并调用 OpenAI API
        const prompt = generatePrompt(words, profession);
        const completion = await client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'o3-mini',
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const aiResponse = completion.choices[0].message.content;
        if (!aiResponse) {
          throw new Error('No response from OpenAI');
        }

        // Log the response for debugging
        
        // Update sentences in the deep copied array
        mergeWordsWithSentences(response.words, aiResponse, profession);
      }
    // Convert Map to regular object before sending response
    const serializedResponse = {
      words: response.words.map(word => ({
        ...word,
        sentences: Object.fromEntries(word.sentences)
      }))
    };
    
    return NextResponse.json(serializedResponse);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}