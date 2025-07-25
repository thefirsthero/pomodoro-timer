import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// Add type augmentation for window.webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function FocusTimer() {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio contexts
  useEffect(() => {
    // Create background focus sound (rain/white noise simulation)
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Background sound setup
    const createBackgroundNoise = () => {
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate,
      );
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1; // Low volume white noise
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.1;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      return { source, gainNode };
    };

    let backgroundNoise: {
      source: AudioBufferSourceNode;
      gainNode: GainNode;
    } | null = null;

    const startBackgroundSound = () => {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      backgroundNoise = createBackgroundNoise();
      backgroundNoise.source.start();
    };

    const stopBackgroundSound = () => {
      if (backgroundNoise) {
        backgroundNoise.source.stop();
        backgroundNoise = null;
      }
    };

    if (backgroundSoundEnabled && isRunning && !isCompleted) {
      startBackgroundSound();
    } else {
      stopBackgroundSound();
    }

    return () => {
      stopBackgroundSound();
    };
  }, [backgroundSoundEnabled, isRunning, isCompleted]);

  // Timer logic
  useEffect(() => {
    if (isRunning && currentSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, currentSeconds]);

  const playCompletionSound = () => {
    // Create a modern "boom" completion sound
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const createCompletionSound = () => {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator1.type = "sine";
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(
        200,
        audioContext.currentTime + 0.5,
      );

      oscillator2.type = "triangle";
      oscillator2.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.5,
      );

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.start();
      oscillator2.start();
      oscillator1.stop(audioContext.currentTime + 0.5);
      oscillator2.stop(audioContext.currentTime + 0.5);
    };

    if (audioContext.state === "suspended") {
      audioContext.resume().then(createCompletionSound);
    } else {
      createCompletionSound();
    }
  };

  const startTimer = () => {
    if (currentSeconds === 0) {
      const seconds = selectedMinutes * 60;
      setTotalSeconds(seconds);
      setCurrentSeconds(seconds);
    }
    setIsRunning(true);
    setIsCompleted(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentSeconds(0);
    setTotalSeconds(0);
    setIsCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress =
    totalSeconds > 0
      ? ((totalSeconds - currentSeconds) / totalSeconds) * 100
      : 0;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const presetTimes = [5, 15, 25, 45, 60];

  return (
    <div className="space-y-6">
      {/* Timer Selection Card */}
      {!isRunning && currentSeconds === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Focus Time</CardTitle>
            <CardDescription>Choose how long you want to focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {presetTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedMinutes === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMinutes(time)}
                  className="h-12 flex flex-col"
                >
                  <div className="grid-cols-1">
                    <span className="text-lg font-bold">{time}</span>
                    <span className="text-xs opacity-70">min</span>
                  </div>
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Custom:</span>
              <input
                type="number"
                min="1"
                max="120"
                value={selectedMinutes}
                onChange={(e) =>
                  setSelectedMinutes(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-16 px-2 py-1 text-center rounded-md border border-input bg-background text-sm"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Timer Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isCompleted
              ? "Focus Session Complete! 🎉"
              : isRunning
              ? "Stay Focused..."
              : "Focus Timer"}
          </CardTitle>
          {currentSeconds > 0 && (
            <CardDescription>
              {selectedMinutes} minute focus session
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Circular Timer Display */}
          <div className="flex justify-center">
            <div className="relative">
              <svg className="transform -rotate-90 w-48 h-48">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="hsl(var(--border))"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke={
                    isCompleted ? "hsl(var(--chart-2))" : "hsl(var(--primary))"
                  }
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold font-mono tabular-nums">
                  {formatTime(currentSeconds)}
                </div>
                {isCompleted && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Great work!
                  </div>
                )}
                {isRunning && !isCompleted && (
                  <div className="text-sm text-muted-foreground mt-1 animate-pulse">
                    Focus time...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button onClick={startTimer} size="lg" className="px-8">
                <Play className="w-4 h-4 mr-2" />
                {currentSeconds > 0 ? "Resume" : "Start Focus"}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="secondary"
                size="lg"
                className="px-8"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            <Button onClick={resetTimer} variant="outline" size="lg">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Background Sound Toggle */}
          <div className="flex items-center justify-center">
            <Button
              onClick={() => setBackgroundSoundEnabled(!backgroundSoundEnabled)}
              variant={backgroundSoundEnabled ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
            >
              {backgroundSoundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm">
                Focus Sounds {backgroundSoundEnabled ? "On" : "Off"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Info Card */}
      {totalSeconds > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-1000 ease-linear",
                  isCompleted ? "bg-chart-2" : "bg-primary",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                Time elapsed: {formatTime(totalSeconds - currentSeconds)}
              </span>
              <span>Time remaining: {formatTime(currentSeconds)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
