import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function TimerButton() {
  const [currentTime, setCurrentTime] = useState("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState("");

  function startTimer() {
    if (true) {
      const iCurrentTime = parseInt(currentTime);
      if (iCurrentTime > 0) {
        const newTime = iCurrentTime - 1;
        setCurrentTime(newTime.toString());
      }
    }
  }

  // useEffect(() = {
  //     startCountdown();

  // }, [time])

  function handleInput(sTime: string) {
    const digitOrEmptyRegex: RegExp = /^\d*$/;
    if (!digitOrEmptyRegex.test(sTime)) {
      console.log(sTime);
      setError("Please enter a valid number");
    } else {
      setStartTime(sTime);
      setError("");
    }
  }

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
        <p>{currentTime}</p>
        <Button className="rounded-4xl" onClick={startTimer}>
          Start Timer
        </Button>
      </div>
    </>
  );
}
