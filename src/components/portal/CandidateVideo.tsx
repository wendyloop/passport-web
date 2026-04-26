import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createSignedVideoUrl } from "@/lib/portal-data";
import { Card } from "@/components/ui/card";

export function CandidateVideo({
  videoPath,
  autoplay = false,
  controls = true,
}: {
  videoPath: string;
  autoplay?: boolean;
  controls?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    data: videoUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["portal-video-url", videoPath],
    queryFn: () => createSignedVideoUrl(videoPath),
  });

  useEffect(() => {
    if (!autoplay || !videoRef.current) {
      return;
    }

    void videoRef.current.play().catch(() => {});
  }, [autoplay, videoUrl]);

  if (isLoading) {
    return (
      <Card className="flex aspect-video items-center justify-center border-border/60 bg-background/40 text-sm text-muted-foreground">
        Loading video…
      </Card>
    );
  }

  if (error || !videoUrl) {
    return (
      <Card className="flex aspect-video items-center justify-center border-border/60 bg-background/40 text-sm text-muted-foreground">
        Video unavailable
      </Card>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      controls={controls}
      playsInline
      muted={autoplay}
      loop={autoplay}
      className="aspect-video w-full rounded-2xl bg-black object-cover"
    />
  );
}
