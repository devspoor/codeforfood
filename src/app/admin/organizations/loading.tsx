import { Skeleton, SkeletonProjectList } from "@/components/Skeleton";

export default function OrganizationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      {/* Organization cards */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, orgIndex) => (
          <div key={orgIndex} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Org header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>

            {/* Projects list */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
              <SkeletonProjectList count={2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
