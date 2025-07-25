import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import TimerButton from "../components/TimerButton.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Home</PageHeaderHeading>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Focus Timer</CardTitle>
          <CardDescription>Implementation will go in here.</CardDescription>
        </CardHeader>
        <CardContent>
          <TimerButton></TimerButton>
        </CardContent>
      </Card>
    </>
  );
}
