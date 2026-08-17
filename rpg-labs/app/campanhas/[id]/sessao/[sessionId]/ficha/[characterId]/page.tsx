import SessionCharacterSheet from "@/components/SessionCharacterSheet";

export default async function SessionCharacterSheetPage({ params }: { params: Promise<{ id: string; sessionId: string; characterId: string }> }) {
  const { sessionId, characterId } = await params;
  return <SessionCharacterSheet sessionId={sessionId} characterId={characterId} />;
}
