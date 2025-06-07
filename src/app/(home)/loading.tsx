import Trending from '@/app/trending';
import ResourceGrid from '@/components/resource-grid';
import { ItemSlider } from '@/components/ui/item-slider';

export default function Loading() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-50/10 lg:h-9 lg:w-56"></div>
          <div className="hidden h-5 w-32 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Trending.Skeleton />
          <Trending.Skeleton />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-40"></div>
          <div className="hidden h-5 w-28 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <ItemSlider>
          <ResourceGrid.Skeletons />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-36"></div>
          <div className="hidden h-5 w-32 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <ItemSlider>
          <ResourceGrid.Skeletons />
        </ItemSlider>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-28 animate-pulse rounded-md bg-neutral-50/10 lg:h-8 lg:w-32"></div>
          <div className="hidden h-5 w-28 animate-pulse rounded-md bg-neutral-50/10 sm:block"></div>
        </div>

        <ItemSlider>
          <ResourceGrid.Skeletons />
        </ItemSlider>
      </section>
    </div>
  );
}
