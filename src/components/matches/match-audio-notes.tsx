"use client";

import { Mic, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { speechRecognitionLang, type AppLocale } from "@/lib/locale";

type MatchAudioNotesProps = {
  locale: AppLocale;
  onTranscript: (text: string) => void;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0?: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

/** Total listening window — roughly double typical browser silence cutoff. */
const LISTENING_DURATION_MS = 120_000;

function getSpeechRecognitionCtor():
  | (new () => BrowserSpeechRecognition)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function MatchAudioNotes({ locale, onTranscript }: MatchAudioNotesProps) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTextRef = useRef("");
  const listenUntilRef = useRef(0);
  const userStoppedRef = useRef(false);

  const finishRecording = useCallback(() => {
    recognitionRef.current = null;
    setRecording(false);
    const trimmed = finalTextRef.current.trim();
    if (trimmed) {
      onTranscript(trimmed);
      setStatus("Transcription added to notes.");
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    userStoppedRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();

    if (!SpeechRecognitionCtor) {
      setStatus(
        "Speech recognition is not supported in this browser. Type your notes instead.",
      );
      return;
    }

    finalTextRef.current = "";
    userStoppedRef.current = false;
    listenUntilRef.current = Date.now() + LISTENING_DURATION_MS;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = speechRecognitionLang(locale);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          finalTextRef.current += result[0]?.transcript ?? "";
        }
      }
    };

    recognition.onerror = () => {
      userStoppedRef.current = true;
      setStatus("Could not transcribe audio. Try again or type your notes.");
      finishRecording();
    };

    recognition.onend = () => {
      if (
        !userStoppedRef.current &&
        Date.now() < listenUntilRef.current &&
        recognitionRef.current
      ) {
        try {
          recognition.start();
          return;
        } catch {
          // Browser refused restart — fall through to finish.
        }
      }
      finishRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setStatus("Listening… speak in your app language, then stop.");
  }, [locale, onTranscript, finishRecording]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
            <Square className="mr-1 h-3 w-3" />
            Stop recording
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startRecording}>
            <Mic className="mr-1 h-3 w-3" />
            Dictate notes
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          Uses browser speech-to-text ({speechRecognitionLang(locale)}).
        </span>
      </div>
      {status ? (
        <p className="text-xs text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
