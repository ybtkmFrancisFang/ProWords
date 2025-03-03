import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, BookText, Loader2 } from "lucide-react";

interface StudyConfigurationProps {
  examType: "CET4" | "CET6" | "";
  setExamType: (type: "CET4" | "CET6" | "") => void;
  chapter: string;
  setChapter: (chapter: string) => void;
  dictionaryLoading: boolean;
  dictionaryLength: number;
  chaptersLength: number;
  chapters: { id: string; name: string }[];
}

export function StudyConfiguration({
  examType,
  setExamType,
  chapter,
  setChapter,
  dictionaryLoading,
  dictionaryLength,
  chaptersLength,
  chapters
}: StudyConfigurationProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-5"
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="group relative">
          <Select 
            value={examType} 
            onValueChange={(value: "CET4" | "CET6" | "") => setExamType(value)}
          >
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
            onValueChange={(value) => setChapter(value)}
            disabled={!examType || chapters.length === 0 || dictionaryLoading}
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
              {chapters.map((chapter) => (
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
        ) : dictionaryLength > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            <BookText className="h-3.5 w-3.5 text-primary/70" />
            <span>{dictionaryLength} 词汇</span>
            <span className="mx-1 text-muted-foreground/30">|</span>
            <span>{chaptersLength} 章节</span>
          </div>
        )}
      </div>

      {/* 装饰元素 */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-purple-500/5 blur-xl"></div>
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-blue-500/5 blur-xl"></div>
    </motion.div>
  );
}
