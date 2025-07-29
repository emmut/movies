import ItemCard from '@/components/item-card';
import { ItemSlider } from '@/components/ui/item-slider';

export default function SliderSkeleton() {
  return (
    <ItemSlider>
      {Array.from({ length: 8 }).map((_, index) => (
        <ItemCard.Skeleton key={index} className="w-48" />
      ))}
    </ItemSlider>
  );
}
