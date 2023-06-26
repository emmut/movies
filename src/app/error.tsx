'use client';

type ErrorPageProps = {
  reset: () => void;
};

export default function Error({ reset }: ErrorPageProps) {
  return (
    <div>
      <h2 className="text-lg font-bold">Something went wrong!</h2>
      <button
        className="rounded-sm bg-zinc-300 px-3 py-2 text-black"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
