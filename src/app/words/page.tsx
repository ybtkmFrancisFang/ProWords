"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCcw, Volume2, ChevronLeft, ChevronRight, 
  BookOpen, BookText, Bot, Sparkles,
  GraduationCap, Home, ArrowRight, Moon, Sun
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { Identity, Word, DictionaryEntry } from "@/app/types/types"
import { getWordsFromChapter } from '@/app/utils/wordUtils'
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChapterComplete } from "@/components/ChapterComplete"

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
  const [regeneratingProfession, setRegeneratingProfession] = useState<string | null>(null);
  const [isChapterComplete, setIsChapterComplete] = useState(false)

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
      
      // Don't auto-select chapter anymore, let user choose
      // setChapter("1");
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

  // 高亮句子中的单词
  const highlightWord = (sentence: string, word: string) => {
    // 创建一个不区分大小写的正则表达式
    const regex = new RegExp(`(${word})`, 'gi');
    const parts = sentence.split(regex);
    
    return parts.map((part, index) => 
      part.toLowerCase() === word.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">{part}</span> : 
        part
    );
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
        setSelectedIdentities(state.selectedIdentities);
        setExamType(state.examType || "");
        setChapter(state.chapter || "");
        setCurrentWordIndex(state.currentWordIndex || 0);
        setWords(state.words || []);
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

  // 当身份数据、考试类型或章节改变时获取新的单词数据
  useEffect(() => {
    // 如果有保存的状态且有单词数据，就不需要重新获取
    const savedState = localStorage.getItem("wordLearningState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.words && state.words.length > 0) {
        return;
      }
    }

    if (selectedIdentities.length > 0) {
      fetchWords();
    }
  }, [selectedIdentities, fetchWords]);

  // When dictionary changes or chapter changes, fetch words
  useEffect(() => {
    const controller = new AbortController();

    if (selectedIdentities.length > 0 && dictionary.length > 0 && chapter) {
      fetchWords();
      setCurrentWordIndex(0);
    }

    // 清理函数：组件卸载或依赖项改变时取消请求
    return () => {
      controller.abort();
    };
  }, [selectedIdentities, dictionary, chapter, fetchWords]);

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
    } catch (err) {
      console.error('Error regenerating sentence:', err);
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
    }
  }, [chapter, CHAPTERS.length]);

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
    console.log('handleNextWord', currentWordIndex, words.length - 1);
    // 如果当前已经在最后一个单词，再点击“下一个”才显示庆祝页面
    if (currentWordIndex === words.length - 1) {
      setIsChapterComplete(true);
    } else {
      // 否则继续下一个单词
      setCurrentWordIndex(prev => Math.min(prev + 1, words.length - 1));
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background/90 pb-20">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl"></div>
      <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl"></div>
      
      {/* Header with navigation */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-background/80"
            onClick={() => {
              // 清除所有保存的状态
              localStorage.removeItem("wordLearningState");
              // 重定向到首页
              window.location.href = "/";
            }}
          >
            <Home className="h-5 w-5" />
            <span className="font-semibold">重置</span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Study configuration panel - 改进设计 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5"
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="group relative">
              <Select value={examType} onValueChange={(value: "CET4" | "CET6" | "") => setExamType(value)}>
                <SelectTrigger className="w-[180px] bg-background/80 shadow-sm transition-all group-hover:border-primary/50">
                  <SelectValue placeholder="选择词典" />
                </SelectTrigger>
                <SelectContent className="border-primary/10">
                  <SelectItem value="CET4" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                      <span>CET-4</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CET6" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span>CET-6</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {examType && (
                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary shadow-glow animate-pulse"></div>
              )}
            </div>

            <div className="group relative">
              <Select 
                value={chapter} 
                onValueChange={setChapter}
                disabled={!examType || CHAPTERS.length === 0 || dictionaryLoading}
              >
                <SelectTrigger className="w-[180px] bg-background/80 shadow-sm transition-all group-hover:border-primary/50">
                  <SelectValue placeholder={
                    !examType 
                      ? "请先选择词典" 
                      : dictionaryLoading 
                        ? "加载中..." 
                        : "选择章节"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  {CHAPTERS.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id} className="cursor-pointer">
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {chapter && (
                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-purple-500 shadow-glow animate-pulse"></div>
              )}
            </div>

            {dictionaryLoading ? (
              <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/70" />
                <span>加载词典...</span>
              </div>
            ) : dictionary.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
                <BookText className="h-3.5 w-3.5 text-primary/70" />
                <span>{dictionary.length} 词汇</span>
                <span className="mx-1 text-muted-foreground/30">|</span>
                <span>{CHAPTERS.length} 章节</span>
              </div>
            )}
          </div>

          {/* 装饰元素 */}
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-purple-500/5 blur-xl"></div>
          <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-blue-500/5 blur-xl"></div>
        </motion.div>

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
                  <div className="group relative">
                    {/* Background accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5"></div>
                    
                    {/* Word header */}
                    <div className="relative z-10 bg-background/60 p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-4">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-full border-primary/20 bg-background/40 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-background/60 hover:shadow-md"
                          onClick={handlePrevWord}
                          disabled={currentWordIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-3">
                          <motion.h2 
                            key={currentWord.word}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-4xl font-bold tracking-tighter"
                          >
                            {currentWord.word}
                          </motion.h2>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => playWordAudio(currentWord.word)}
                            className="h-9 w-9 rounded-full text-primary transition-transform hover:scale-110"
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-full border-primary/20 bg-background/40 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-background/60 hover:shadow-md"
                          onClick={handleNextWord}
                          disabled={currentWordIndex === words.length - 1}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Pronunciation */}
                      <div className="mt-4 flex justify-center gap-8 text-muted-foreground">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="group flex items-center gap-2 rounded-full bg-background/40 px-3 py-1 backdrop-blur-sm"
                        >
                          <span className="text-xs font-medium uppercase text-muted-foreground/70">US:</span>
                          <span className="font-mono text-sm">{currentWord.usphone}</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="group flex items-center gap-2 rounded-full bg-background/40 px-3 py-1 backdrop-blur-sm"
                        >
                          <span className="text-xs font-medium uppercase text-muted-foreground/70">UK:</span>
                          <span className="font-mono text-sm">{currentWord.ukphone}</span>
                        </motion.div>
                      </div>
                      
                      {/* Meaning */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 space-y-1.5 text-center"
                      >
                        {currentWord.trans.map((meaning, index) => (
                          <div key={index} className="text-lg text-foreground/80">{meaning}</div>
                        ))}
                      </motion.div>
                    </div>
                    
                    {/* Progress */}
                    <div className="relative z-10 border-t border-border/60 bg-background/40 px-6 py-4 backdrop-blur-md">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <div>
                            <span className="text-base font-bold text-primary">{currentWordIndex + 1}</span>
                            <span className="text-muted-foreground"> / {words.length}</span>
                          </div>
                        </div>

                        <div className="relative">
                          <Progress 
                            value={(currentWordIndex + 1) / words.length * 100} 
                            className="h-2"
                          />
                          {currentWordIndex === words.length - 1 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute -right-1 -top-6"
                            >
                              <Button
                                onClick={() => setIsChapterComplete(true)}
                                variant="outline"
                                size="sm"
                                className="group relative flex items-center gap-1.5 border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 dark:border-green-400/30 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <motion.div
                                  animate={{ 
                                    x: [0, 3, 0],
                                  }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity,
                                    ease: "easeInOut" 
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  下一章
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </motion.div>
                                <motion.div
                                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500"
                                  animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Context sentences */}
                    <div className="relative z-10 border-t border-border/60 bg-background/40 backdrop-blur-md">
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-4 px-4 py-6">
                          <AnimatePresence mode="popLayout">
                            {Object.entries(currentWord.sentences).map(([profession, sentence], index) => (
                              <motion.div
                                key={`${profession}-${currentWordIndex}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <Card className="group overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/40 hover:shadow-md bg-card/60">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-card/80 px-4 py-3">
                                    <Badge variant="outline" className="bg-primary/5 px-3 py-1 text-xs font-medium whitespace-normal">
                                      {profession}
                                    </Badge>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-70 transition-opacity hover:bg-background hover:opacity-100"
                                        onClick={() => handleRegenerateSentence(profession)}
                                        disabled={regeneratingProfession === profession}
                                      >
                                        {regeneratingProfession === profession ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <RefreshCcw className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-70 transition-opacity hover:bg-background hover:opacity-100"
                                        onClick={() => playSentenceAudio(sentence)}
                                      >
                                        <Volume2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-background/40 px-4 py-3 backdrop-blur-sm">
                                    {regeneratingProfession === profession ? (
                                      <div className="flex items-center justify-center py-6">
                                        <div className="flex items-center gap-3">
                                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                          <span className="text-sm font-medium text-primary">重新生成例句...</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-lg leading-relaxed">{highlightWord(sentence, currentWord.word)}</p>
                                    )}
                                  </div>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
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

        {/* Chapter Complete Modal */}
        <AnimatePresence>
          {isChapterComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <ChapterComplete
                chapter={chapter}
                chapterCount={CHAPTERS.length}
                onNextChapter={handleNextChapter}
                onReviewChapter={handleReviewChapter}
              />
            </motion.div>
          )}
        </AnimatePresence>


      </main>


    </div>
  )
}
