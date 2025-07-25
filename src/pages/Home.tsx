import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import {
  Card,
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
      </Card>
    </>
  );
}
