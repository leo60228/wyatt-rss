import xmlbuilder from 'xmlbuilder';
import { Readable } from 'stream';
import StreamArray from 'stream-json/streamers/StreamArray';
import { getAssetFromKV, NotFoundError } from "@cloudflare/kv-asset-handler";

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event).catch(ex => {
        console.error(ex);
        throw ex;
    }));
})

const wyatt = 'e16c3f28-eecd-4571-be1a-606bbac36b2b';
const hitType = 10;
const homerType = 9;

async function handleRequest(event) {
    try {
        const asset = await getAssetFromKV(event);
        return asset;
    } catch (err) {
        if (!(err instanceof NotFoundError)) {
            throw err;
        }
    }

    const request = event.request;

    const feedReq = await fetch(`https://www.blaseball.com/database/feed/player?id=${wyatt}`);

    const reader = feedReq.body.getReader();
    const feedStream = new Readable({
        async read(size) {
            let wantsMore = true;
            while (wantsMore) {
                await Promise.race([
                    reader.read().then(chunk => {
                        if (chunk.value) {
                            wantsMore = this.push(chunk.value);
                        } else {
                            this.push(null);
                            wantsMore = false;
                        }
                    }),
                    reader.closed.then(() => {
                        this.push(null);
                        wantsMore = false;
                    })
                ]);
            }
        }
    });
    const jsonStream = feedStream.pipe(StreamArray.withParser());

    const { readable, writable } = new TransformStream();
    const resp = new Response(readable, {
        headers: {
            'Content-Type': 'text/xml'
        }
    });

    const writer = writable.getWriter();

    const encoder = new TextEncoder();
    let builder = xmlbuilder.begin(chunk => writer.write(encoder.encode(chunk)), () => writer.close());

    let channel = builder
        .dec({
            version: '1.0',
            encoding: 'UTF-8'
        })
        .ins('xml-stylesheet', 'type="text/xsl" href="rss.xsl" media="screen"')
        .ele('rss').att('version', '2.0').att('xmlns:atom', 'http://www.w3.org/2005/Atom')
        .ele('channel')
        .ele('title').text('Wyatt Glover Hits').up()
        .ele('link').text('https://www.blaseball.com').up()
        .ele('description').text('This is a feed that will automatically update whenever Wyatt Glover hits.').up();

    channel = channel
        .ele('atom:link')
        .att('href', 'https://wyatt-rss.leo60228.workers.dev')
        .att('rel', 'self')
        .att('type', 'application/rss+xml')
        .up();

    await new Promise((resolve, reject) => {
        jsonStream.on('data', data => {
            try {
                const hit = data.value;
                if (hit.playerTags[0] !== wyatt) return;
                if (hit.type !== hitType && hit.type !== homerType) return;

                const date = new Date(hit.created);

                channel
                    .ele('item')
                    .ele('description').text(hit.description).up()
                    .ele('pubDate').text(date.toUTCString()).up()
                    .ele('guid').att('isPermaLink', 'false').text(hit.id).up()
                    .up();
            } catch (err) {
                reject(err);
                throw err;
            }
        });

        jsonStream.on('end', () => {
            try {
                channel.up().end();
                resolve();
            } catch (err) {
                reject(err);
                throw err;
            }
        });

        jsonStream.on('error', err => {
            reject(err);
        });
    });

    jsonStream.resume();

    return resp;
}
