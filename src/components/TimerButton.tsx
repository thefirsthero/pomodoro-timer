import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function TimerButton() {
  const [currentTime, setCurrentTime] = useState("");
  const [startTime, setStartTime] = useState("");
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
    setCurrentTime(startTime);
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //   useEffect(() => {
  //     const newCurrentTime = parseInt(currentTime) - 1;
  //     async function setTimeAndWait() {
  //       setCurrentTime(newCurrentTime.toString());

  //       await delay(10000);
  //     }
  //     return () => {
  //       setTimeAndWait();
  //     };
  //   }, [currentTime]);

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
        <p>{currentTime === "" ? 0 : parseInt(currentTime)}</p>
        <Button className="rounded-4xl" onClick={startTimer}>
          Start Timer
        </Button>
      </div>
    </>
  );
}
