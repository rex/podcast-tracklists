/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Search developers.google.com/web for articles tagged
 * "Headless Chrome" and scrape results from the results page.
 */

'use strict';

const puppeteer = require('puppeteer');

const tracklist_url = process.argv[2]

if (typeof tracklist_url == "undefined" || !tracklist_url || tracklist_url == "" || !tracklist_url.startsWith("https://www.1001tracklists.com")) {
  console.log("Must supply a valid 1001Playlists tracklist URL!");
  process.exit(1);
}

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(tracklist_url);

  // Extract the results from the page.
  const links = await page.evaluate(tracklist_url => {
    const playlist_selector = 'div[itemtype="http://schema.org/MusicPlaylist"]'
    const tracks_selector = 'div[itemtype="http://schema.org/MusicPlaylist"] table .tlpItem'
    const getContent = ($el, selector) => {
      const el = $el.querySelector(selector)
      return (el && el.content) ? el.content : '';
    }

    const pod_name = getContent(document, `${playlist_selector} > meta[itemprop="name"]`)
    const pod_datePublished = getContent(document, `${playlist_selector} > meta[itemprop="datePublished"]`)
    const pod_numTracks = getContent(document, `${playlist_selector} > meta[itemprop="numTracks"]`)
    const pod_genre = getContent(document, `${playlist_selector} > meta[itemprop="genre"]`)
    const pod_artist = getContent(document, `${playlist_selector} > meta[itemprop="author"]`)

    const tracks = Array.from(document.querySelectorAll(tracks_selector));
    const parsed_tracks = tracks.map(track => {
      const track_number = track.querySelector('input[id^="tlp_tracknumber_"]').value
      const artist = getContent(track, 'meta[itemprop="byArtist"]');
      const name = getContent(track, 'meta[itemprop="name"]');
      const duration = getContent(track, 'meta[itemprop="duration"]');
      const publisher = getContent(track, 'meta[itemprop="publisher"]');
      const url = getContent(track, 'meta[itemprop="url"]');

      // const title = track.textContent.split('|')[0].trim();
      // return `${title} - ${track.href}`;
      return `${track_number}. (${artist}) ${name} [${publisher}][${duration}] <br>`;
    });

    const pod_info = [
      `Episode Name: ${pod_name} <br>`,
      `Episode Published Date: ${pod_datePublished} <br>`,
      `Episode Track Count: ${pod_numTracks} <br>`,
      `Episode Genre: ${pod_genre} <br>`,
      `Episode Artist: ${pod_artist} <br>`,
      `Tracklist URL: ${tracklist_url} <br>`,
      `---- <br>`,
      `Track Listing: <br>`
    ]

    return pod_info.concat(parsed_tracks)
  }, tracklist_url);

  console.log(links.join('\n'));

  await browser.close();
})();
