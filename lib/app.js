import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import { setWebhook, getLinksFromUpdate } from './telegram.js';
import { insertItemsToPlaylist } from './youtube.js';
import { TELEGRAM_UPDATES_GATEWAY } from './config.js';

let debug = createDebug('app:');

export async function start() {
  await setWebhook();
  debug('Telegram webhook set');
}

async function routeUpdate(update) {
  if (update.channel_post) {
    const links = getLinksFromUpdate(update);
    debug('Links: ', links);
    await insertItemsToPlaylist(links);
  }
}

export async function route(req, res) {
  debug('Request path', req.url);
  try {
    switch (req.url) {
      case '/':
        res.statusCode = 200;
        const html = path.resolve('lib', 'index.html');
        return fs
          .createReadStream(html, {
            encoding: 'utf-8',
          })
          .pipe(res);
      case '/redirect':
        res.statusCode = 200;
        return res.end('Redirect url');
      case '/code':
        await insertItemsToPlaylist(req.body.code);
        return res.end();
      case TELEGRAM_UPDATES_GATEWAY:
        debug('Update body', JSON.stringify(req.body));
        await routeUpdate(req.body);
        res.statusCode = 200;
        return res.end();
      default:
        res.statusCode = 404;
        return res.end('Not found');
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(err.toString());
  }
}