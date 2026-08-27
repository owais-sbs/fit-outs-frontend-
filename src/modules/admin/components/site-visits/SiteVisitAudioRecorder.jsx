import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Pause, Play, Loader2, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSiteVisitRecordings, uploadSiteVisitRecording } from "../../api/site-visits.api";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SiteVisitAudioRecorder({ visitId, readOnly = false }) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const loadRecordings = useCallback(async () => {
    if (!visitId) return;
    try {
      const list = await fetchSiteVisitRecordings(visitId);
      setRecordings(list);
    } catch {
      /* ignore */
    }
  }, [visitId]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    const hasProcessing = recordings.some(
      (r) => r.processingStatus === "PENDING" || r.processingStatus === "PROCESSING"
    );
    if (!hasProcessing) return undefined;
    const interval = setInterval(loadRecordings, 4000);
    return () => clearInterval(interval);
  }, [recordings, loadRecordings]);

  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadBlob = async (blob, durationSeconds) => {
    setUploading(true);
    try {
      await uploadSiteVisitRecording(visitId, blob, durationSeconds);
      await loadRecordings();
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
        if (blob.size > 0) {
          await uploadBlob(blob, elapsed);
        }
        setElapsed(0);
      };
      recorder.start(10000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
      startTimer();
    } catch {
      /* mic denied */
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setPaused(false);
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume();
      startTimer();
    } else {
      mediaRecorderRef.current.pause();
      stopTimer();
    }
    setPaused(!paused);
  };

  const statusVariant = (status) => {
    if (status === "COMPLETED") return "success";
    if (status === "FAILED") return "destructive";
    if (status === "PROCESSING") return "default";
    return "secondary";
  };

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileAudio className="h-4 w-4" />
          Site visit audio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {!recording ? (
              <Button type="button" size="sm" onClick={startRecording} disabled={uploading}>
                <Mic className="mr-1.5 h-4 w-4" />
                Start recording
              </Button>
            ) : (
              <>
                <Button type="button" size="sm" variant="secondary" onClick={togglePause}>
                  {paused ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                  <MicOff className="mr-1.5 h-4 w-4" />
                  Stop & upload
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatDuration(elapsed)}
                </span>
              </>
            )}
            {uploading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading…
              </span>
            )}
          </div>
        )}

        {recordings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {readOnly ? "No recordings for this visit." : "Record notes during the site visit. Transcript and summary are generated after you submit the report."}
          </p>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec) => (
              <div key={rec.uuid} className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {rec.durationSeconds ? formatDuration(rec.durationSeconds) : "Recording"}
                    {rec.createdAt && ` · ${new Date(rec.createdAt).toLocaleString()}`}
                  </span>
                  <Badge variant={statusVariant(rec.processingStatus)}>
                    {rec.processingStatus}
                  </Badge>
                </div>
                {rec.audioUrl && (
                  <audio controls className="w-full h-8" src={rec.audioUrl} preload="metadata" />
                )}
                {rec.processingStatus === "COMPLETED" && rec.transcript && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Transcript</p>
                    <p className="text-sm whitespace-pre-wrap">{rec.transcript}</p>
                  </div>
                )}
                {rec.processingStatus === "COMPLETED" && rec.aiSummary && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI summary</p>
                    <p className="text-sm whitespace-pre-wrap">{rec.aiSummary}</p>
                  </div>
                )}
                {(rec.processingStatus === "PENDING" || rec.processingStatus === "PROCESSING") && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating transcript and summary…
                  </p>
                )}
                {rec.processingStatus === "FAILED" && rec.aiSummary && (
                  <p className="text-xs text-destructive">{rec.aiSummary}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
