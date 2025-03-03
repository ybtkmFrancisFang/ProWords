import { Button } from "@/components/ui/button";
import { Home, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

interface WordHeaderProps {
  onResetLearning: () => void;
}

export function WordHeader({ onResetLearning }: WordHeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  useEffect(() => {
    // Check current theme
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="border-b border-border/40 bg-background/60 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:bg-background/80"
          onClick={onResetLearning}
        >
          <Home className="h-5 w-5" />
          <span className="font-semibold">重置</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggleTheme}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
