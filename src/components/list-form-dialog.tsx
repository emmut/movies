'use client';

import { type ReactElement, useState } from 'react';

import { ListFormFields } from '@/components/list-form-fields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface ListFormValues {
  name: string;
  description: string;
  emoji: string;
}

interface ListFormDialogProps {
  title: string;
  description: string;
  initialValues: ListFormValues;
  submitLabel: string;
  pendingLabel: string;
  /** Runs the action with trimmed values; returns true to close the dialog. */
  onSubmit: (values: ListFormValues) => Promise<boolean>;
  /** Trigger element. Omit when controlling `open` externally. */
  trigger?: ReactElement;
  showCancel?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Open-state management supporting both controlled and uncontrolled use. */
function useControlledDialog(
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
  onClose: () => void,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) {
      onClose();
    }
  }

  return [isOpen, handleOpenChange] as const;
}

function DialogSubmitFooter({
  showCancel,
  onCancel,
  onSubmit,
  canSubmit,
  isLoading,
  submitLabel,
  pendingLabel,
}: {
  showCancel: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isLoading: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <DialogFooter>
      {showCancel && (
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      )}
      <Button onClick={onSubmit} disabled={isLoading || !canSubmit}>
        {isLoading ? pendingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}

/**
 * Shared dialog scaffolding for creating and editing lists. Owns the field
 * state and submission flow; callers supply the action via `onSubmit`.
 */
export function ListFormDialog({
  title,
  description,
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  trigger,
  showCancel = false,
  open,
  onOpenChange,
}: ListFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [isOpen, handleOpenChange] = useControlledDialog(open, onOpenChange, () =>
    setValues(initialValues),
  );

  async function handleSubmit() {
    setIsLoading(true);
    try {
      const close = await onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        emoji: values.emoji,
      });
      if (close) {
        handleOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ListFormFields
          name={values.name}
          onNameChange={(name) => setValues((v) => ({ ...v, name }))}
          description={values.description}
          onDescriptionChange={(description) => setValues((v) => ({ ...v, description }))}
          emoji={values.emoji}
          onEmojiChange={(emoji) => setValues((v) => ({ ...v, emoji }))}
          disabled={isLoading}
        />
        <DialogSubmitFooter
          showCancel={showCancel}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          canSubmit={values.name.trim().length > 0}
          isLoading={isLoading}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
