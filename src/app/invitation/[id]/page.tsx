"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { InviteFlow } from "@/components/InviteFlow";
import { INVITES, type InviteId } from "@/lib/invites";

export default function InvitationByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invite = id === "zenith" || id === "deloitte" ? INVITES[id as InviteId] : undefined;
  if (!invite) notFound();
  return <InviteFlow invite={invite} />;
}
