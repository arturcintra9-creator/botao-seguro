/*
 * estado.js — "banco de dados" do protótipo.
 *
 * Tudo fica no localStorage do navegador. Nada sai do aparelho:
 * não existe servidor, SMS nem envio de verdade. É uma SIMULAÇÃO.
 *
 * Chaves usadas:
 *   bs_config  -> nome da usuária, código secreto e contatos de confiança
 *   bs_sessao  -> quando a calculadora foi aberta (etapa 1 do modo estande)
 *   bs_alerta  -> o alerta disparado (etapas 2, 3 e 4)
 *
 * Como as telas ficam sabendo das mudanças:
 *   1. evento 'storage'  -> avisa OUTRAS abas/janelas do mesmo navegador;
 *   2. postMessage       -> a calculadora dentro do <iframe> do modo estande
 *                           avisa a página "mãe" (funciona até em file://);
 *   3. as telas que exibem o alerta também releem o estado a cada 250 ms,
 *      como garantia extra.
 */
(function (global) {
  'use strict';

  var CHAVES = {
    config: 'bs_config',
    sessao: 'bs_sessao',
    alerta: 'bs_alerta'
  };

  // Configuração de fábrica (usada até alguém salvar as próprias).
  var PADRAO = {
    nome: 'Ana',
    codigo: '190',
    contatos: [
      { nome: 'Juliana (irmã)', telefone: '(11) 98765-4321' },
      { nome: 'Carla (vizinha)', telefone: '(11) 91234-5678' }
    ]
  };

  // Localização FICTÍCIA usada na simulação (não usamos GPS: pedir
  // permissão de localização mostraria um aviso na tela e quebraria o disfarce).
  var LOCAL_SIMULADO = {
    endereco: 'Rua das Acácias, 300 — Bela Vista, São Paulo (SP)',
    referencia: 'perto da Praça do Encontro',
    precisaoMetros: 30
  };

  // Tempos da simulação (em milissegundos).
  var ATRASO_ENVIO = 1200;       // código digitado -> alerta "enviado"
  var ATRASO_NOTIFICACAO = 800;  // alerta exibido no painel -> contato "notificado"

  // Cópia em memória: se o localStorage estiver bloqueado (aba anônima,
  // configurações do navegador), o protótipo continua funcionando na mesma página.
  var memoria = {};

  /* ---------- leitura e escrita seguras ---------- */

  function ler(chave) {
    try {
      var texto = localStorage.getItem(chave);
      return texto === null ? null : JSON.parse(texto);
    } catch (erro) {
      return chave in memoria ? memoria[chave] : null;
    }
  }

  function gravar(chave, valor) {
    memoria[chave] = valor;
    try {
      if (valor === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
      // Sem localStorage: segue só com a memória.
    }
    avisarJanelaMae(chave, valor);
  }

  // Se esta página está dentro de um <iframe> (modo estande), avisa a página de fora.
  function avisarJanelaMae(chave, valor) {
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage({ bs: 'botao-seguro', chave: chave, valor: valor }, '*');
      }
    } catch (erro) { /* ignora */ }
  }

  /* ---------- ouvir mudanças vindas de outras telas ---------- */

  function ouvir(callback) {
    // Outras abas/janelas do mesmo navegador.
    global.addEventListener('storage', function (e) {
      if (e.key === null || e.key.indexOf('bs_') === 0) callback(e.key);
    });

    // Mensagens do <iframe> (modo estande).
    global.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || d.bs !== 'botao-seguro') return;
      // Aceita só a mesma origem (ou 'null', que é como o file:// aparece).
      if (e.origin !== global.location.origin && e.origin !== 'null') return;

      memoria[d.chave] = d.valor;
      // Se o armazenamento NÃO for compartilhado (alguns navegadores em file://),
      // copia o valor para cá, para que ler() enxergue a novidade.
      try {
        var novo = d.valor === null ? null : JSON.stringify(d.valor);
        if (localStorage.getItem(d.chave) !== novo) {
          if (novo === null) localStorage.removeItem(d.chave);
          else localStorage.setItem(d.chave, novo);
        }
      } catch (erro) { /* ignora */ }
      callback(d.chave);
    });
  }

  /* ---------- configuração ---------- */

  function config() {
    var salvo = ler(CHAVES.config) || {};
    var contatos = Array.isArray(salvo.contatos) ? salvo.contatos : PADRAO.contatos;
    return {
      nome: (salvo.nome || PADRAO.nome).trim(),
      codigo: /^[1-9][0-9]{2,7}$/.test(salvo.codigo || '') ? salvo.codigo : PADRAO.codigo,
      contatos: contatos
        .filter(function (c) { return c && c.nome && c.nome.trim(); })
        .slice(0, 3)
    };
  }

  function salvarConfig(cfg) {
    gravar(CHAVES.config, cfg);
  }

  function restaurarPadrao() {
    gravar(CHAVES.config, null);
  }

  /* ---------- fluxo do alerta ---------- */

  // Etapa 1: a calculadora foi aberta.
  function marcarCalculadoraAberta() {
    gravar(CHAVES.sessao, { abertaEm: Date.now() });
  }

  // Etapas 2 e 3: código digitado e alerta "enviado".
  // O envio é simulado: o alerta fica com um horário de envio um pouco no
  // futuro, e quem exibe o alerta só o mostra quando esse horário chega.
  function dispararAlerta() {
    var cfg = config();
    var agora = Date.now();
    gravar(CHAVES.alerta, {
      id: agora.toString(36) + Math.random().toString(36).slice(2, 6),
      nome: cfg.nome,
      contatos: cfg.contatos,
      local: LOCAL_SIMULADO,
      codigoEm: agora,
      enviadoEm: agora + ATRASO_ENVIO,
      notificadoEm: null
    });
  }

  function alertaAtual() {
    return ler(CHAVES.alerta);
  }

  function sessaoAtual() {
    return ler(CHAVES.sessao);
  }

  // Etapa 4: o painel do contato exibiu o alerta.
  function marcarNotificado(id) {
    var a = ler(CHAVES.alerta);
    if (a && a.id === id && !a.notificadoEm) {
      a.notificadoEm = Date.now();
      gravar(CHAVES.alerta, a);
    }
  }

  // Volta tudo ao início (botão "Reiniciar demonstração").
  function reiniciarDemo() {
    gravar(CHAVES.alerta, null);
    gravar(CHAVES.sessao, null);
  }

  /* ---------- utilidades para as telas ---------- */

  // Escapa texto digitado pela pessoa antes de colocar no HTML.
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function hora(ms) {
    return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* ---------- funcionamento offline ---------- */

  // Registra o service worker (sw.js), que guarda os arquivos no aparelho.
  // Só funciona em http(s)/localhost; abrindo por file:// ele é ignorado.
  if ('serviceWorker' in navigator && /^https?:$/.test(global.location.protocol)) {
    global.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sem offline, segue normal */ });
    });
  }

  global.BS = {
    ATRASO_NOTIFICACAO: ATRASO_NOTIFICACAO,
    ouvir: ouvir,
    config: config,
    salvarConfig: salvarConfig,
    restaurarPadrao: restaurarPadrao,
    marcarCalculadoraAberta: marcarCalculadoraAberta,
    dispararAlerta: dispararAlerta,
    alertaAtual: alertaAtual,
    sessaoAtual: sessaoAtual,
    marcarNotificado: marcarNotificado,
    reiniciarDemo: reiniciarDemo,
    esc: esc,
    hora: hora
  };
})(window);
