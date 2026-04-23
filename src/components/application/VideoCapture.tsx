import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Upload, Square, Circle, RotateCcw, CheckCircle2 } from "lucide-react";

type Mode = "choose" | "upload" | "record";

interface VideoCaptureProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

const MAX_SECONDS = 75; // ~1 min with a small buffer

export function VideoCapture({ value, onChange }: VideoCaptureProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [value]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setMode("record");
    } catch (e) {
      setError("Could not access camera/mic. Check browser permissions or upload a file instead.");
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const recorder = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime || "video/webm" });
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `intro-${Date.now()}.${ext}`, { type: blob.type });
      onChange(file);
      stopStream();
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (next >= MAX_SECONDS) stopRecording();
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function reset() {
    onChange(null);
    setMode("choose");
    setElapsed(0);
    stopStream();
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("Video must be under 200MB.");
      return;
    }
    setError(null);
    onChange(file);
  }

  // Has a recorded/uploaded video
  if (value && previewUrl) {
    return (
      <Card className="p-4 bg-card border-2">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
          <CheckCircle2 className="w-4 h-4" />
          Video ready ({(value.size / (1024 * 1024)).toFixed(1)} MB)
        </div>
        <video src={previewUrl} controls playsInline className="w-full rounded-md bg-black aspect-video" />
        <Button type="button" variant="ghost" size="sm" onClick={reset} className="mt-3">
          <RotateCcw className="w-4 h-4 mr-2" />
          Replace video
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-2 border-dashed">
      {mode === "choose" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={startCamera} className="h-auto py-6 flex-col gap-2">
            <Video className="w-6 h-6" />
            <span className="font-medium">Record in browser</span>
            <span className="text-xs text-muted-foreground">Use your webcam & mic</span>
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept="video/*" capture="user" className="sr-only" onChange={handleUpload} />
            <div className="border border-input bg-background hover:bg-accent rounded-md h-full py-6 flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6" />
              <span className="font-medium text-sm">Upload from device</span>
              <span className="text-xs text-muted-foreground">iPhone, Android, or computer</span>
            </div>
          </label>
        </div>
      )}

      {mode === "record" && (
        <div className="space-y-3">
          <div className="relative">
            <video ref={videoRef} playsInline muted className="w-full rounded-md bg-black aspect-video" />
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                REC {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
            {!recording ? (
              <Button type="button" onClick={startRecording} className="gap-2">
                <Circle className="w-4 h-4 fill-current" />
                Start recording
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2">
                <Square className="w-4 h-4 fill-current" />
                Stop
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">Aim for ~1 minute. Recording stops automatically at {MAX_SECONDS}s.</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </Card>
  );
}