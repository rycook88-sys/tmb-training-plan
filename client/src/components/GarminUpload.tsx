// ============================================================
// Garmin FIT File Upload Component
// Accepts .fit or .zip files, sends base64 to server for parsing,
// merges with hardcoded GARMIN_SESSIONS for display.
// ============================================================
import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Check, AlertTriangle, FileUp, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface UploadResult {
  newCount: number;
  totalCount: number;
  error?: string;
}

export default function GarminUpload() {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.garmin.upload.useMutation();

  const processFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".fit") && !name.endsWith(".zip")) {
      setError(`Unsupported file: ${file.name}. Use .fit or .zip files.`);
      return null;
    }

    return new Promise<UploadResult>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        try {
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64,
          });
          resolve({
            newCount: result.newSessions.length,
            totalCount: result.totalSessions,
          });
        } catch (err: any) {
          resolve({
            newCount: 0,
            totalCount: 0,
            error: err.message || "Upload failed",
          });
        }
      };
      reader.onerror = () => {
        resolve({ newCount: 0, totalCount: 0, error: "Failed to read file" });
      };
      reader.readAsDataURL(file);
    });
  }, [uploadMutation]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!isAuthenticated) {
      setError("Please log in to upload Garmin files.");
      return;
    }

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setError(null);
    setResults([]);

    const newResults: UploadResult[] = [];
    for (const file of fileArray) {
      const result = await processFile(file);
      if (result) newResults.push(result);
    }

    setResults(newResults);
    setUploading(false);

    // Store uploaded sessions in localStorage for cloud sync
    const successCount = newResults.filter(r => !r.error).reduce((s, r) => s + r.newCount, 0);
    if (successCount > 0) {
      // Trigger a localStorage write so cloud sync picks it up
      const existing = localStorage.getItem("tmb-garmin-uploaded") || "0";
      localStorage.setItem("tmb-garmin-uploaded", String(parseInt(existing) + successCount));
    }
  }, [isAuthenticated, processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = "";
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const totalNew = results.filter(r => !r.error).reduce((s, r) => s + r.newCount, 0);
  const totalErrors = results.filter(r => r.error).length;
  const hasResults = results.length > 0;

  return (
    <div className="mt-4 mb-2">
      {/* Drop zone / Upload button */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed transition-all cursor-pointer
          flex flex-col items-center justify-center gap-2 py-5 px-4
          ${dragOver
            ? "border-[var(--primary)] bg-[var(--primary)]/10"
            : "border-border hover:border-[var(--primary)]/50 hover:bg-[var(--secondary)]"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".fit,.zip"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              Parsing FIT data...
            </span>
          </>
        ) : (
          <>
            <FileUp className="w-6 h-6 text-[var(--muted-foreground)]" />
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              Drop .fit or .zip files here, or tap to browse
            </span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]/60">
              Garmin Connect exports · Multiple files supported
            </span>
          </>
        )}
      </div>

      {/* Results */}
      {hasResults && !uploading && (
        <div className="mt-3 space-y-2">
          {totalNew > 0 && (
            <div className="flex items-center gap-2 p-2.5 border border-green-400/20 bg-green-400/5">
              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-green-400">
                {totalNew} new session{totalNew !== 1 ? "s" : ""} parsed and saved
              </span>
            </div>
          )}
          {totalNew === 0 && totalErrors === 0 && (
            <div className="flex items-center gap-2 p-2.5 border border-yellow-400/20 bg-yellow-400/5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-yellow-400">
                No new sessions found (duplicates skipped)
              </span>
            </div>
          )}
          {results.filter(r => r.error).map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 border border-red-400/20 bg-red-400/5">
              <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-red-400">{r.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !uploading && (
        <div className="mt-3 flex items-center gap-2 p-2.5 border border-red-400/20 bg-red-400/5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[11px] font-mono text-red-400">{error}</span>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-3 text-[10px] font-mono text-[var(--muted-foreground)] italic text-center">
          Log in to upload and sync Garmin activities across devices
        </div>
      )}
    </div>
  );
}
