import CardEditor from "@/components/CardEditor";

export default async function CardPage({
  params,
}: {
  params: Promise<{ feedbackId: string }>;
}) {
  const { feedbackId } = await params;
  return <CardEditor feedbackId={feedbackId} />;
}
