/*
 * painel.js — a tela de quem RECEBE o alerta (contato de confiança).
 *
 * Uso:  PainelContato.montar(elemento)
 * Funciona sozinho em painel.html e também dentro do modo estande.
 * Atualiza sozinho quando o alerta é disparado em outra aba/tela.
 */
(function (global) {
  'use strict';

  var esc = BS.esc;

  /* ---------- ícones (SVG inline, sem arquivos externos) ---------- */

  var LOGO =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#5B2C87"/>' +
    '<circle cx="16" cy="16" r="9" fill="none" stroke="#EDE0F5" stroke-width="2.5"/>' +
    '<circle cx="16" cy="16" r="4" fill="#E8A317"/></svg>';

  var ICONE_ESCUDO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>';

  var ICONE_PIN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  var ICONE_TELEFONE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>';

  var ICONE_MAPA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>';

  /* ---------- mapa desenhado à mão em SVG (sem API de mapa) ---------- */
  // O alfinete fica em (168, 122), na Rua das Acácias.

  var MAPA =
    '<svg viewBox="0 0 300 190" role="img" aria-label="Mapa simulado mostrando a localização aproximada na Rua das Acácias">' +
      '<rect width="300" height="190" fill="#24143A"/>' +
      '<g class="mapa-zoom">' +
        // praça
        '<rect x="214" y="6" width="80" height="62" rx="8" fill="#2F3B3F"/>' +
        '<circle cx="236" cy="26" r="6" fill="#36484A"/><circle cx="262" cy="44" r="8" fill="#36484A"/>' +
        '<circle cx="280" cy="22" r="5" fill="#36484A"/>' +
        '<text x="254" y="62" fill="#A7B8B5" font-size="7" text-anchor="middle" font-family="system-ui, sans-serif">Praça do Encontro</text>' +
        // quarteirões
        '<g fill="#311E4D">' +
          '<rect x="6" y="6" width="72" height="62" rx="6"/><rect x="96" y="6" width="100" height="62" rx="6"/>' +
          '<rect x="6" y="86" width="72" height="26" rx="6"/><rect x="96" y="86" width="100" height="26" rx="6"/>' +
          '<rect x="214" y="86" width="80" height="26" rx="6"/>' +
          '<rect x="6" y="132" width="72" height="52" rx="6"/><rect x="96" y="132" width="100" height="52" rx="6"/>' +
          '<rect x="214" y="132" width="80" height="52" rx="6"/>' +
        '</g>' +
        // ruas
        '<g stroke="#4A3070" stroke-width="14" stroke-linecap="square">' +
          '<line x1="0" y1="77" x2="300" y2="77"/>' +
          '<line x1="87" y1="0" x2="87" y2="190"/><line x1="205" y1="0" x2="205" y2="190"/>' +
        '</g>' +
        // rua principal (onde está o alerta)
        '<line class="rua-principal" x1="0" y1="122" x2="300" y2="122" stroke="#5B2C87" stroke-width="18"/>' +
        '<line class="rua-tracejada" x1="0" y1="122" x2="300" y2="122" stroke="#6B3FA0" stroke-width="1.5" stroke-dasharray="6 6"/>' +
        // nomes das ruas
        '<g fill="#C9AEDD" font-size="7.5" font-family="system-ui, sans-serif" font-weight="600">' +
          '<text x="12" y="80">Rua do Ipê</text>' +
          '<text x="12" y="119.5">Rua das Acácias</text>' +
          '<text x="0" y="0" transform="translate(90 172) rotate(-90)">Rua Sabiá</text>' +
          '<text x="0" y="0" transform="translate(208 60) rotate(-90)">Rua Aurora</text>' +
        '</g>' +
        // área de precisão + pulsos + alfinete
        '<circle class="precisao" cx="168" cy="122" r="30" fill="#E8A317" fill-opacity="0.12" stroke="#E8A317" stroke-opacity="0.45" stroke-dasharray="3 3"/>' +
        '<circle class="pulso" cx="168" cy="122" r="9" fill="none" stroke="#E8A317" stroke-width="2"/>' +
        '<circle class="pulso pulso-2" cx="168" cy="122" r="9" fill="none" stroke="#E8A317" stroke-width="2"/>' +
        '<ellipse cx="168" cy="123" rx="5" ry="2" fill="#000" fill-opacity="0.35"/>' +
        '<g class="pin-cair">' +
          '<path d="M168 122c-8-9.5-12.5-15.5-12.5-21.5a12.5 12.5 0 0 1 25 0c0 6-4.5 12-12.5 21.5z" fill="#E8A317" stroke="#2E1A47" stroke-width="1.5"/>' +
          '<circle cx="168" cy="100.5" r="4.5" fill="#2E1A47"/>' +
        '</g>' +
      '</g>' +
      // bússola e escala (não ampliam)
      '<g font-family="system-ui, sans-serif" font-weight="700">' +
        '<circle cx="18" cy="172" r="9" fill="#2E1A47" stroke="#6B3FA0"/>' +
        '<text x="18" y="175" fill="#EDE0F5" font-size="8" text-anchor="middle">N</text>' +
        '<line x1="236" y1="178" x2="286" y2="178" stroke="#EDE0F5" stroke-width="2"/>' +
        '<text x="261" y="173" fill="#EDE0F5" font-size="7" text-anchor="middle">50 m</text>' +
      '</g>' +
    '</svg>';

  /* ---------- partes da tela ---------- */

  function textoNomes(lista) {
    if (lista.length <= 1) return lista.join('');
    return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
  }

  function htmlEspera(cfg) {
    return (
      '<div class="espera">' +
        '<div class="espera-icone"><span class="anel"></span><span class="anel"></span>' + ICONE_ESCUDO + '</div>' +
        '<h2>Tudo tranquilo por aqui</h2>' +
        '<p>Você é contato de confiança de <strong>' + esc(cfg.nome) + '</strong>. ' +
        'Se ela acionar o Botão Seguro, o alerta aparece aqui na hora.</p>' +
        '<p class="miudo">Aguardando alertas<span class="reticencias" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>' +
      '</div>'
    );
  }

  function htmlAlerta(a) {
    var outros = (a.contatos || []).slice(1).map(function (c) { return esc(c.nome); });
    return (
      '<article class="alerta" role="alert">' +
        '<span class="alerta-faixa">Alerta silencioso</span>' +
        '<h2 class="alerta-titulo">' + esc(a.nome) + ' acionou o Botão Seguro</h2>' +
        '<p class="alerta-hora">Recebido às <strong>' + BS.hora(a.enviadoEm) + '</strong> · <span data-relativo>agora</span></p>' +
        '<div class="mapa" data-mapa>' + MAPA + '</div>' +
        '<div class="endereco">' + ICONE_PIN +
          '<div><strong>' + esc(a.local.endereco) + '</strong>' +
          '<span>' + esc(a.local.referencia) + ' · precisão de ~' + a.local.precisaoMetros + ' m</span></div>' +
        '</div>' +
        '<div class="alerta-acoes">' +
          '<button type="button" class="botao botao-ouro brilho-auto" data-acao="ligar">' + ICONE_TELEFONE + 'Ligar 190</button>' +
          '<button type="button" class="botao botao-contorno" data-acao="mapa">' + ICONE_MAPA + 'Ver no mapa</button>' +
        '</div>' +
        '<p class="alerta-retorno" data-retorno aria-live="polite"></p>' +
        '<div class="alerta-dica"><strong>Importante:</strong> evite ligar ou mandar mensagem para ' + esc(a.nome) +
          ' agora. O celular dela pode estar sendo vigiado. Se houver risco, ligue 190.</div>' +
        (outros.length ? '<p class="alerta-outros">Também foram avisados: ' + textoNomes(outros) + '.</p>' : '') +
        '<p class="alerta-simulado">Simulação de protótipo — nenhum dado real foi enviado.</p>' +
      '</article>'
    );
  }

  function tempoRelativo(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 5) return 'agora';
    if (s < 60) return 'há ' + s + ' s';
    var m = Math.floor(s / 60);
    return 'há ' + m + ' min';
  }

  /* ---------- montagem ---------- */

  function montar(raiz) {
    var cfg = BS.config();
    var nomeContato = cfg.contatos.length ? cfg.contatos[0].nome : 'Contato de confiança';

    raiz.classList.add('painel');
    raiz.innerHTML =
      '<header class="painel-topo">' + LOGO +
        '<div class="painel-app">Botão Seguro<small>Celular de ' + esc(nomeContato) + '</small></div>' +
        '<span class="painel-status" data-status>Online</span>' +
      '</header>' +
      '<div class="painel-corpo" data-corpo></div>' +
      '<div class="painel-flash" aria-hidden="true"></div>';

    var corpo = raiz.querySelector('[data-corpo]');
    var status = raiz.querySelector('[data-status]');
    var chaveAtual = null;
    var temporizadorRetorno = null;
    var relativo = null;      // <span> do "há X s"
    var textoRelativo = '';   // último texto escrito nele (evita mexer no DOM à toa)

    function atualizar() {
      if (document.hidden) return; // aba em segundo plano: não gasta bateria
      var a = BS.alertaAtual();
      // O alerta só "chega" depois do horário de envio simulado.
      var chegou = a && a.enviadoEm && Date.now() >= a.enviadoEm;
      var chave = chegou ? a.id : 'espera';

      if (chave !== chaveAtual) {
        chaveAtual = chave;
        cfg = BS.config();
        corpo.innerHTML = chegou ? htmlAlerta(a) : htmlEspera(cfg);
        raiz.classList.toggle('painel-alerta', !!chegou);
        status.textContent = chegou ? 'Alerta' : 'Online';
        corpo.scrollTop = 0;
        raiz.scrollTop = 0;
        relativo = corpo.querySelector('[data-relativo]');
        textoRelativo = '';

        // Clarão dourado na chegada (reinicia a animação mesmo se vier outro alerta).
        raiz.classList.remove('flash');
        if (chegou) {
          void raiz.offsetWidth;
          raiz.classList.add('flash');
        }

        // Etapa 4: o contato foi notificado (o alerta apareceu na tela dele).
        if (chegou && !a.notificadoEm) {
          var id = a.id;
          setTimeout(function () { BS.marcarNotificado(id); }, BS.ATRASO_NOTIFICACAO);
        }
      }

      if (chegou && relativo) {
        var t = tempoRelativo(a.enviadoEm);
        if (t !== textoRelativo) { textoRelativo = t; relativo.textContent = t; }
      }
    }

    // Botões do alerta: só visuais (é um protótipo).
    corpo.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-acao]');
      if (!botao) return;
      var retorno = corpo.querySelector('[data-retorno]');
      var mensagem;

      if (botao.dataset.acao === 'ligar') {
        mensagem = 'Protótipo: nenhuma ligação foi feita. No app real, abriria o discador com o 190.';
      } else {
        var mapa = corpo.querySelector('[data-mapa]');
        var ampliado = mapa.classList.toggle('ampliado');
        botao.lastChild.textContent = ampliado ? 'Afastar' : 'Ver no mapa';
        mensagem = ampliado ? 'Protótipo: no app real, abriria o mapa do celular com a rota.' : '';
      }

      retorno.textContent = mensagem;
      clearTimeout(temporizadorRetorno);
      temporizadorRetorno = setTimeout(function () { retorno.textContent = ''; }, 5000);
    });

    BS.ouvir(atualizar);           // mudanças vindas de outras abas / do iframe
    setInterval(atualizar, 250);   // garantia extra + "há X s"
    document.addEventListener('visibilitychange', atualizar); // voltou para a aba: atualiza na hora
    atualizar();

    return { atualizar: atualizar };
  }

  global.PainelContato = { montar: montar };
})(window);
