import cn from 'classnames';
import { HTMLAttributes, ReactNode } from 'react';

type PillProps = {
  active: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function Pill(props: PillProps) {
  const { active, children, ...rest } = props;
  return (
    <div
      className={cn([
        'cursor-pointer rounded-full border-2 border-neutral-50 px-4 py-1 text-center text-sm font-semibold hover:bg-transparent hover:text-neutral-50',
        {
          'bg-transparent text-neutral-50': active,
          'bg-neutral-50 text-neutral-950': !active,
        },
      ])}
      {...rest}
    >
      {children}
    </div>
  );
}
