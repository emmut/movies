import { HTMLAttributes, ReactNode } from 'react';

type SkipToElementProp = {
  elementId: string;
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function SkipToElement({
  elementId,
  children,
  ...rest
}: SkipToElementProp) {
  return (
    <div {...rest}>
      <a
        href={`#${elementId}`}
        className="sr-only inline-block rounded-full border text-black focus:not-sr-only focus:border-neutral-50 focus:bg-neutral-50 focus:px-4 focus:py-0.5"
      >
        {children || 'Skip to main content'}
      </a>
    </div>
  );
}
