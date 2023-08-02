# [dns.ton.org](http://dns.ton.org/)

Simple app to buy and manage DNS items associated with [Toncoin](https://ton.org/toncoin).

## Local Development

First, install `ngrok`:
```bash
npm install ngrok -g
```
Or see [other instaltion options](https://ngrok.com/download).

Launch a static HTTP-server:
```bash
npx http-server -p 5500
```
Or use any other HTTP-server providers, e.g., [live-server](https://www.npmjs.com/package/live-server). There is also a [VSCode Live Server extenstion](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

Finally, start the `ngrok` tunnel at the same port as in the previous step:
```bash
ngrok http 5500
```

If the wallet metadata is needed when debugging, update the `url` field in the `tonconnect-manifest.json` with the url provided by `ngrok`.
