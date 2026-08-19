import CharacterEditClient from "@/components/CharacterEditClient";

export default async function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CharacterEditClient characterId={id} />;
}
