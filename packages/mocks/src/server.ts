import { readFileSync } from 'fs';
import process from 'process';

import express from 'express';
import expressHttpProxy from 'express-http-proxy';
import minimist from 'minimist';

import { createMiddleware } from '@mswjs/http-middleware';

import { createDefaultHandlers } from './handlers';
import defaultPrefixMap from './prefixMap.json';
import { createHandlersFromHar } from './utils';

const argv = minimist(process.argv.slice(2));

const port = argv['port'] || 30088;
const host = argv['host'] || `http://localhost:${port}`;
const harFile = argv['harFile'] || undefined;
const prefixMapFile = argv['prefixMapFile'] || undefined;

const server = express();
server.disable('x-powered-by');
const proxy = expressHttpProxy(host);

// Proxy overrides
server.get('/version', (req, res) => {
  res.send('Forklift mock server');
});

const prefixMap = prefixMapFile
  ? JSON.parse(readFileSync(prefixMapFile, 'utf-8'))
  : defaultPrefixMap;

console.log('Using prefix map:', prefixMap);

const mswHandlers = harFile
  ? createHandlersFromHar(harFile, prefixMap)
  : createDefaultHandlers(defaultPrefixMap);
server.use(createMiddleware(...mswHandlers));

// Proxy
server.use('/', proxy);

server.listen(port, () => console.log(`Forklift mock server: ${host}`));
