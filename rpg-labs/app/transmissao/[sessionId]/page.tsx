import CameraPublisher from "@/components/CameraPublisher";

export default async function CameraPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <CameraPublisher sessionId={sessionId} />;
}
