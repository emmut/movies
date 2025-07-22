'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginError() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');

  const getErrorMessage = () => {
    switch (errorType) {
      case 'failed-to-login':
        return {
          title: 'Inloggning misslyckades',
          description:
            'Vi kunde inte logga in dig med Discord. Detta kan bero på att du avbröt inloggningen eller att det uppstod ett tekniskt problem.',
        };
      case 'access_denied':
        return {
          title: 'Åtkomst nekad',
          description:
            'Du nekade applikationen åtkomst till ditt Discord-konto. För att använda tjänsten behöver vi din tillåtelse.',
        };
      case 'server_error':
        return {
          title: 'Serverfel',
          description:
            'Ett oväntat fel uppstod på våra servrar. Försök igen om ett ögonblick.',
        };
      default:
        return {
          title: 'Inloggningsfel',
          description:
            'Ett oväntat fel uppstod under inloggningsprocessen. Försök igen eller kontakta support om problemet kvarstår.',
        };
    }
  };

  const error = getErrorMessage();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{error.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {error.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="mb-2 text-sm font-medium">Vad du kan göra:</h3>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Försök logga in igen</li>
              <li>• Kontrollera att du tillåter applikationen åtkomst</li>
              <li>• Säkerställ att du har en stabil internetanslutning</li>
              {errorType === 'failed-to-login' && (
                <li>• Prova att logga in anonymt istället</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <RefreshCw className="mr-2 h-4 w-4" />
                Försök igen
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Tillbaka till startsidan
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-xs">
            Om problemet kvarstår, kontakta gärna support för hjälp.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginError;
