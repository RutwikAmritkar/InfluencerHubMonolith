import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, Film, Loader2, AlertCircle, X, Maximize2, Clock } from "lucide-react";

export interface PortfolioItem {
  id: number;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isFeatured: boolean;
}

export interface BrandPortfolioViewerProps {
  creatorId: number;
}

export function BrandPortfolioViewer({ creatorId }: BrandPortfolioViewerProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["creator-portfolio", creatorId],
    queryFn: async () => {
      const res = await fetch(`/api/influencers/${creatorId}/portfolio`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load creator portfolio.");
      }
      return res.json() as Promise<{
        items: PortfolioItem[];
        count: number;
      }>;
    },
    enabled: !!creatorId && !isNaN(creatorId),
  });

  const items = data?.items || [];
  const featuredItem = items.find((item) => item.isFeatured);
  const remainingItems = featuredItem ? items.filter((item) => item.id !== featuredItem.id) : items;

  const formatDuration = (seconds: number | null) => {
    if (!seconds || isNaN(seconds)) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Close modal on Escape key press safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4" data-testid="portfolio-viewer-loading">
        <div className="flex items-center space-x-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Loading portfolio...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-slate-200/80 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card
        className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
        data-testid="portfolio-viewer-error"
      >
        <CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {(error as Error)?.message || "Unable to load creator portfolio."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs rounded-xl font-bold border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="py-12 px-4 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#11172A] border-dashed space-y-3"
        data-testid="portfolio-viewer-empty"
      >
        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
          <Film className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Portfolio coming soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            This creator has not uploaded any public portfolio showcase videos yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="brand-portfolio-viewer">
      {/* Featured Video Section */}
      {featuredItem && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 px-2.5 py-1 font-bold text-xs flex items-center gap-1.5 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Featured Work
            </Badge>
          </div>

          <div
            onClick={() => setSelectedItem(featuredItem)}
            tabIndex={0}
            role="button"
            aria-label="View featured portfolio video"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedItem(featuredItem);
              }
            }}
            className="group relative aspect-video md:aspect-[21/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
            data-testid="featured-video-card"
          >
            {featuredItem.thumbnailUrl ? (
              <img
                src={featuredItem.thumbnailUrl}
                alt="Featured Portfolio Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <video
                src={featuredItem.mediaUrl}
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-cover opacity-80"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4 md:p-6">
              <div className="flex justify-between items-start">
                <Badge className="bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-2 py-0.5 shadow-sm">
                  Featured
                </Badge>
                {formatDuration(featuredItem.durationSeconds) && (
                  <Badge
                    variant="secondary"
                    className="bg-black/60 backdrop-blur-md text-white border-none text-xs font-mono flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {formatDuration(featuredItem.durationSeconds)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm md:text-base">
                    Watch Featured Showcase
                  </p>
                  <p className="text-slate-300 text-xs">Click to play in full screen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Section */}
      <div className="space-y-3">
        {featuredItem && remainingItems.length > 0 && (
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
            More Portfolio Media ({remainingItems.length})
          </h4>
        )}

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="portfolio-grid"
        >
          {remainingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              tabIndex={0}
              role="button"
              aria-label={`Watch portfolio video ${item.sortOrder + 1}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedItem(item);
                }
              }}
              className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer transition-all duration-300 hover:shadow-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
              data-testid={`portfolio-card-${item.id}`}
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={`Portfolio video preview ${item.id}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <video
                  src={item.mediaUrl}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>

              {formatDuration(item.durationSeconds) && (
                <div className="absolute bottom-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/75 backdrop-blur-md text-white border-none text-xs font-mono px-2 py-0.5"
                  >
                    {formatDuration(item.durationSeconds)}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal / Lightbox */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent
          className="bg-slate-950 border-slate-800 text-white rounded-xl max-w-4xl p-2 sm:p-4 outline-hidden"
          data-testid="video-lightbox-modal"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Portfolio Video Player</DialogTitle>
            <DialogDescription>Read-only video showcase modal</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="relative space-y-3">
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Video Showcase
                  </Badge>
                  {selectedItem.isFeatured && (
                    <Badge className="bg-amber-500 text-white text-xs font-bold">Featured</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8"
                  aria-label="Close video viewer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                <video
                  src={selectedItem.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                  className="w-full h-full object-contain max-h-[75vh]"
                  poster={selectedItem.thumbnailUrl || undefined}
                />
              </div>

              {selectedItem.durationSeconds && (
                <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
                  <span>Duration: {formatDuration(selectedItem.durationSeconds)}</span>
                  {selectedItem.width && selectedItem.height && (
                    <span>
                      Resolution: {selectedItem.width}x{selectedItem.height}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
