import { fetchAssessment, fetchAssessmentList } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { VendorDetail } from "@/components/VendorDetail";
import { EmptyState } from "@/components/EmptyState";
import { MobileShell } from "@/components/MobileShell";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-xl font-semibold text-white mb-3">
            Supabase not configured
          </h1>
          <p className="text-muted text-sm">
            Copy <code className="text-accent">.env.local.example</code> to{" "}
            <code className="text-accent">.env.local</code> and fill in your
            Supabase credentials, then restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const list = await fetchAssessmentList();

  const selectedId = params.id ?? list[0]?.id ?? null;
  const selected = selectedId ? await fetchAssessment(selectedId) : null;

  const currentLabel =
    selected?.company_name ??
    (list.length === 0 ? "Vendor Credibility" : "Select a vendor");

  return (
    <MobileShell
      currentLabel={currentLabel}
      sidebar={<Sidebar items={list} selectedId={selectedId} />}
      main={
        selected ? (
          <VendorDetail assessment={selected} />
        ) : (
          <EmptyState
            title="No vendors yet"
            subtitle="Tap “Attach email” in the sidebar to upload a vendor .eml and kick off research."
          />
        )
      }
    />
  );
}
