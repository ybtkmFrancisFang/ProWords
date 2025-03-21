"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen, ArrowRight, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface ChapterCompleteProps {
  chapter: string;
  chapterCount: number;
  onNextChapter: () => void;
  onReviewChapter: () => void;
}

export function ChapterComplete({
  chapter,
  chapterCount,
  onNextChapter,
  onReviewChapter,
}: ChapterCompleteProps) {
  // Launch confetti when component mounts
  useEffect(() => {
    const launchConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5D5DFF', '#9E9EFF', '#B8B8FF']
      });
    };

    // Small delay to ensure component is rendered
    const timer = setTimeout(launchConfetti, 200);
    return () => clearTimeout(timer);
  }, []);

  // Is this the final chapter?
  const isFinalChapter = parseInt(chapter) === chapterCount;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-card/80 p-8 backdrop-blur-md shadow-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-primary/5 to-background/20"></div>
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl animate-pulse"></div>
      <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl animate-pulse"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-5"></div>

      <div className="flex flex-col items-center text-center">
        {/* Success icon with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
          }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
        >
          <CheckCircle className="h-10 w-10 text-primary" />
        </motion.div>

        {/* Congratulatory text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-purple-500/90 bg-clip-text text-transparent">
            恭喜完成学习！
          </h2>
          <p className="mb-6 text-lg text-muted-foreground/90">
            你已经成功掌握了第 {chapter} 章的所有单词
          </p>

          {/* Completion status */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary/90">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isFinalChapter 
                  ? "🎉 完成全部章节" 
                  : `${chapter}/${chapterCount} 章`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              onClick={onReviewChapter}
              variant="outline"
              className="group flex items-center gap-2 border-primary/20 bg-background/60 hover:border-primary/30 hover:bg-background/80 transition-all duration-300"
            >
              <RefreshCcw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
              <span>复习本章</span>
            </Button>

            {!isFinalChapter && (
              <Button 
                onClick={onNextChapter}
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all duration-300"
              >
                <span className="relative z-10 mr-1">继续学习</span>
                <span className="relative z-10 text-xs text-primary-foreground/80">第 {parseInt(chapter) + 1} 章</span>
                <ArrowRight className="relative z-10 h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </Card>
  );
}
