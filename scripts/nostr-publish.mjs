#!/usr/bin/env node
// Nostr 免注册云端同步：生成密钥 / 发布状态 / 读回验证
// 用法:
//   node nostr-publish.mjs genkey
//   node nostr-publish.mjs publish <state.json> --sk <hex> [--dtag my-doc] [--timeout 20000]
//   node nostr-publish.mjs read --pk <hex> [--dtag my-doc] [--timeout 20000]
//
// state.json 的完整内容会被 JSON.stringify 后作为 kind:30078 可替换事件的 content。
// 为什么手写协议而不用 nostr-tools 的 Relay/SimplePool:
// 在 Node 和部分网络环境下其默认 connectionTimeout=4400ms 会误杀慢连接（实测全超时），
// 而浏览器里需用 pool.ensureRelay(url,{connectionTimeout:25000}) + querySync(...,{maxWait:25000}) 绕过。
import WS from 'ws';
import {generateSecretKey, getPublicKey, finalizeEvent} from 'nostr-tools';
import {readFileSync} from 'fs';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.mom',
  'wss://offchain.pub',
  'wss://relay.primal.net',
];

const hexToBytes = h => Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16)));
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const cmd = process.argv[2];

if (cmd === 'genkey') {
  const sk = generateSecretKey();
  console.log('SK=' + Buffer.from(sk).toString('hex'));
  console.log('PK=' + getPublicKey(sk));
  process.exit(0);
}

const DTAG = arg('dtag', 'collab-board-state');
const TIMEOUT = parseInt(arg('timeout', '20000'), 10);
setTimeout(() => { console.error('GLOBAL_TIMEOUT'); process.exit(2); }, TIMEOUT * (cmd === 'read' ? 4 : 6));

function session(url, ev, pk) {
  return new Promise(resolve => {
    const out = {url, published: false, event: null};
    const to = setTimeout(() => { try { ws.terminate(); } catch (e) {} resolve(out); }, TIMEOUT);
    let ws;
    try { ws = new WS(url, {handshakeTimeout: TIMEOUT - 2000}); }
    catch (e) { clearTimeout(to); return resolve(out); }
    ws.on('open', () => {
      if (ev) ws.send(JSON.stringify(['EVENT', ev]));
      ws.send(JSON.stringify(['REQ', 's1', {kinds: [30078], authors: [pk], '#d': [DTAG]}]));
    });
    ws.on('message', buf => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (m[0] === 'OK' && ev && m[1] === ev.id && m[2] === true) out.published = true;
      if (m[0] === 'EVENT' && m[2]) {
        if (!out.event || m[2].created_at > out.event.created_at) out.event = m[2];
      }
      if (m[0] === 'EOSE') { clearTimeout(to); try { ws.close(); } catch (e) {} setTimeout(() => resolve(out), 400); }
    });
    ws.on('error', () => { clearTimeout(to); resolve(out); });
  });
}

if (cmd === 'publish') {
  const file = process.argv[3];
  const sk = arg('sk');
  if (!file || !sk) { console.error('用法: publish <state.json> --sk <hex>'); process.exit(1); }
  const skBytes = hexToBytes(sk);
  const pk = getPublicKey(skBytes);
  const content = JSON.stringify(JSON.parse(readFileSync(file, 'utf-8')));
  console.error('内容 ' + Buffer.byteLength(content) + ' 字节（中继上限约 64KB）');
  if (Buffer.byteLength(content) > 60000) { console.error('WARN: 接近中继体积上限，可能被拒'); }
  const ev = finalizeEvent({
    kind: 30078, created_at: Math.floor(Date.now() / 1000),
    tags: [['d', DTAG]], content
  }, skBytes);
  let ok = 0;
  for (const url of RELAYS) {
    const r = await session(url, ev, pk);
    const back = r.event && r.event.id === ev.id;
    console.error(url + ' 发布:' + (r.published ? '✅' : '❌') + ' 读回:' + (back ? '✅' : '❌'));
    if (r.published) ok++;
  }
  console.log(JSON.stringify({published: ok, of: RELAYS.length, id: ev.id, pk}));
  process.exit(ok > 0 ? 0 : 1);
}

if (cmd === 'read') {
  const pk = arg('pk');
  if (!pk) { console.error('用法: read --pk <hex>'); process.exit(1); }
  let latest = null;
  for (const url of RELAYS) {
    const r = await session(url, null, pk);
    if (r.event && (!latest || r.event.created_at > latest.created_at)) latest = r.event;
  }
  if (!latest) { console.error('NOT_FOUND'); process.exit(1); }
  console.log(latest.content);
  process.exit(0);
}

console.error('未知命令: ' + cmd);
process.exit(1);
