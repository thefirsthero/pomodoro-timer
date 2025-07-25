import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function TimerButton() {
  const [startTime, setStartTime] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [error, setError] = useState("");

  function handleInput(sTime: string) {
    const digitOrEmptyRegex: RegExp = /^\d*$/;
    if (!digitOrEmptyRegex.test(sTime)) {
      setError("Please enter a valid number");
    } else {
      setStartTime(sTime);
      setError("");
    }
  }

  function startTimer() {
    if (startTime !== "") {
      setCurrentTime(parseInt(startTime));
    }
  }

  useEffect(() => {
    if (currentTime === null || currentTime <= 0) return;

    const intervalId = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime !== null) {
          if (prevTime <= 1) {
            clearInterval(intervalId);
            return 0;
          } else {
            return prevTime - 1;
          }
        }
        return prevTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentTime]);

  return (
    <>
      <label>Timer Length:</label>
      <Input
        className="mb-4"
        placeholder="Time in seconds"
        value={startTime}
        onChange={(e) => handleInput(e.target.value)}
      ></Input>
      {error && <div className="text-red-600">{error}</div>}
      <div className="grid gap-2 justify-center">
        <p>{currentTime !== null ? currentTime : 0}</p>
        <Button className="rounded-4xl" onClick={startTimer}>
          Start Timer
        </Button>
      </div>
    </>
  );
}
