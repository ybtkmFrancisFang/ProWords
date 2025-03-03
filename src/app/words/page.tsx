"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Bot, Sparkles } from "lucide-react"
import { Identity, Word, DictionaryEntry } from "@/app/types/types"
import { getWordsFromChapter } from '@/app/utils/wordUtils'
import { ChapterComplete } from "@/components/ChapterComplete"

// Import the components from src/components/words/
import { WordHeader } from "@/components/words/WordHeader"
import { StudyConfiguration } from "@/components/words/StudyConfiguration"
import { WordCard } from "@/components/words/WordCard"

export default function WordsPage() {
  const [examType, setExamType] = useState<"CET4" | "CET6" | "">("")
  const [chapter, setChapter] = useState("")
  const [selectedIdentities, setSelectedIdentities] = useState<Identity[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [dictionaryLoading, setDictionaryLoading] = useState(false)
  const [, setRegeneratingProfession] = useState<string | null>(null);
  const [isChapterComplete, setIsChapterComplete] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false); // 标记是否正在恢复数据
  const [usingLocalStorage, setUsingLocalStorage] = useState(true); // 标记是否使用 localStorage
  // Calculate chapters dynamically based on dictionary length
  const CHAPTERS = useMemo(() => {
    const wordsPerChapter = 20;
    const chapterCount = Math.ceil(dictionary.length / wordsPerChapter);
    return Array.from({ length: chapterCount }, (_, i) => ({
      id: String(i + 1),
      name: `第${i + 1}章`
    }));
  }, [dictionary]);

  // Reset chapter if it's out of bounds when dictionary changes
  useEffect(() => {
    const maxChapter = CHAPTERS.length.toString();
    if (parseInt(chapter) > parseInt(maxChapter) && maxChapter !== "0") {
      setChapter("1");
    }
  }, [CHAPTERS, chapter]);

  const currentWord = words[currentWordIndex] || {
    word: "",
    trans: [],
    usphone: "",
    ukphone: "",
    sentences: {},
  }



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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedIdentities, chapter, examType, dictionary]);

  // 加载保存的状态
  useEffect(() => {
    const savedState = localStorage.getItem("wordLearningState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.selectedIdentities?.length > 0) {
        // 恢复所有保存的状态
        setIsRestoring(true);
        setSelectedIdentities(state.selectedIdentities);
        setExamType(state.examType || "");
        setChapter(state.chapter || "");
        setCurrentWordIndex(state.currentWordIndex || 0);
        setWords(state.words || []);
        setIsRestoring(false);
        // 如果有完整的学习状态，就不需要重定向到首页
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
  }, []);  // 只在组件挂载时执行一次

    // Clear chapter selection when dictionary type changes,but if come for the previous chapter from localstorage, keep it
  useEffect(() => {
    if (!usingLocalStorage) {
      console.log('Dictionary type changed, clearing chapter unless restoring from localStorage');
      setChapter("");
    }
  }, [examType]);

  // 检查是否选择了职业
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedIdentities.length === 0) {
        window.location.href = "/";
      }
    }, 1000); // 等待 1 秒，确保状态已经加载

    return () => clearTimeout(timer);
  }, [selectedIdentities]);

  // 保存状态到 localStorage
  useEffect(() => {
    if (!isRestoring &&selectedIdentities.length > 0) {
      const stateToSave = {
        selectedIdentities,
        examType,
        chapter,
        currentWordIndex,
        words,
      };
      localStorage.setItem("wordLearningState", JSON.stringify(stateToSave));
    }
  }, [currentWordIndex, words]);

  // 当章节改变时获取新的单词数据
  useEffect(() => {
    // 如果没有选择章节，不做任何操作
    if (!chapter) return;

    // 检查是否有必要的数据
    if (!selectedIdentities.length ) {
      console.log('缺少必要数据:', { 
        hasIdentities: selectedIdentities.length > 0, 
      });
      return;
    }

    // 检查 localStorage 中是否有相同章节的数据
    const savedState = localStorage.getItem("wordLearningState");
    console.log('savedState:', savedState);
    if (savedState) {
      const state = JSON.parse(savedState);
      console.log(state.chapter === chapter, state.examType === examType);
      if (state.words?.length > 0 && 
          state.chapter === chapter && 
          state.examType === examType) {
        console.log('使用缓存数据:', { chapter, examType });
        setUsingLocalStorage(true);
        setWords(state.words);
        setCurrentWordIndex(state.currentWordIndex || 0);
        return;
      }
    }

    // 获取新数据
    console.log('获取新数据:', { chapter, examType });
    setUsingLocalStorage(false);
    fetchWords();
    setCurrentWordIndex(0);
    setChapter(chapter);
  }, [chapter,  examType]);

  // 重新生成单个例句
  const handleRegenerateSentence = async (profession: string) => {
    try {
      setRegeneratingProfession(profession);
      // Find the profession object from selectedIdentities that matches the profession ID
      const professionObj = selectedIdentities.find(i => i.id === profession);
      
      if (!professionObj) {
        throw new Error(`Profession ${profession} not found in selected identities`);
      }
      
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
          
          // Fixed: Check how sentences are structured in the response
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
    } finally {
      setRegeneratingProfession(null);
    }
  };

  // Handle moving to next chapter
  const handleNextChapter = useCallback(() => {
    if (parseInt(chapter) < CHAPTERS.length) {
      const nextChapter = (parseInt(chapter) + 1).toString();
      setChapter(nextChapter);
      setCurrentWordIndex(0);
      setIsChapterComplete(false);
      
      // Force clear the current words to ensure we fetch new ones
      setWords([]);
      
      // Explicitly update localStorage to prevent using cached words
      const currentState = JSON.parse(localStorage.getItem("wordLearningState") || "{}");
      const updatedState = {
        ...currentState,
        chapter: nextChapter,
        currentWordIndex: 0,
        words: [] // Clear words in localStorage
      };
      localStorage.setItem("wordLearningState", JSON.stringify(updatedState));
    }
  }, [chapter, CHAPTERS.length]);

  // Handle reviewing current chapter
  const handleReviewChapter = useCallback(() => {
    setCurrentWordIndex(0);
    setIsChapterComplete(false);
  }, []);

  // Handle resetting learning
  const onResetLearning = () => {
    // Clear all saved states
    localStorage.removeItem("wordLearningState");
    // Redirect to home page
    window.location.href = "/";
  };

  // 处理上一个/下一个单词
  const handlePrevWord = () => {
    setCurrentWordIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextWord = () => {
    // If current word is the last one, clicking "next" will show the celebration page
    if (currentWordIndex === words.length - 1) {
      setIsChapterComplete(true);
    } else {
      // Otherwise continue to the next word
      setCurrentWordIndex(prev => Math.min(prev + 1, words.length - 1));
    }
  };

  const handleChapterComplete = () => {
    setIsChapterComplete(true);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background/90 pb-20">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl"></div>
      <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl"></div>
      
      {/* Header with navigation */}
      <WordHeader onResetLearning={onResetLearning} />

      <main className="container mx-auto px-4 py-8">
        {/* Study configuration panel */}
        <StudyConfiguration
          examType={examType}
          setExamType={setExamType}
          chapter={chapter}
          setChapter={setChapter}
          dictionaryLoading={dictionaryLoading}
          dictionaryLength={dictionary.length}
          chaptersLength={CHAPTERS.length}
          chapters={CHAPTERS}
        />

        {/* Word card */}
        <AnimatePresence mode="wait">
          {isChapterComplete ? (
            <motion.div
              key="celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-8 max-w-3xl"
            >
              <ChapterComplete 
                chapter={chapter}
                chapterCount={CHAPTERS.length}
                onNextChapter={handleNextChapter}
                onReviewChapter={handleReviewChapter}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentWordIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mx-auto mb-8 max-w-3xl overflow-hidden border-primary/10 bg-card/60 shadow-md backdrop-blur-md">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="relative mb-8">
                      {/* Animated robot with sparkles */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-8 rounded-full border border-primary/10"
                      ></motion.div>
                      
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-12 rounded-full border border-primary/5"
                      ></motion.div>
                      
                      {/* Bot icon with glow */}
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-10 w-10 text-primary" />
                        
                        {/* Animated sparkles */}
                        <motion.div
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2, 0.8],
                            x: -10, 
                            y: -15,
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute"
                        >
                          <Sparkles className="h-4 w-4 text-primary/60" />
                        </motion.div>
                        
                        <motion.div
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2, 0.8], 
                            x: 15, 
                            y: -8,
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                          className="absolute"
                        >
                          <Sparkles className="h-3 w-3 text-blue-400/60" />
                        </motion.div>
                      </div>
                    </div>
                    
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      正在为您的职业背景创建个性化单词例句
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/10 p-12 text-center">
                    <p className="mb-4 text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
                    <Button variant="outline" onClick={fetchWords}>
                      重试
                    </Button>
                  </div>
                ) : words.length > 0 ? (
                  <WordCard
                    currentWord={currentWord}
                    currentWordIndex={currentWordIndex}
                    wordsLength={words.length}
                    handlePrevWord={handlePrevWord}
                    handleNextWord={handleNextWord}
                    playWordAudio={playWordAudio}
                    handleRegenerateSentence={handleRegenerateSentence}
                    playSentenceAudio={playSentenceAudio}
                    isLastWord={currentWordIndex === words.length - 1}
                    onChapterComplete={handleChapterComplete}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="mb-6 rounded-full bg-primary/10 p-6"
                    >
                      <BookOpen className="h-12 w-12 text-primary" />
                    </motion.div>
                    
                    {!examType ? (
                      <h3 className="mb-2 text-xl font-medium">请先选择词典类型</h3>
                    ) : !chapter ? (
                      <h3 className="mb-2 text-xl font-medium">请选择章节开始学习</h3>
                    ) : (
                      <h3 className="mb-2 text-xl font-medium">请选择词典和章节开始学习</h3>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}
