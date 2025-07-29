import ResourceCard from '@/components/item-card';
import { ItemSlider } from '@/components/ui/item-slider';

export default function SliderSkeleton() {
  return (
    <ItemSlider>
      {Array.from({ length: 8 }).map((_, index) => (
        <ResourceCard.Skeleton key={index} className="w-48" />
      ))}
    </ItemSlider>
  );
}
