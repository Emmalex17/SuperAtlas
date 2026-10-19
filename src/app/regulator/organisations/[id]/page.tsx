import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ORGANISATIONS } from "@/lib/mockData";
import { OrganisationProfileClient } from "./OrganisationProfileClient";

async function OrganisationProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = ORGANISATIONS.find((o) => o.id === id);
  if (!org) notFound();
  return <OrganisationProfileClient org={org} />;
}

export default function OrganisationProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <OrganisationProfileContent params={params} />
    </Suspense>
  );
}
