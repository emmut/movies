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

/**
 * The two-column grid of a movie's factual details (status, languages,
 * financials). Presentational; kept out of the page so the page stays under the
 * complexity budget and the facts render as one cohesive block.
 */
export function MovieFacts({ movie }: { movie: MovieDetails }) {
  const { status, original_title, release_date, spoken_languages, budget, revenue } = movie;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Fact label="Status">
          <p>{status || 'Unknown'}</p>
        </Fact>

        {original_title && (
          <Fact label="Original Title">
            <p>{original_title}</p>
          </Fact>
        )}

        <Fact label="Release Date">
          <p>{release_date || 'Not available'}</p>
        </Fact>

        {spoken_languages.length > 0 && (
          <Fact label="Languages">
            <p>{spoken_languages.map((lang) => lang.english_name).join(', ')}</p>
          </Fact>
        )}
      </div>

      <div className="space-y-4">
        {budget > 0 && (
          <Fact label="Budget">
            <Money amount={budget} />
          </Fact>
        )}

        {revenue > 0 && (
          <Fact label="Revenue">
            <Money amount={revenue} />
          </Fact>
        )}

        {revenue > 0 && budget > 0 && (
          <Fact label="Profit">
            <Money amount={revenue - budget} />
          </Fact>
        )}
      </div>
    </div>
  );
}
