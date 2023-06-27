'use client';

type ErrorPageProps = {
  reset: () => void;
};

export default function Error({ reset }: ErrorPageProps) {
  return (
    <div>
      <h2 className="mt-4 text-2xl font-bold">Something went wrong!</h2>
      <button
        className="mt-4 rounded-full border border-neutral-50 px-4 py-1 text-neutral-50 hover:bg-neutral-50 hover:text-black"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
