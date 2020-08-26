import googleapis from 'googleapis';
import auth from 'google-auth-library';
import getVideoId from 'get-video-id';
import createDebug from 'debug';
import { GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_ID, YOUTUBE_PLAYLIST_ID } from './config.js';

const debug = createDebug('app:youtube');

export async function getPlaylistItems() {
  const {
    data: { items },
  } = await youtube.playlistItems.list({
    part: 'id,snippet',
    playlistId: YOUTUBE_PLAYLIST_ID,
  });
  return items;
}

export async function insertItemsToPlaylist(code) {
  const links = ['https://www.youtube.com/watch?v=ajuz6u-nADY&list=RDajuz6u-nADY&start_radio=1'];
  const client = await getAuthenticatedClient(code);
  const youtube = new googleapis.google.youtube({
    version: 'v3',
    auth: client,
  });
  await Promise.all(
    links.map(async (link) => {
      const info = getVideoId(link);
      if (info && info.id && info.service === 'youtube') {
        try {
          const res = await youtube.playlistItems.insert({
            part: 'id,snippet',
            requestBody: {
              id: info.id,
              snippet: {
                playlistId: YOUTUBE_PLAYLIST_ID,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: info.id,
                },
              },
            },
          });
          console.log('Res', res);
        } catch (err) {
          debug('Error on playlist insert', err);
        }
      }
    })
  );
}

async function getAuthenticatedClient(code) {
  try {
    const client = new auth.OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    return client;
  } catch (err) {
    debug('Error on get access token', err);
    throw err;
  }
}