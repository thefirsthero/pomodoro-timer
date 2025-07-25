import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import TimerButton from "../components/TimerButton.tsx";

export default function Home() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Focus Timer</PageHeaderHeading>
      </PageHeader>
      <TimerButton />
    </>
  );
}
