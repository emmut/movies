import { twMerge } from 'tailwind-merge';
import SpinnerIcon from '@/icons/SpinnerIcon';

type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className }: SpinnerProps) {
  return (
    <div className={twMerge('h-6 w-6', className)}>
      <SpinnerIcon className="animate-spin text-zinc-700" />
    </div>
  );
}
