import { PageSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="dashboard" />
    </div>
  );
}
