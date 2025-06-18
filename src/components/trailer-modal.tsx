import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string;
}

/**
 * Displays a modal dialog containing an embedded YouTube video player.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked when the modal is requested to close
 * @param trailerKey - YouTube video identifier to embed
 */
export function TrailerModal({
  isOpen,
  onClose,
  trailerKey,
}: TrailerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px]">
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
