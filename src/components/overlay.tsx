import { useNavigationContext } from '@/providers/navigation';

export default function Overlay() {
  const { navOpen, handleOnClick } = useNavigationContext();

  return (
    navOpen && (
      <div
        className="fixed inset-0 z-30 cursor-pointer bg-neutral-900/40"
        onClick={handleOnClick}
      />
    )
  );
}
