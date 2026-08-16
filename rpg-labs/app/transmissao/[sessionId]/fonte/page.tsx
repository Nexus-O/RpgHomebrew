import TabletopPublisher from "@/components/TabletopPublisher";

export default async function TabletopSourcePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <TabletopPublisher sessionId={sessionId} />;
}
