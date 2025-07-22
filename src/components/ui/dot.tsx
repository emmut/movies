import clsx from 'clsx';

const sizes = ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6'];

function Dot({ animated = false, size = 3, className = '' }) {
  const sizeClass = sizes[size - 1];
  return (
    <>
      {animated ? (
        <span className={clsx('relative flex', sizeClass, className)}>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <span
            className={`relative inline-flex ${sizeClass} rounded-full bg-sky-500`}
          ></span>
        </span>
      ) : (
        <span
          className={clsx(
            'relative inline-flex',
            sizeClass,
            'rounded-full bg-sky-500',
            className
          )}
        ></span>
      )}
    </>
  );
}

Dot.displayName = 'Dot';
export { Dot };
