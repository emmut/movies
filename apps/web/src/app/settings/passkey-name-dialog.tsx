'use client';

import { passkeyNameSchema, type PasskeyNameForm } from '@movies/api/passkeys';
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
  form: PasskeyNameForm;
  initialName?: string;
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
  form,
  initialName = form.initialName,
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
    const parsed = passkeyNameSchema.safeParse(name);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setIsPending(true);
    try {
      const shouldClose = await onSubmit(parsed.data);
      if (shouldClose) {
        setIsOpen(false);
      }
    } catch {
      toast.error(form.failureMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{form.title}</DialogTitle>
            <DialogDescription>{form.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={inputId}>Passkey Name</Label>
            <Input
              id={inputId}
              placeholder="e.g., MacBook Pro, iPhone, YubiKey"
              value={name}
              maxLength={100}
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
              {isPending ? form.pendingLabel : form.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
