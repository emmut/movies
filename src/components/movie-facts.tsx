import { DollarSign } from 'lucide-react';

import type { MovieDetails } from '@/types/movie';
import { formatCurrency } from '@/lib/utils';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">{label}</h3>
      {children}
    </div>
  );
}

function Money({ amount }: { amount: number }) {
  return (
    <p className="flex items-center gap-1">
      <DollarSign className="h-4 w-4" />
      {formatCurrency(amount, false)}
    </p>
  );
}

/** A text fact, hidden when the value is empty unless a fallback is given. */
function TextFact({
  label,
  value,
  fallback,
}: {
  label: string;
  value: string | undefined;
  fallback?: string;
}) {
  const text = value || fallback;
  if (!text) {
    return null;
  }
  return (
    <Fact label={label}>
      <p>{text}</p>
    </Fact>
  );
}

/** A monetary fact, hidden when the amount is null. */
function MoneyFact({ label, amount }: { label: string; amount: number | null }) {
  if (amount === null) {
    return null;
  }
  return (
    <Fact label={label}>
      <Money amount={amount} />
    </Fact>
  );
}

function positiveOrNull(amount: number): number | null {
  return amount > 0 ? amount : null;
}

/** Profit is only meaningful when both budget and revenue are reported. */
function profitOf(budget: number, revenue: number): number | null {
  if (budget <= 0 || revenue <= 0) {
    return null;
  }
  return revenue - budget;
}

/**
 * The two-column grid of a movie's factual details (status, languages,
 * financials). Presentational; kept out of the page so the page stays under the
 * complexity budget and the facts render as one cohesive block.
 */
export function MovieFacts({ movie }: { movie: MovieDetails }) {
  const { status, original_title, release_date, spoken_languages, budget, revenue } = movie;
  const languages = spoken_languages.map((lang) => lang.english_name).join(', ');

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <TextFact label="Status" value={status} fallback="Unknown" />
        <TextFact label="Original Title" value={original_title} />
        <TextFact label="Release Date" value={release_date} fallback="Not available" />
        <TextFact label="Languages" value={languages} />
      </div>

      <div className="space-y-4">
        <MoneyFact label="Budget" amount={positiveOrNull(budget)} />
        <MoneyFact label="Revenue" amount={positiveOrNull(revenue)} />
        <MoneyFact label="Profit" amount={profitOf(budget, revenue)} />
      </div>
    </div>
  );
}
