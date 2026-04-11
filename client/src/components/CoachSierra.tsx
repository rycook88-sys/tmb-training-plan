import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Send, Loader2, Image as ImageIcon, Clipboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { SIERRA_PHOTOS, getSierraPhotoByIndex } from "@/lib/sierra-photos";

type ImageAttachment = {
  /** base64 data (no prefix) */
  base64: string;
  mimeType: string;
  /** data URL for local preview */
  preview: string;
  /** S3 URL after upload (set after upload completes) */
  url?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** Index into SIERRA_PHOTOS — assigned when the message is created */
  photoIdx?: number;
  /** Image URLs attached to this message (user-sent photos) */
  imageUrls?: string[];
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
  /** Serialized Garmin analytics data */
  garminData?: string;
  /** Serialized gear checklist progress */
  gearData?: string;
  /** Serialized pre-trip checklist progress */
  checklistData?: string;
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

/** Assign a random photo index to an assistant message, avoiding the previous one */
let prevPhotoIdx = -1;
function assignPhotoIdx(): number {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * SIERRA_PHOTOS.length);
  } while (idx === prevPhotoIdx && SIERRA_PHOTOS.length > 1);
  prevPhotoIdx = idx;
  return idx;
}

/** Read a File into base64 + preview data URL */
function readFileAsBase64(file: File): Promise<{ base64: string; preview: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, preview: dataUrl, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CoachSierra({
  open,
  onClose,
  workoutData,
  weightData,
  bodyFatData,
  nutritionData,
  garminData,
  gearData,
  checklistData,
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
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Pick a random "welcome" photo for the empty state
  const welcomePhoto = useMemo(() => getSierraPhotoByIndex(7), []);

  // ── Clipboard paste handler ──────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            readFileAsBase64(file).then((result) => {
              setPendingImages((prev) => [...prev, { ...result }]);
            });
          }
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [open]);

  // ── File picker handler ──────────────────────────────────
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ImageAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const result = await readFileAsBase64(file);
      newImages.push({ ...result });
    }
    setPendingImages((prev) => [...prev, ...newImages]);
    // Reset the input so the same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadImageMutation = trpc.coach.uploadImage.useMutation();

  const chatMutation = trpc.coach.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, photoIdx: assignPhotoIdx() },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something went wrong: ${err.message}. Try again.`,
          photoIdx: assignPhotoIdx(),
        },
      ]);
    },
  });

  const handleSend = async (content: string) => {
    const trimmed = content.trim();
    const hasImages = pendingImages.length > 0;
    if (!trimmed && !hasImages) return;
    if (chatMutation.isPending || uploadingImages) return;

    // Upload images to S3 first
    let imageUrls: string[] = [];
    if (hasImages) {
      setUploadingImages(true);
      try {
        const uploadPromises = pendingImages.map((img) =>
          uploadImageMutation.mutateAsync({
            imageBase64: img.base64,
            mimeType: img.mimeType,
          })
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((r) => r.url);
      } catch (err) {
        console.error("Image upload failed:", err);
        setUploadingImages(false);
        // Show error but don't block — user can retry
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn't upload that image. Try again or send without it.",
            photoIdx: assignPhotoIdx(),
          },
        ]);
        return;
      }
      setUploadingImages(false);
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed || (hasImages ? "What do you think?" : ""),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setPendingImages([]);

    chatMutation.mutate({
      messages: newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        imageUrls: m.imageUrls,
      })),
      style,
      workoutData: workoutData || undefined,
      weightData: weightData || undefined,
      bodyFatData: bodyFatData || undefined,
      nutritionData: nutritionData || undefined,
      garminData: garminData || undefined,
      gearData: gearData || undefined,
      checklistData: checklistData || undefined,
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

  const isBusy = chatMutation.isPending || uploadingImages;

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
              <img
                src={SIERRA_PHOTOS[0].url}
                alt="Coach Sierra"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h2 className="text-sm font-mono font-bold text-foreground tracking-wide">
                  COACH SIERRA
                </h2>
                <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
                  TMB Training Partner
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
              <div className="flex flex-col items-center justify-center h-full gap-4">
                {/* Large welcome photo */}
                <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg shadow-black/30 border border-border/50">
                  <img
                    src={welcomePhoto.url}
                    alt="Coach Sierra"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-mono text-foreground mb-1">
                    Hey! I'm Sierra.
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-xs">
                    I've got your workout data, weight, body comp, and nutrition
                    loaded. Ask me anything — or send me a photo.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isBusy}
                      className="text-left text-[10px] font-mono px-3 py-2.5 border border-border
                        hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5
                        transition-colors text-[var(--muted-foreground)]
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
                  <div key={i}>
                    {msg.role === "assistant" && msg.photoIdx != null && (
                      /* Large Sierra photo above the message */
                      <div className="mb-2 ml-9">
                        <div className="w-44 h-56 rounded-xl overflow-hidden shadow-md shadow-black/20 border border-border/30">
                          <img
                            src={SIERRA_PHOTOS[msg.photoIdx % SIERRA_PHOTOS.length].url}
                            alt={SIERRA_PHOTOS[msg.photoIdx % SIERRA_PHOTOS.length].desc}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex gap-2.5 ${
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <img
                          src={SIERRA_PHOTOS[0].url}
                          alt="Sierra"
                          className="w-7 h-7 shrink-0 rounded-full object-cover mt-0.5"
                        />
                      )}
                      <div
                        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                          msg.role === "user"
                            ? "bg-[var(--primary)] text-white"
                            : "bg-card border border-border text-foreground"
                        }`}
                      >
                        {/* User-sent images */}
                        {msg.role === "user" && msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {msg.imageUrls.map((url, imgIdx) => (
                              <div key={imgIdx} className="w-32 h-32 rounded-md overflow-hidden border border-white/20">
                                <img
                                  src={url}
                                  alt={`Sent photo ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        )}
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
                  </div>
                ))}

                {isBusy && (
                  <div className="flex gap-2.5 justify-start">
                    <img
                      src={SIERRA_PHOTOS[0].url}
                      alt="Sierra"
                      className="w-7 h-7 shrink-0 rounded-full object-cover"
                    />
                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          {uploadingImages ? "Uploading photo..." : "Thinking about you..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending Image Preview Strip */}
          {pendingImages.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-card/50 shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border group">
                    <img
                      src={img.preview}
                      alt={`Pending ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePendingImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[8px] font-mono text-[var(--muted-foreground)] mt-1">
                {pendingImages.length} photo{pendingImages.length > 1 ? "s" : ""} ready to send
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-border bg-card shrink-0">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 items-end"
            >
              {/* Photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="shrink-0 w-[42px] h-[42px] flex items-center justify-center
                  border border-border text-[var(--muted-foreground)]
                  hover:border-[var(--primary)]/50 hover:text-[var(--primary)]
                  disabled:opacity-40 transition-colors"
                title="Add photo from gallery"
              >
                <ImageIcon className="w-4.5 h-4.5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingImages.length > 0 ? "Add a message (optional)..." : "Talk to Sierra... (paste image with Ctrl+V)"}
                rows={1}
                className="flex-1 bg-background border border-border text-sm font-mono text-foreground
                  px-3 py-2.5 resize-none max-h-24 min-h-[42px]
                  focus:outline-none focus:border-[var(--primary)]
                  placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="submit"
                disabled={(!input.trim() && pendingImages.length === 0) || isBusy}
                className="shrink-0 w-[42px] h-[42px] flex items-center justify-center
                  bg-[var(--primary)] text-white disabled:opacity-40
                  hover:brightness-110 transition-all"
              >
                {isBusy ? (
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
