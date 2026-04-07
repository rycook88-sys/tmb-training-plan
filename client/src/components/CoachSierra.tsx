import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Sparkles, Mountain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface CoachSierraProps {
  open: boolean;
  onClose: () => void;
  /** Serialized workout sessions JSON */
  workoutData?: string;
  /** Serialized weight entries JSON */
  weightData?: string;
  /** Serialized body fat entries JSON */
  bodyFatData?: string;
  /** Serialized nutrition data JSON */
  nutritionData?: string;
}

const SUGGESTED_PROMPTS = [
  "How's my progress for the TMB?",
  "Analyze my leg strength",
  "Am I eating enough protein?",
  "My knees hurt after squats",
  "Compare me to average hikers",
  "What should I focus on next?",
];

const STORAGE_KEY = "tmb-coach-sierra-messages";
const STYLE_KEY = "tmb-coach-sierra-style";

export default function CoachSierra({
  open,
  onClose,
  workoutData,
  weightData,
  bodyFatData,
  nutritionData,
}: CoachSierraProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [style, setStyle] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STYLE_KEY);
      return saved ? Number(saved) : 15;
    } catch {
      return 15;
    }
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Persist style
  useEffect(() => {
    localStorage.setItem(STYLE_KEY, String(style));
  }, [style]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const chatMutation = trpc.coach.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something went wrong: ${err.message}. Try again.`,
        },
      ]);
    },
  });

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || chatMutation.isPending) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");

    chatMutation.mutate({
      messages: newMessages,
      style,
      workoutData: workoutData || undefined,
      weightData: weightData || undefined,
      bodyFatData: bodyFatData || undefined,
      nutritionData: nutritionData || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setConfirmClear(false);
  };

  const styleLabel =
    style <= 25
      ? "TACTICAL"
      : style <= 50
      ? "DIRECT"
      : style <= 75
      ? "BALANCED"
      : "PERSONAL";

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-background"
          style={{ touchAction: "none" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center">
                <Mountain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-bold text-foreground tracking-wide">
                  COACH SIERRA
                </h2>
                <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
                  TMB Training Advisor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                   onClick={() => setConfirmClear(true)}
                   className="text-[9px] font-mono text-[var(--muted-foreground)] hover:text-red-400 transition-colors uppercase tracking-wider px-2 py-1 border border-border hover:border-red-400/50"
                 >
                   Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--secondary)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>

          {/* Style Slider */}
          <div className="px-4 py-2 border-b border-border bg-card/50 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
                Response Style
              </span>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{
                  color:
                    style <= 25
                      ? "var(--primary)"
                      : style <= 50
                      ? "var(--primary)"
                      : style <= 75
                      ? "#f59e0b"
                      : "#f472b6",
                }}
              >
                {styleLabel}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={100}
                value={style}
                onChange={(e) => setStyle(Number(e.target.value))}
                className="w-full h-1.5 appearance-none bg-border rounded-full outline-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[8px] font-mono text-[var(--muted-foreground)]">
                  Bullet points
                </span>
                <span className="text-[8px] font-mono text-[var(--muted-foreground)]">
                  Conversational
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-400/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[var(--primary)] opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-mono text-foreground mb-1">
                    Hey! I'm Sierra.
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-xs">
                    I've got your workout data, weight, body comp, and nutrition
                    loaded. Ask me anything.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={chatMutation.isPending}
                      className="text-left text-[10px] font-mono px-3 py-2.5 border border-border
                        hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5
                        transition-colors text-[var(--muted-foreground)] hover:text-foreground
                        disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${
                      msg.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center mt-0.5">
                        <Mountain className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                        msg.role === "user"
                          ? "bg-[var(--primary)] text-white"
                          : "bg-card border border-border text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs
                          [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs
                          [&_strong]:text-[var(--primary)]">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-xs whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center">
                      <Mountain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          Analyzing your data...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-border bg-card shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 items-end"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Coach Sierra anything..."
                rows={1}
                className="flex-1 bg-background border border-border text-sm font-mono text-foreground
                  px-3 py-2.5 resize-none max-h-24 min-h-[42px]
                  focus:outline-none focus:border-[var(--primary)]
                  placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="shrink-0 w-[42px] h-[42px] flex items-center justify-center
                  bg-[var(--primary)] text-white disabled:opacity-40
                  hover:brightness-110 transition-all"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <ConfirmDeleteDialog
      open={confirmClear}
      title="Clear Chat History?"
      description="All conversation with Coach Sierra will be permanently deleted."
      onCancel={() => setConfirmClear(false)}
      onConfirm={clearChat}
    />
    </>
  );
}
