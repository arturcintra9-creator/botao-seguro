/*
 * sw.js — service worker: guarda o site no aparelho para funcionar SEM INTERNET.
 *
 * Estratégia "rede primeiro, cache como reserva":
 *  - com internet: busca a versão nova (edições aparecem na hora) e atualiza o cache;
 *  - sem internet (ou rede travada por mais de 2,5 s): usa a cópia guardada.
 *
 * Só funciona quando o site é aberto por http(s) ou localhost (não em file://).
 * Ao adicionar um arquivo novo ao projeto, inclua-o na lista ARQUIVOS.
 */
var CACHE = 'botao-seguro-v3';

var ARQUIVOS = [
  './',
  'index.html',
  'calculadora.html',
  'configuracoes.html',
  'painel.html',
  'estande.html',
  'como-funciona.html',
  'calculadora.webmanifest',
  'css/site.css',
  'css/calculadora.css',
  'css/efeitos.css',
  'js/estado.js',
  'js/calculadora-motor.js',
  'js/calculadora.js',
  'js/configuracoes.js',
  'js/painel.js',
  'js/estande.js',
  'js/efeitos.js',
  'icones/marca.svg',
  'icones/calculadora.svg',
  'icones/calculadora-180.png',
  'icones/calculadora-192.png',
  'icones/calculadora-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(ARQUIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  // Apaga caches de versões antigas.
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== CACHE; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function comPrazo(promessa, ms) {
  return new Promise(function (ok, falha) {
    var t = setTimeout(function () { falha(new Error('prazo')); }, ms);
    promessa.then(function (r) { clearTimeout(t); ok(r); }, function (err) { clearTimeout(t); falha(err); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  var daRede = fetch(req).then(function (resp) {
    if (resp && resp.ok) {
      var copia = resp.clone();
      caches.open(CACHE).then(function (cache) { cache.put(req, copia); });
    }
    return resp;
  });

  e.respondWith(
    comPrazo(daRede, 2500).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (guardado) {
        return guardado || daRede;
      });
    })
  );
});
