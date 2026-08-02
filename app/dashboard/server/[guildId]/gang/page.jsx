export default async function Page({ params }) {
  const { guildId } = await params;
  return <div className="p-10 text-red-400">Gang Dashboard for {guildId}</div>;
}
