/*
 * estande.js — a tela do notebook no estande.
 *
 * Esquerda: calculadora (calculadora.html dentro de um <iframe>).
 * Direita: painel do contato (montado aqui mesmo, com painel.js).
 * Embaixo: linha do tempo com as 4 etapas, que acendem conforme acontecem.
 *
 * Sincronização: a calculadora grava no localStorage e avisa esta página
 * (evento 'storage' + postMessage do iframe). Se a calculadora estiver aberta
 * em OUTRA aba ou janela deste mesmo navegador, também funciona.
 */
(function () {
  'use strict';

  var iframe = document.getElementById('calculadora');
  var linhaTempo = document.querySelector('.linha-tempo');
  var etapas = Array.prototype.map.call(document.querySelectorAll('.etapa'), function (li) {
    return { li: li, hora: li.querySelector('.etapa-hora') };
  });
  var ultimoEstado = '';     // evita mexer no DOM quando nada mudou
  var temporizadorReinicio = null;

  /* ---------- começar do zero ---------- */

  function reiniciar() {
    // Efeito visual: celulares "piscam" e o ícone do botão gira.
    document.body.classList.remove('reiniciando');
    void document.body.offsetWidth;
    document.body.classList.add('reiniciando');
    clearTimeout(temporizadorReinicio);
    temporizadorReinicio = setTimeout(function () { document.body.classList.remove('reiniciando'); }, 700);

    BS.reiniciarDemo();
    // Recarrega a calculadora: visor zerado e etapa 1 marcada de novo.
    iframe.src = 'calculadora.html';
    preencherTextos();
    painel.atualizar();
    atualizar();
  }

  // Nomes e código vêm das configurações (se alguém mudou).
  function preencherTextos() {
    var cfg = BS.config();
    var contato = cfg.contatos.length ? cfg.contatos[0].nome : 'contato';
    document.querySelector('[data-nome-usuaria]').textContent = 'Celular de ' + cfg.nome;
    document.querySelector('[data-nome-contato]').textContent = 'Celular de ' + contato;
    document.querySelector('[data-codigo]').innerHTML =
      (cfg.codigo + '=').split('').map(function (t) { return '<kbd>' + BS.esc(t) + '</kbd>'; }).join('');
  }

  /* ---------- linha do tempo ---------- */

  function atualizar() {
    var sessao = BS.sessaoAtual();
    var a = BS.alertaAtual();
    var agora = Date.now();

    // Horário de cada etapa (ou null se ainda não aconteceu).
    var horarios = [
      sessao && sessao.abertaEm,
      a && a.codigoEm,
      a && a.enviadoEm && agora >= a.enviadoEm ? a.enviadoEm : null,
      a && a.notificadoEm
    ];

    // Só redesenha se algo mudou de verdade.
    var estado = horarios.map(function (h) { return h || 0; }).join('|');
    if (estado === ultimoEstado) return;
    ultimoEstado = estado;

    var etapa = 0;
    etapas.forEach(function (e, i) {
      var feita = !!horarios[i];
      e.li.classList.toggle('feita', feita);
      e.hora.textContent = feita ? BS.hora(horarios[i]) : '';
      if (feita) etapa = i + 1;
    });
    // A próxima etapa pendente pisca, para guiar o visitante.
    etapas.forEach(function (e, i) { e.li.classList.toggle('proxima', i === etapa); });

    document.body.dataset.etapa = String(etapa);
    linhaTempo.style.setProperty('--progresso', etapa / 4);
  }

  /* ---------- botões ---------- */

  document.getElementById('reiniciar').addEventListener('click', reiniciar);

  var botaoTelaCheia = document.getElementById('tela-cheia');
  if (!document.documentElement.requestFullscreen) {
    botaoTelaCheia.hidden = true;
  } else {
    botaoTelaCheia.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    });
    document.addEventListener('fullscreenchange', function () {
      botaoTelaCheia.textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
    });
  }

  // Atalho para o apresentador: tecla R reinicia (fora da calculadora).
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) reiniciar();
  });

  /* ---------- iniciar ---------- */

  var painel = PainelContato.montar(document.getElementById('painel'));
  BS.ouvir(function (chave) {
    if (chave === 'bs_config' || chave === null) preencherTextos();
    atualizar();
  });
  setInterval(function () { if (!document.hidden) atualizar(); }, 250);
  reiniciar(); // o estande sempre começa limpo
})();
