import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Star,
  ChevronUp,
  ChevronDown,
  Video,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";

export interface PortfolioMediaItem {
  id: number;
  creatorId: number;
  mediaType: string;
  storageKey: string;
  mediaUrl: string;
  thumbnailStorageKey: string | null;
  thumbnailUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioResponse {
  items: PortfolioMediaItem[];
  count: number;
  minimumTarget: number;
  maximumAllowed: number;
  isComplete: boolean;
  isFull: boolean;
}

/**
 * Extracts a thumbnail WebP blob and video metadata from a selected video file in browser
 */
async function generateVideoThumbnail(
  file: File
): Promise<{ blob: Blob; duration: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration / 2 : 0.5);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve({
                  blob,
                  duration: Math.round(video.duration || 0),
                  width: video.videoWidth || 0,
                  height: video.videoHeight || 0,
                });
              } else {
                resolve(null);
              }
            },
            "image/webp",
            0.85
          );
        } else {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      } catch (_err) {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

/**
 * Uploads binary file blob directly to presigned R2 PUT URL with real-time XHR progress tracking
 */
function uploadFileWithProgress(
  presignedUrl: string,
  blob: Blob | File,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage upload failed with HTTP status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during direct storage upload."));
    xhr.send(blob);
  });
}

export function CreatorPortfolioManager({ profileId }: { profileId?: number }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("idle");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deleteTargetItem, setDeleteTargetItem] = useState<PortfolioMediaItem | null>(null);

  // 1. Fetch Creator Portfolio items
  const { data, isLoading, refetch } = useQuery<PortfolioResponse>({
    queryKey: ["creator-portfolio", profileId],
    queryFn: async () => {
      const res = await fetch("/api/portfolio", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load portfolio media.");
      }
      return res.json();
    },
  });

  const portfolioItems = data?.items || [];
  const itemCount = data?.count || portfolioItems.length;
  const isFull = itemCount >= 9;

  const invalidatePortfolio = () => {
    queryClient.invalidateQueries({ queryKey: ["creator-portfolio"] });
    refetch();
  };

  // 2. Feature video mutation
  const featureMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(`/api/portfolio/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isFeatured: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to set featured video.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Featured portfolio video updated");
      invalidatePortfolio();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 3. Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (newOrderItems: Array<{ id: number; sortOrder: number }>) => {
      const res = await fetch("/api/portfolio/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: newOrderItems }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reorder portfolio.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Portfolio video order updated.");
      invalidatePortfolio();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      invalidatePortfolio();
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(`/api/portfolio/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete portfolio video.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Portfolio video removed successfully.");
      setDeleteTargetItem(null);
      invalidatePortfolio();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Handle reorder Move Up / Move Down
  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    if (portfolioItems.length < 2) return;
    const newItems = [...portfolioItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((item, idx) => ({ id: item.id, sortOrder: idx }));
    reorderMutation.mutate(payload);
  };

  // Handle Video Selection & Presigned Direct Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client Pre-flight Validations
    const allowedTypes = ["video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Unsupported file type. Please select an MP4 or MOV video file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSizeBytes) {
      toast.error("Video file size exceeds 100MB maximum limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (isFull) {
      toast.error("Your portfolio is full (9/9 videos). Remove a video to add a new one.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStep("Preparing video & extracting thumbnail...");

    try {
      // Step A: Extract Thumbnail Canvas Frame & Metadata in Browser
      const meta = await generateVideoThumbnail(file);

      // Step B: Request Presigned Upload URL for Video
      setUploadStep("Requesting secure upload authorization...");
      const presignRes = await fetch("/api/portfolio/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || "Failed to authorize video upload.");
      }

      const presignData = await presignRes.json();
      const { uploadUrl, objectKey } = presignData;

      // Step C: If Thumbnail frame was generated, request Presigned Upload URL for Thumbnail
      let thumbnailStorageKey: string | null = null;
      if (meta?.blob) {
        try {
          const thumbPresignRes = await fetch("/api/storage/presign-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fileName: "thumbnail.webp",
              contentType: "image/webp",
              contentLength: meta.blob.size,
              purpose: "avatar",
            }),
          });
          if (thumbPresignRes.ok) {
            const thumbPresignData = await thumbPresignRes.json();
            setUploadStep("Uploading thumbnail frame...");
            await uploadFileWithProgress(
              thumbPresignData.uploadUrl,
              meta.blob,
              "image/webp",
              () => {}
            );
            thumbnailStorageKey = thumbPresignData.objectKey;
          }
        } catch (_thumbErr) {
          // Thumbnail optional - proceed even if thumbnail upload fails
        }
      }

      // Step D: Direct Binary Upload of Video File to Cloudflare R2 via Presigned PUT
      setUploadStep("Uploading video file directly to storage...");
      await uploadFileWithProgress(uploadUrl, file, file.type, (pct) => {
        setUploadProgress(pct);
      });

      // Step E: Confirm Upload & Save Metadata in PostgreSQL
      setUploadStep("Finalizing video confirmation...");
      const confirmRes = await fetch("/api/portfolio/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storageKey: objectKey,
          thumbnailStorageKey,
          mimeType: file.type,
          fileSizeBytes: file.size,
          durationSeconds: meta?.duration || null,
          width: meta?.width || null,
          height: meta?.height || null,
          isFeatured: portfolioItems.length === 0, // Feature automatically if first video
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || "Failed to confirm portfolio video upload.");
      }

      toast.success("Portfolio video uploaded and published successfully");
      invalidatePortfolio();
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadStep("idle");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11172A] rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#6A0D18]" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11172A] rounded-xl">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <Video className="w-5 h-5 text-[#6A0D18]" />
              <span>Portfolio Videos</span>
            </CardTitle>

            {itemCount < 6 ? (
              <Badge
                variant="outline"
                className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs"
              >
                Incomplete ({itemCount}/6 target)
              </Badge>
            ) : itemCount < 9 ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs"
              >
                ✓ Portfolio Complete ({itemCount}/9)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-[#FDF6F7] text-[#6A0D18] border-[#EED8DC] font-bold text-xs"
              >
                ★ Portfolio Full (9/9)
              </Badge>
            )}
          </div>

          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Show brands what you can create. Upload 6–9 high-quality video reels (MP4 or MOV, max
            100MB).
          </CardDescription>
        </div>

        {/* Add Video Button */}
        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading || isFull}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isFull}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xs px-4 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : isFull ? "Portfolio Full (9/9)" : "Add Video"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Real-time Upload Progress Bar */}
        {isUploading && (
          <div className="p-4 bg-[#FDF6F7] rounded-xl border border-[#EED8DC] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#6A0D18]">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#6A0D18]" />
                {uploadStep}
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#EED8DC] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#6A0D18] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Portfolio Completeness Advice Notice */}
        {itemCount < 6 && !isUploading && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Add at least 6 videos to complete your brand showcase. (Creators with 6+ videos
                receive 4x more brand invitations).
              </span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-200 ml-2">
              {itemCount} / 6
            </span>
          </div>
        )}

        {/* Portfolio Video Cards Grid */}
        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden border bg-slate-50 dark:bg-slate-900 flex flex-col justify-between transition-all ${
                  item.isFeatured
                    ? "border-[#6A0D18] ring-2 ring-[#6A0D18]/20 shadow-md"
                    : "border-slate-200/90 dark:border-slate-800"
                }`}
              >
                {/* Video Player & Poster Preview */}
                <div className="relative aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
                  <video
                    src={item.mediaUrl}
                    poster={item.thumbnailUrl || undefined}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Featured Badge Overlay */}
                  {item.isFeatured && (
                    <div className="absolute top-3 left-3 bg-[#6A0D18] text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                      <Star className="w-3 h-3 fill-current" />
                      <span>FEATURED</span>
                    </div>
                  )}

                  {/* Order Badge Overlay */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md z-10">
                    #{index + 1}
                  </div>
                </div>

                {/* Card Controls & Actions Footer */}
                <div className="p-3 bg-white dark:bg-[#11172A] border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    {item.durationSeconds ? <span>{item.durationSeconds}s</span> : null}
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {/* Feature Action */}
                    {!item.isFeatured ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => featureMutation.mutate(item.id)}
                        disabled={featureMutation.isPending}
                        className="h-7 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#6A0D18] px-2 rounded-lg cursor-pointer"
                      >
                        <Star className="w-3 h-3 mr-1" /> Set Featured
                      </Button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#6A0D18] flex items-center px-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Featured
                      </span>
                    )}

                    {/* Reorder & Delete Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveOrder(index, "up")}
                        className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={index === portfolioItems.length - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveOrder(index, "down")}
                        className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTargetItem(item)}
                        className="h-7 w-7 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <Video className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No portfolio videos added yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload 6–9 short video reels to showcase your production quality and content style to
              brands.
            </p>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetItem} onOpenChange={() => setDeleteTargetItem(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Remove Portfolio Video?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              This video will be permanently removed from your public portfolio and storage. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetItem(null)}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTargetItem && deleteMutation.mutate(deleteTargetItem.id)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl px-4"
            >
              {deleteMutation.isPending ? "Removing..." : "Yes, Delete Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
