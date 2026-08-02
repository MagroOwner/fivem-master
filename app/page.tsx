"use client";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
  return null;
}
<h1 className="text-4xl font-bold tracking-tight">Your Servers (test)</h1>