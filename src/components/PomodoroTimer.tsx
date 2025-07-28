import { useEffect, useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  Target,
  CloudRain,
  Leaf,
  Flame,
  Waves,
  Wind,
  Volume,
} from "lucide-react";

// Add type augmentation for window.webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// Ambient sound configurations
const AMBIENT_SOUNDS = {
  rain: {
    name: "Rain",
    icon: CloudRain,
    color: "text-blue-400",
  },
  forest: {
    name: "Forest",
    icon: Leaf,
    color: "text-green-400",
  },
  fire: {
    name: "Fireplace",
    icon: Flame,
    color: "text-orange-400",
  },
  ocean: {
    name: "Ocean",
    icon: Waves,
    color: "text-cyan-400",
  },
  wind: {
    name: "Wind",
    icon: Wind,
    color: "text-gray-400",
  },
};

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
  const [completedMode, setCompletedMode] = useState<
    "work" | "shortBreak" | "longBreak" | null
  >(null);
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(false);
  const [selectedAmbientSound, setSelectedAmbientSound] =
    useState<keyof typeof AMBIENT_SOUNDS>("rain");
  const [ambientVolume, setAmbientVolume] = useState(50);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientSoundRef = useRef<{
    source: AudioBufferSourceNode;
    gainNode: GainNode;
    filterNode?: BiquadFilterNode;
    lfoGainNode?: GainNode;
    lfoSource?: OscillatorNode;
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

  // Initialize audio context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Completion sound
  const playCompletionSound = useCallback(async () => {
    try {
      const audioContext = getAudioContext();

      // Ensure context is running before playing sound
      if (audioContext.state !== "running") {
        await audioContext.resume();
      }

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
    } catch (error) {
      console.error("Failed to play completion sound:", error);
    }
  }, []);

  // Generate different types of ambient sounds
  const createAmbientSound = useCallback(
    (type: keyof typeof AMBIENT_SOUNDS) => {
      const audioContext = getAudioContext();

      // Don't try to resume here - this should be done before calling this function

      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate,
      );
      const data = buffer.getChannelData(0);

      // Generate different noise patterns based on sound type
      switch (type) {
        case "rain": {
          // Rain-like filtered noise
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
            // Add some variation to simulate raindrops
            if (Math.random() < 0.02) {
              data[i] *= 2;
            }
          }
          break;
        }

        case "forest": {
          // Brown noise with occasional variations
          let brownValue = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            brownValue = (brownValue + white * 0.1) * 0.99;
            data[i] = brownValue * 0.2;
            // Add occasional bird-like sounds
            if (Math.random() < 0.001) {
              data[i] += Math.sin(i * 0.01) * 0.1;
            }
          }
          break;
        }

        case "fire": {
          // Crackling fire simulation
          for (let i = 0; i < bufferSize; i++) {
            let sample = (Math.random() * 0.5 - 1) * 0.25;
            // Add crackling effect
            if (Math.random() < 0.05) {
              sample *= 1.5 + Math.random();
            }
            data[i] = sample;
          }
          break;
        }

        case "ocean": {
          // Wave-like sound with low frequency emphasis
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 5 - 1;
            const wave = Math.sin(i * 0.001) * 0.3;
            data[i] = (white * 0.2 + wave) * 0.4;
          }
          break;
        }

        case "wind": {
          // Wind-like filtered white noise
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
          }
          break;
        }

        default: {
          // Default to pink noise
          let b0 = 0,
            b1 = 0,
            b2 = 0,
            b3 = 0,
            b4 = 0,
            b5 = 0,
            b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            data[i] =
              (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }
          break;
        }
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();

      // Configure filter based on sound type
      switch (type) {
        case "rain": {
          filterNode.type = "lowpass";
          filterNode.frequency.value = 1200;
          filterNode.Q.value = 0.5;
          break;
        }
        case "forest": {
          filterNode.type = "lowpass";
          filterNode.frequency.value = 800;
          filterNode.Q.value = 1;
          break;
        }
        case "fire": {
          filterNode.type = "highpass";
          filterNode.frequency.value = 100;
          filterNode.Q.value = 0.5;
          break;
        }
        case "ocean": {
          filterNode.type = "lowpass";
          filterNode.frequency.value = 400;
          filterNode.Q.value = 2;
          break;
        }
        case "wind": {
          filterNode.type = "bandpass";
          filterNode.frequency.value = 600;
          filterNode.Q.value = 0.8;
          break;
        }
      }

      // Add LFO for some sounds to create variation
      let lfoGainNode, lfoSource;
      if (type === "ocean" || type === "wind" || type === "fire") {
        lfoGainNode = audioContext.createGain();
        lfoSource = audioContext.createOscillator();

        lfoSource.type = "sine";
        lfoSource.frequency.value =
          type === "ocean" ? 0.1 : type === "wind" ? 0.15 : 0.3;

        lfoGainNode.gain.value = 0.3;
        lfoSource.connect(lfoGainNode);
        lfoGainNode.connect(gainNode.gain);
        lfoSource.start();
      }

      source.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      return { source, gainNode, filterNode, lfoGainNode, lfoSource };
    },
    [],
  );

  // Background sound management
  useEffect(() => {
    const startAmbientSound = async () => {
      try {
        if (ambientSoundRef.current) {
          try {
            ambientSoundRef.current.source.stop();
            if (ambientSoundRef.current.lfoSource) {
              ambientSoundRef.current.lfoSource.stop();
            }
          } catch {
            // Ignore errors when stopping already stopped sources
          }
        }

        if (backgroundSoundEnabled && isRunning && !isCompleted) {
          const audioContext = getAudioContext();

          // Ensure audio context is running before creating ambient sound
          if (audioContext.state !== "running") {
            await audioContext.resume();
          }

          ambientSoundRef.current = createAmbientSound(selectedAmbientSound);

          // Set volume
          const volume = (ambientVolume / 100) * 0.3;
          ambientSoundRef.current.gainNode.gain.value = volume;

          ambientSoundRef.current.source.start();
        }
      } catch (error) {
        console.error("Failed to start ambient sound:", error);
      }
    };

    const stopAmbientSound = () => {
      if (ambientSoundRef.current) {
        try {
          ambientSoundRef.current.source.stop();
          if (ambientSoundRef.current.lfoSource) {
            ambientSoundRef.current.lfoSource.stop();
          }
          ambientSoundRef.current = null;
        } catch (error) {
          // Ignore errors when stopping already stopped sources
          console.warn("Error stopping ambient sound:", error);
        }
      }
    };

    if (backgroundSoundEnabled && isRunning && !isCompleted) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }

    return stopAmbientSound;
  }, [
    backgroundSoundEnabled,
    selectedAmbientSound,
    isRunning,
    isCompleted,
    ambientVolume,
    createAmbientSound,
  ]);

  // Update volume when slider changes
  useEffect(() => {
    if (ambientSoundRef.current && backgroundSoundEnabled) {
      const volume = (ambientVolume / 100) * 0.3;
      ambientSoundRef.current.gainNode.gain.value = volume;
    }
  }, [ambientVolume, backgroundSoundEnabled]);

  // Timer logic
  useEffect(() => {
    if (isRunning && currentSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            setCompletedMode(mode); // Store what mode was just completed
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
  }, [
    isRunning,
    currentSeconds,
    mode,
    completedPomodoros,
    playCompletionSound,
  ]);

  const startTimer = async () => {
    // Initialize and resume audio context on user interaction (required for mobile)
    try {
      const audioContext = getAudioContext();
      console.log("AudioContext state before resume:", audioContext.state);

      // Always try to resume on user interaction for mobile compatibility
      if (audioContext.state !== "running") {
        await audioContext.resume();
        console.log("AudioContext state after resume:", audioContext.state);
      }
    } catch (error) {
      console.error("Failed to start audio context:", error);
    }

    if (currentSeconds === 0) {
      const seconds = getCurrentModeDuration() * 60;
      setTotalSeconds(seconds);
      setCurrentSeconds(seconds);
    }
    setIsRunning(true);
    setIsCompleted(false);
    setCompletedMode(null); // Clear completion message when starting
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentSeconds(0);
    setTotalSeconds(0);
    setIsCompleted(false);
    setCompletedMode(null); // Clear completion message when resetting
  };

  const switchMode = (newMode: "work" | "shortBreak" | "longBreak") => {
    setMode(newMode);
    setIsRunning(false);
    setCurrentSeconds(0);
    setTotalSeconds(0);
    setIsCompleted(false);
    setCompletedMode(null); // Clear completion message when switching modes
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

  // Get completion message based on what was just finished
  const getCompletionMessage = () => {
    if (!completedMode) return "";

    if (completedMode === "work") {
      return "Great work!";
    } else {
      return "Break over!";
    }
  };

  // Mode configurations
  const modeConfig = {
    work: {
      label: "Focus",
      color: "text-red-500",
      bgColor: "bg-red-500",
      borderColor: "border-red-500",
      icon: Target,
      description: "Time to focus!",
      thumbColor: "#ef4444", // red-500
    },
    shortBreak: {
      label: "Short Break",
      color: "text-green-500",
      bgColor: "bg-green-500",
      borderColor: "border-green-500",
      icon: Coffee,
      description: "Quick break",
      thumbColor: "#22c55e", // green-500
    },
    longBreak: {
      label: "Long Break",
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      borderColor: "border-blue-500",
      icon: Coffee,
      description: "Extended break",
      thumbColor: "#3b82f6", // blue-500
    },
  };

  const currentConfig = modeConfig[mode];
  const Icon = currentConfig.icon;

  // Map background color classes to RGB values
  const bgColorMap: Record<string, string> = {
    "bg-red-500": "rgb(239, 68, 68)",
    "bg-green-500": "rgb(34, 197, 94)",
    "bg-blue-500": "rgb(59, 130, 246)",
  };

  const sliderStyles = {
    background: `linear-gradient(to right, ${
      bgColorMap[currentConfig.bgColor]
    } 0%, ${
      bgColorMap[currentConfig.bgColor]
    } ${ambientVolume}%, rgb(156 163 175) ${ambientVolume}%, rgb(156 163 175) 100%)`,
  };

  const sliderThumbStyle = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: ${currentConfig.thumbColor};
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    input[type="range"]::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: ${currentConfig.thumbColor};
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `;

  return (
    <div className="p-3 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: sliderThumbStyle }} />
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
          {/* Left Column - Timer and Controls */}
          <div className="lg:col-span-2 flex flex-col space-y-3">
            {/* Timer Display */}
            <div className="bg-card rounded-lg p-3 shadow-lg border border-border flex-1 flex flex-col justify-center">
              <div className="text-center space-y-2">
                {/* Mode indicator */}
                <div className="flex items-center justify-center space-x-2">
                  <Icon size={18} className={currentConfig.color} />
                  <h2
                    className={`text-lg font-semibold ${currentConfig.color}`}
                  >
                    {currentConfig.label}
                  </h2>
                </div>

                {/* Circular Timer */}
                <div className="relative inline-block">
                  <svg className="transform -rotate-90 w-40 h-40">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      className="text-muted-foreground"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={
                        2 * Math.PI * 60 - (progress / 100) * 2 * Math.PI * 60
                      }
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ease-linear ${currentConfig.color}`}
                    />
                  </svg>

                  {/* Time display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
                      {currentSeconds > 0
                        ? formatTime(currentSeconds)
                        : formatTime(getCurrentModeDuration() * 60)}
                    </div>
                    {isCompleted && completedMode && (
                      <div
                        className={`text-xs font-medium mt-1 ${currentConfig.color}`}
                      >
                        {getCompletionMessage()}
                      </div>
                    )}
                    {isRunning && !isCompleted && (
                      <div className="text-xs text-muted-foreground mt-1 animate-pulse">
                        {mode === "work" ? "Stay focused..." : "Relax..."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-2">
                  {!isRunning ? (
                    <button
                      onClick={startTimer}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${currentConfig.bgColor} hover:scale-105 active:scale-95`}
                    >
                      <Play size={14} />
                      <span className="text-sm">
                        {currentSeconds > 0 ? "Resume" : "Start"}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="flex items-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <Pause size={14} />
                      <span className="text-sm">Pause</span>
                    </button>
                  )}

                  <button
                    onClick={resetTimer}
                    className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar - Only show when active */}
            {totalSeconds > 0 && (
              <div className="bg-card rounded-lg p-2 shadow-lg border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress: {Math.round(progress)}%</span>
                  <span>Remaining: {formatTime(currentSeconds)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${currentConfig.bgColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Settings and Stats */}
          <div className="flex flex-col space-y-4">
            {/* Stats */}
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Session Stats
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {completedPomodoros}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {currentCycle}
                  </div>
                  <div className="text-xs text-muted-foreground">Cycle</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${currentConfig.color}`}>
                    {Math.round(progress)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Mode
              </h3>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {(
                  Object.entries(modeConfig) as [
                    keyof typeof modeConfig,
                    (typeof modeConfig)[keyof typeof modeConfig],
                  ][]
                ).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    className={`p-2 rounded-lg transition-all duration-200 font-medium text-xs ${
                      mode === key
                        ? `${config.bgColor} text-white shadow-lg`
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              {!isRunning && currentSeconds === 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Duration:</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={getCurrentModeDuration()}
                      onChange={(e) => {
                        const value = Math.max(
                          1,
                          parseInt(e.target.value) || 1,
                        );
                        if (mode === "work") setWorkMinutes(value);
                        else if (mode === "shortBreak")
                          setShortBreakMinutes(value);
                        else setLongBreakMinutes(value);
                      }}
                      className="w-12 px-1 py-1 text-xs text-center rounded border border-border bg-background text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ambient Sound Controls */}
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Ambient Sounds
                </h3>
                <button
                  onClick={() =>
                    setBackgroundSoundEnabled(!backgroundSoundEnabled)
                  }
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full font-medium transition-all duration-200 text-xs ${
                    backgroundSoundEnabled
                      ? `${currentConfig.bgColor} text-white`
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {backgroundSoundEnabled ? (
                    <Volume2 size={12} />
                  ) : (
                    <VolumeX size={12} />
                  )}
                  <span>{backgroundSoundEnabled ? "On" : "Off"}</span>
                </button>
              </div>

              {/* Sound Selection */}
              <div className="grid grid-cols-5 gap-1 mb-3">
                {Object.entries(AMBIENT_SOUNDS).map(([key, sound]) => {
                  const SoundIcon = sound.icon;
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setSelectedAmbientSound(
                          key as keyof typeof AMBIENT_SOUNDS,
                        )
                      }
                      className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                        selectedAmbientSound === key
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <SoundIcon
                        size={14}
                        className={
                          selectedAmbientSound === key ? "" : sound.color
                        }
                      />
                      <span className="text-xs mt-1">{sound.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Volume Control */}
              {backgroundSoundEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {ambientVolume}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume size={12} className={currentConfig.color} />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ambientVolume}
                      onChange={(e) =>
                        setAmbientVolume(parseInt(e.target.value))
                      }
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      style={sliderStyles}
                    />
                    <Volume2 size={12} className={currentConfig.color} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
