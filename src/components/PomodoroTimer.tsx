import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  Target,
} from "lucide-react";

// Add type augmentation for window.webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function PomodoroTimer() {
  // Timer states
  const [mode, setMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundNoiseRef = useRef<{
    source: AudioBufferSourceNode;
    gainNode: GainNode;
  } | null>(null);

  // Get current mode duration
  const getCurrentModeDuration = () => {
    switch (mode) {
      case "work":
        return workMinutes;
      case "shortBreak":
        return shortBreakMinutes;
      case "longBreak":
        return longBreakMinutes;
    }
  };

  // Background sound management
  useEffect(() => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const createBackgroundNoise = () => {
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate,
      );
      const data = buffer.getChannelData(0);

      // Generate pink noise (more pleasant than white noise)
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        data[i] *= 0.11; // Volume adjustment
        b6 = white * 0.115926;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      return { source, gainNode };
    };

    const startBackgroundSound = () => {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      if (backgroundNoiseRef.current) {
        backgroundNoiseRef.current.source.stop();
      }
      backgroundNoiseRef.current = createBackgroundNoise();
      backgroundNoiseRef.current.source.start();
    };

    const stopBackgroundSound = () => {
      if (backgroundNoiseRef.current) {
        backgroundNoiseRef.current.source.stop();
        backgroundNoiseRef.current = null;
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

            // Auto-transition logic
            if (mode === "work") {
              setCompletedPomodoros((prev) => prev + 1);
              const newCount = completedPomodoros + 1;
              if (newCount % 4 === 0) {
                setMode("longBreak");
              } else {
                setMode("shortBreak");
              }
            } else {
              setMode("work");
              if (mode === "longBreak") {
                setCurrentCycle((prev) => prev + 1);
              }
            }

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
  }, [isRunning, currentSeconds, mode, completedPomodoros]);

  const playCompletionSound = () => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const createCompletionSound = () => {
      // Create a pleasant chime sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator1.type = "sine";
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator1.frequency.setValueAtTime(
        659.25,
        audioContext.currentTime + 0.1,
      ); // E5
      oscillator1.frequency.setValueAtTime(
        783.99,
        audioContext.currentTime + 0.2,
      ); // G5

      oscillator2.type = "sine";
      oscillator2.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
      oscillator2.frequency.setValueAtTime(
        329.63,
        audioContext.currentTime + 0.1,
      ); // E4
      oscillator2.frequency.setValueAtTime(
        392.0,
        audioContext.currentTime + 0.2,
      ); // G4

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.8,
      );

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.start();
      oscillator2.start();
      oscillator1.stop(audioContext.currentTime + 0.8);
      oscillator2.stop(audioContext.currentTime + 0.8);
    };

    if (audioContext.state === "suspended") {
      audioContext.resume().then(createCompletionSound);
    } else {
      createCompletionSound();
    }
  };

  const startTimer = () => {
    if (currentSeconds === 0) {
      const seconds = getCurrentModeDuration() * 60;
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

  const switchMode = (newMode: "work" | "shortBreak" | "longBreak") => {
    setMode(newMode);
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

  // Calculate progress
  const progress =
    totalSeconds > 0
      ? ((totalSeconds - currentSeconds) / totalSeconds) * 100
      : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Mode configurations
  const modeConfig = {
    work: {
      label: "Focus Time",
      color: "text-red-500",
      bgColor: "bg-red-500",
      borderColor: "border-red-500",
      icon: Target,
      description: "Time to focus and get work done!",
    },
    shortBreak: {
      label: "Short Break",
      color: "text-green-500",
      bgColor: "bg-green-500",
      borderColor: "border-green-500",
      icon: Coffee,
      description: "Take a short break and recharge",
    },
    longBreak: {
      label: "Long Break",
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      borderColor: "border-blue-500",
      icon: Coffee,
      description: "Time for a longer break!",
    },
  };

  const currentConfig = modeConfig[mode];
  const Icon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            Pomodoro Timer
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Stay focused and productive with the Pomodoro Technique
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {completedPomodoros}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Completed
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {currentCycle}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Cycle
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <div className={`text-2xl font-bold ${currentConfig.color}`}>
              {Math.round(progress)}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Progress
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(
              Object.entries(modeConfig) as [
                keyof typeof modeConfig,
                (typeof modeConfig)[keyof typeof modeConfig],
              ][]
            ).map(([key, config]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`p-3 rounded-xl transition-all duration-200 font-medium ${
                  mode === key
                    ? `${config.bgColor} text-white shadow-lg`
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {!isRunning && currentSeconds === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentConfig.label} Duration
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={getCurrentModeDuration()}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      if (mode === "work") setWorkMinutes(value);
                      else if (mode === "shortBreak")
                        setShortBreakMinutes(value);
                      else setLongBreakMinutes(value);
                    }}
                    className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    min
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Timer */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center space-y-6">
            {/* Mode indicator */}
            <div className="flex items-center justify-center space-x-2">
              <Icon size={24} className={currentConfig.color} />
              <h2 className={`text-2xl font-semibold ${currentConfig.color}`}>
                {currentConfig.label}
              </h2>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              {currentConfig.description}
            </p>

            {/* Circular Timer */}
            <div className="relative inline-block">
              <svg className="transform -rotate-90 w-64 h-64">
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${currentConfig.color}`}
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">
                  {currentSeconds > 0
                    ? formatTime(currentSeconds)
                    : formatTime(getCurrentModeDuration() * 60)}
                </div>
                {isCompleted && (
                  <div
                    className={`text-lg font-medium mt-2 ${currentConfig.color}`}
                  >
                    {mode === "work" ? "Great work!" : "Break time over!"}
                  </div>
                )}
                {isRunning && !isCompleted && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 animate-pulse">
                    {mode === "work"
                      ? "Stay focused..."
                      : "Enjoy your break..."}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-full text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${currentConfig.bgColor} hover:scale-105`}
                >
                  <Play size={20} />
                  <span>{currentSeconds > 0 ? "Resume" : "Start"}</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-2 px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Pause size={20} />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex items-center justify-center w-14 h-14 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Background Sound Toggle */}
            <button
              onClick={() => setBackgroundSoundEnabled(!backgroundSoundEnabled)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                backgroundSoundEnabled
                  ? `${currentConfig.bgColor} text-white`
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {backgroundSoundEnabled ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
              <span className="text-sm">
                Focus Sounds {backgroundSoundEnabled ? "On" : "Off"}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSeconds > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Session Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ease-linear ${currentConfig.bgColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>Elapsed: {formatTime(totalSeconds - currentSeconds)}</span>
              <span>Remaining: {formatTime(currentSeconds)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
