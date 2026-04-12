import { StartClient } from '@tanstack/react-start';
import { createRoot } from 'react-dom/client';
import { createRouter } from './router';

const router = createRouter();

createRoot(document.getElementById('root')!).render(<StartClient router={router} />);
