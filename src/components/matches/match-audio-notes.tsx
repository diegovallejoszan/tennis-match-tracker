"use client";

import { Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";
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

type StatusKey =
  | "listening"
  | "added"
  | "unsupported"
  | "failed"
  | "startFailed";

/** Total listening window — roughly double typical browser silence cutoff. */
const LISTENING_DURATION_MS = 120_000;
/** Brief pause before restarting so the browser can tear down the prior session. */
const RESTART_DELAY_MS = 150;

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

function appendTranscript(existing: string, addition: string): string {
  const next = addition.trim();
  if (!next) return existing;
  if (!existing.trim()) return next;
  return `${existing.trimEnd()} ${next}`;
}

export function MatchAudioNotes({ locale, onTranscript }: MatchAudioNotesProps) {
  const t = useTranslations("audioNotes");
  const [recording, setRecording] = useState(false);
  const [statusKey, setStatusKey] = useState<StatusKey | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTextRef = useRef("");
  const sessionTextRef = useRef("");
  const listenUntilRef = useRef(0);
  const userStoppedRef = useRef(false);
  const finishedRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const commitSessionText = useCallback(() => {
    finalTextRef.current = appendTranscript(
      finalTextRef.current,
      sessionTextRef.current,
    );
    sessionTextRef.current = "";
  }, []);

  const finishRecording = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearRestartTimer();
    recognitionRef.current = null;
    setRecording(false);
    const trimmed = finalTextRef.current.trim();
    if (trimmed) {
      onTranscript(trimmed);
      setStatusKey("added");
    }
  }, [clearRestartTimer, onTranscript]);

  const stopRecording = useCallback(() => {
    userStoppedRef.current = true;
    clearRestartTimer();
    recognitionRef.current?.stop();
  }, [clearRestartTimer]);

  const startRecording = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();

    if (!SpeechRecognitionCtor) {
      setStatusKey("unsupported");
      return;
    }

    clearRestartTimer();
    finalTextRef.current = "";
    sessionTextRef.current = "";
    userStoppedRef.current = false;
    finishedRef.current = false;
    listenUntilRef.current = Date.now() + LISTENING_DURATION_MS;

    const startSession = () => {
      if (userStoppedRef.current) return;

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = speechRecognitionLang(locale);
      recognition.continuous = true;
      recognition.interimResults = false;
      sessionTextRef.current = "";

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result?.isFinal) {
            sessionTextRef.current = appendTranscript(
              sessionTextRef.current,
              result[0]?.transcript ?? "",
            );
          }
        }
      };

      recognition.onerror = () => {
        userStoppedRef.current = true;
        clearRestartTimer();
        commitSessionText();
        setStatusKey("failed");
        finishRecording();
      };

      recognition.onend = () => {
        commitSessionText();

        if (
          !userStoppedRef.current &&
          Date.now() < listenUntilRef.current
        ) {
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            startSession();
          }, RESTART_DELAY_MS);
          return;
        }

        finishRecording();
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        userStoppedRef.current = true;
        setStatusKey("startFailed");
        finishRecording();
      }
    };

    startSession();
    setRecording(true);
    setStatusKey("listening");
  }, [
    locale,
    clearRestartTimer,
    commitSessionText,
    finishRecording,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
            <Square className="mr-1 h-3 w-3" />
            {t("stop")}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startRecording}>
            <Mic className="mr-1 h-3 w-3" />
            {t("dictate")}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {t("usesBrowser", { lang: speechRecognitionLang(locale) })}
        </span>
      </div>
      {statusKey ? (
        <p className="text-xs text-muted-foreground" role="status">
          {t(statusKey)}
        </p>
      ) : null}
    </div>
  );
}
