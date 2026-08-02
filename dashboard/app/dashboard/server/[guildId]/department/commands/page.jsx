import CommandsClient from "./CommandsClient";

export default function Page({ params }) {
  return <CommandsClient guildId={params.guildId} />;
}
