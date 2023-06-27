type OverlayProps = {
  navOpen: boolean;
  handleOnClick: () => void;
};

export default function Overlay({ navOpen, handleOnClick }: OverlayProps) {
  return (
    navOpen && (
      <div
        className="absolute inset-0 z-10 cursor-pointer bg-neutral-900/40"
        onClick={handleOnClick}
      />
    )
  );
}
