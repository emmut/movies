type OverlayProps = {
  navOpen: boolean;
  handleOnClick: () => void;
};

export default function Overlay({ navOpen, handleOnClick }: OverlayProps) {
  return (
    navOpen && (
      <div
        className="fixed inset-0 z-30 cursor-pointer bg-neutral-900/40"
        onClick={handleOnClick}
      />
    )
  );
}
