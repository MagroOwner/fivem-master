import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();

  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const guilds = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  }).then(res => res.json());

  return new Response(JSON.stringify(guilds), { status: 200 });
}
