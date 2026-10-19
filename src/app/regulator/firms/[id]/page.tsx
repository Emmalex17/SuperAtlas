import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FIRMS } from "@/lib/mockData";
import { FirmProfileClient } from "./FirmProfileClient";

async function FirmProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const firm = FIRMS.find((f) => f.id === id);
  if (!firm) notFound();
  return <FirmProfileClient firm={firm} />;
}

export default function FirmProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <FirmProfileContent params={params} />
    </Suspense>
  );
}
