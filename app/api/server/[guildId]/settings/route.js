import { NextResponse } from "next/server";
import getClientPromise from "@/lib/mongodb";

export async function GET(req, { params }) {
  const { guildId } = await params;
  const client = await getClientPromise();
  const db = client.db("dashboard");

  const doc = await db.collection("server_settings").findOne({ guildId });
  return NextResponse.json(doc || {});
}

export async function POST(req, { params }) {
  const { guildId } = await params;
  const body = await req.json();

  const client = await getClientPromise();
  const db = client.db("dashboard");

  await db.collection("server_settings").updateOne(
    { guildId },
    { $set: { [`settings.${body.command}`]: body.data, type: body.type } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
