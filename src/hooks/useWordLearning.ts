import { useState, useEffect, useCallback } from "react";
import { Word, DictionaryEntry, Identity } from "@/app/types/types";
import { getWordsFromChapter } from '@/app/utils/wordUtils';

export function useWordLearning() {
  const [examType, setExamType] = useState("");
  const [chapter, setChapter] = useState("");
  const [selectedIdentities, setSelectedIdentities] = useState<Identity[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [isChapterComplete, setIsChapterComplete] = useState(false);

  // Calculate chapters dynamically based on dictionary length
  const CHAPTERS = useCallback(() => {
    const wordsPerChapter = 20;
    const chapterCount = Math.ceil(dictionary.length / wordsPerChapter);
    return Array.from({ length: chapterCount }, (_, i) => ({
      id: String(i + 1),
      name: `第${i + 1}章`
    }));
  }, [dictionary]);

  // Reset chapter if it's out of bounds when dictionary changes
  useEffect(() => {
    const maxChapter = CHAPTERS().length.toString();
    if (parseInt(chapter) > parseInt(maxChapter) && maxChapter !== "0") {
      setChapter("1");
    }
  }, [CHAPTERS, chapter]);

  // Clear chapter selection when dictionary type changes
  useEffect(() => {
    setChapter("");
  }, [examType]);

  // 获取词典数据
  const fetchDictionary = useCallback(async () => {
    if (!examType) return; // Don't fetch if no exam type selected
    
    try {
      setDictionaryLoading(true);
      const response = await fetch(`/api/dictFetch?type=${examType}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${examType} dictionary`);
      }
      
      const data = await response.json();
      setDictionary(data.dictionary);
    } catch (err) {
      console.error('Error fetching dictionary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dictionary');
    } finally {
      setDictionaryLoading(false);
    }
  }, [examType]);

  // 当考试类型改变时获取新的字典
  useEffect(() => {
    if (examType) {
      fetchDictionary();
    }
  }, [examType, fetchDictionary]);

  // 获取单词数据
  const fetchWords = useCallback(async () => {
    if (!selectedIdentities.length || !dictionary.length || !chapter) return;
    
    // 创建一个 AbortController 实例
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      setLoading(true);
      setError(null);
      
      const chapterWords = getWordsFromChapter(dictionary, parseInt(chapter));
      const currentChapter = chapter; // 保存当前章节
      
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professions: selectedIdentities,
          category: examType,
          words: chapterWords,
        }),
        signal, // 添加 signal 到请求中
      });

      // 如果章节已经改变，取消这次请求的结果
      if (currentChapter !== chapter) {
        controller.abort();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch words');
      }

      const data = await response.json();
      setWords(data.words);
      setCurrentWordIndex(0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedIdentities, chapter, examType, dictionary]);

  // 当章节改变时获取新的单词数据
  useEffect(() => {
    // 如果没有选择章节，不做任何操作
    if (!chapter) return;

    // 检查是否有必要的数据
    if (!selectedIdentities.length || !dictionary.length) {
      console.log('缺少必要数据:', { 
        hasIdentities: selectedIdentities.length > 0, 
        hasDictionary: dictionary.length > 0 
      });
      return;
    }

    // 检查 localStorage 中是否有相同章节的数据
    const savedState = localStorage.getItem("wordLearningState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.words?.length > 0 && 
          state.chapter === chapter && 
          state.examType === examType) {
        console.log('使用缓存数据:', { chapter, examType });
        setWords(state.words);
        setCurrentWordIndex(state.currentWordIndex || 0);
        return;
      }
    }

    // 获取新数据
    console.log('获取新数据:', { chapter, examType });
    fetchWords();
    setCurrentWordIndex(0);
  }, [chapter, selectedIdentities, dictionary, examType, fetchWords]);

  // 保存状态到 localStorage
  useEffect(() => {
    if (selectedIdentities.length > 0) {
      const stateToSave = {
        selectedIdentities,
        examType,
        chapter,
        currentWordIndex,
        words,
      };
      localStorage.setItem("wordLearningState", JSON.stringify(stateToSave));
    }
  }, [selectedIdentities, examType, chapter, currentWordIndex, words]);

  // 重新生成单个例句
  const handleRegenerateSentence = async (profession: string) => {
    try {
      // Find the profession object from selectedIdentities that matches the profession ID
      const professionObj = selectedIdentities.find(i => i.id === profession);
      
      if (!professionObj) {
        throw new Error(`Profession ${profession} not found in selected identities`);
      }
      
      // Get the current word
      const currentWord = words[currentWordIndex];
      if (!currentWord) return;
      
      // Create a temporary array with just the current word for the API call
      const singleWordArray = [currentWord];
      
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professions: [professionObj], // Send only the specific profession
          category: examType,
          words: singleWordArray, // Send only the current word
          regenerateOnly: true, // Flag to indicate this is a regeneration request
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate sentence');
      }

      const data = await response.json();
      
      // Update the current word with the new sentence
      if (data.words && data.words.length > 0) {
        setWords(prevWords => {
          const newWords = [...prevWords];
          
          // Get the updated sentence
          const updatedWord = data.words[0];
          let updatedSentence = null;
          
          // Handle both Map-like and object structures
          if (updatedWord.sentences) {
            if (typeof updatedWord.sentences.get === 'function') {
              // If it's a Map
              updatedSentence = updatedWord.sentences.get(profession);
            } else if (typeof updatedWord.sentences === 'object') {
              // If it's a plain object
              updatedSentence = updatedWord.sentences[profession];
            }
          }
          
          if (updatedSentence) {
            // Create a new sentences Map with the updated sentence
            const currentSentences = newWords[currentWordIndex].sentences;
            
            // Handle the current sentences structure (Map or object)
            if (typeof currentSentences.set === 'function') {
              // If current sentences is a Map
              currentSentences.set(profession, updatedSentence);
            } else {
              // If current sentences is a plain object
              newWords[currentWordIndex] = {
                ...newWords[currentWordIndex],
                sentences: {
                  ...currentSentences,
                  [profession]: updatedSentence
                }
              };
              return newWords;
            }
            
            // If we're using a Map, we need to create a new word with the updated Map
            newWords[currentWordIndex] = {
              ...newWords[currentWordIndex],
              sentences: new Map(currentSentences)
            };
          }
          
          return newWords;
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error regenerating sentence:', err);
      return false;
    }
  };

  // Handle moving to next chapter
  const handleNextChapter = useCallback(() => {
    if (parseInt(chapter) < CHAPTERS().length) {
      const nextChapter = (parseInt(chapter) + 1).toString();
      setChapter(nextChapter);
      setCurrentWordIndex(0);
      setIsChapterComplete(false);
    }
  }, [chapter, CHAPTERS]);

  // Handle reviewing current chapter
  const handleReviewChapter = useCallback(() => {
    setCurrentWordIndex(0);
    setIsChapterComplete(false);
  }, []);

  // 处理上一个/下一个单词
  const handlePrevWord = () => {
    setCurrentWordIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextWord = () => {
    // 如果当前已经在最后一个单词，再点击"下一个"才显示庆祝页面
    if (currentWordIndex === words.length - 1) {
      setIsChapterComplete(true);
    } else {
      // 否则继续下一个单词
      setCurrentWordIndex(prev => Math.min(prev + 1, words.length - 1));
    }
  };

  // 播放单词发音
  const playWordAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // 播放句子发音
  const playSentenceAudio = (sentence: string) => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // 加载保存的状态
  useEffect(() => {
    const savedState = localStorage.getItem("wordLearningState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.selectedIdentities?.length > 0) {
        // 恢复所有保存的状态
        setSelectedIdentities(state.selectedIdentities);
        setExamType(state.examType || "");
        setChapter(state.chapter || "");
        setCurrentWordIndex(state.currentWordIndex || 0);
        setWords(state.words || []);
        return;
      }
    }

    // 如果没有完整的学习状态，检查是否有选择的身份
    const savedIdentities = localStorage.getItem("selectedIdentities");
    if (savedIdentities) {
      const identities = JSON.parse(savedIdentities);
      if (identities && identities.length > 0) {
        setSelectedIdentities(identities);
        return;
      }
    }

    // 如果没有任何状态，重定向到首页
    window.location.href = "/";
  }, []);

  // 检查是否选择了职业
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedIdentities.length === 0) {
        window.location.href = "/";
      }
    }, 1000); // 等待 1 秒，确保状态已经加载

    return () => clearTimeout(timer);
  }, [selectedIdentities]);

  return {
    examType,
    setExamType,
    chapter,
    setChapter,
    selectedIdentities,
    currentWordIndex,
    words,
    loading,
    error,
    dictionary,
    dictionaryLoading,
    isChapterComplete,
    setIsChapterComplete,
    CHAPTERS: CHAPTERS(),
    handleRegenerateSentence,
    handleNextChapter,
    handleReviewChapter,
    handlePrevWord,
    handleNextWord,
    playWordAudio,
    playSentenceAudio,
    currentWord: words[currentWordIndex] || {
      word: "",
      trans: [],
      usphone: "",
      ukphone: "",
      sentences: {},
    },
    resetLearning: () => {
      localStorage.removeItem("wordLearningState");
      window.location.href = "/";
    }
  };
}
