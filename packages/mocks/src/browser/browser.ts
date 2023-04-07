import { setupWorker } from 'msw';

import { createDefaultHandlers } from '../shared/handlers';

export const worker = setupWorker(...createDefaultHandlers({}));
