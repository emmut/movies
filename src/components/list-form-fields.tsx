'use client';

import type { ChangeEvent } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EMOJI_OPTIONS } from '@/lib/config';
import { cn } from '@/lib/utils';

type ListFormFieldsProps = {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  emoji: string;
  onEmojiChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * Shared emoji / name / description inputs for the create and edit list dialogs.
 * Controlled — the parent owns the field state and submission.
 */
export function ListFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  emoji,
  onEmojiChange,
  disabled = false,
}: ListFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="emoji" className="text-right">
          Emoji
        </Label>
        <div className="col-span-3">
          <div className="grid max-h-32 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2">
            {EMOJI_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onEmojiChange(option)}
                className={cn(
                  'rounded p-2 text-xl transition-colors hover:bg-muted',
                  emoji === option && 'bg-primary text-primary-foreground',
                )}
                disabled={disabled}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Selected: {emoji}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
          className="col-span-3"
          disabled={disabled}
          maxLength={100}
          placeholder="e.g. Favorite Movies"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)}
          className="col-span-3"
          disabled={disabled}
          maxLength={500}
          placeholder="Optional description for your list"
        />
      </div>
    </div>
  );
}
