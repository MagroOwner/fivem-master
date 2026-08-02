import ServerClient from "./ServerClient";

export default function Page({ params }) {
  return <ServerClient guildId={params.guildId} />;
}
