'use client';

import { Button } from '@movies/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@movies/ui/components/dialog';
import { Input } from '@movies/ui/components/input';
import { Label } from '@movies/ui/components/label';
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { toast } from 'sonner';

type PasskeyNameDialogProps = {
  /** Element the dialog trigger renders as, e.g. `<Button />`. */
  trigger: ReactElement;
  triggerLabel: ReactNode;
  title: string;
  description: string;
  initialName: string;
  submitLabel: string;
  pendingLabel: string;
  /** Resolves `true` to close the dialog, `false` to keep it open. */
  onSubmit: (name: string) => Promise<boolean>;
};

/**
 * Dialog with a single passkey-name field, shared by adding and renaming.
 * The name resets to `initialName` every time the dialog opens.
 */
export function PasskeyNameDialog({
  trigger,
  triggerLabel,
  title,
  description,
  initialName,
  submitLabel,
  pendingLabel,
  onSubmit,
}: PasskeyNameDialogProps) {
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState(initialName);

  function handleOpenChange(open: boolean) {
    if (open) {
      setName(initialName);
    }
    setIsOpen(open);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed === '') {
      toast.error('Please enter a name for your passkey.');
      return;
    }

    setIsPending(true);
    const shouldClose = await onSubmit(trimmed);
    setIsPending(false);

    if (shouldClose) {
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={inputId}>Passkey Name</Label>
            <Input
              id={inputId}
              placeholder="e.g., MacBook Pro, iPhone, YubiKey"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
