import { useContext } from 'react';
import { NavigationContext } from './LayoutClient';

export default function Overlay() {
  const { navOpen, handleOnClick } = useContext(
    NavigationContext
  ) as NavigationContext;

  return (
    navOpen && (
      <div
        className="fixed inset-0 z-30 cursor-pointer bg-neutral-900/40"
        onClick={handleOnClick}
      />
    )
  );
}
