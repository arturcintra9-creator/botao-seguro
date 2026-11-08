/*
 * calculadora.js — liga o motor (calculadora-motor.js) à tela.
 *
 * Também faz as duas coisas escondidas:
 *  1. reconhece o código secreto (padrão: 1 9 0 =) e dispara o alerta
 *     SEM mudar nada na tela — sem som, vibração, aviso ou piscada;
 *  2. toque longo de 2 segundos no visor abre as configurações.
 */
(function () {
  'use strict';

  var motor = BotaoCalc.criar();
  var visor = document.getElementById('visor');
  var texto = document.getElementById('visor-texto');
  var teclado = document.getElementById('teclado');
  var teclaLimpar = document.getElementById('tecla-limpar');
  var operadores = teclado.querySelectorAll('.t-op:not([data-tecla="="])');

  // Etapa 1 do modo estande: "calculadora aberta".
  BS.marcarCalculadoraAberta();

  /* ---------- desenhar a tela ---------- */

  function desenhar() {
    texto.textContent = motor.visor();

    var rotulo = motor.rotuloLimpar();
    teclaLimpar.textContent = rotulo;
    teclaLimpar.setAttribute('aria-label', rotulo === 'AC' ? 'Apagar tudo' : 'Apagar');

    var ativo = motor.operadorAtivo();
    operadores.forEach(function (b) {
      b.classList.toggle('ativo', b.dataset.tecla === ativo);
    });

    ajustarFonte();
  }

  // Diminui a fonte do visor quando o número não cabe.
  function ajustarFonte() {
    texto.style.fontSize = '';
    var estilo = getComputedStyle(visor);
    var disponivel = visor.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    var tamanho = parseFloat(getComputedStyle(texto).fontSize);
    var minimo = tamanho * 0.35;
    while (texto.getBoundingClientRect().width > disponivel && tamanho > minimo) {
      tamanho *= 0.92;
      texto.style.fontSize = tamanho + 'px';
    }
  }

  /* ---------- teclas ---------- */

  function pressionar(tecla) {
    // O código secreto é reconhecido quando o número digitado logo antes do "="
    // é exatamente o código. Funciona sozinho (190 =) ou no meio de uma conta (5 + 190 =).
    if (tecla === '=' && motor.entradaDigitada() === BS.config().codigo) {
      BS.dispararAlerta(); // silencioso: nada na tela muda por causa disso
    }
    motor.pressionar(tecla);
    desenhar();
  }

  teclado.addEventListener('click', function (e) {
    var botao = e.target.closest('[data-tecla]');
    if (botao) pressionar(botao.dataset.tecla);
  });

  // Teclado físico (útil no notebook do estande).
  var atalhos = {
    'Enter': '=', '=': '=', 'Escape': 'C', 'Delete': 'C',
    '.': ',', ',': ',', '+': '+', '-': '-', '*': '*', 'x': '*', 'X': '*', '/': '/', '%': '%'
  };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tecla = /^[0-9]$/.test(e.key) ? e.key : atalhos[e.key];
    if (!tecla) return;
    e.preventDefault();
    pressionar(tecla);
    // Mostra a tecla "apertada" por um instante, como no toque.
    var botao = teclado.querySelector('[data-tecla="' + tecla + '"]');
    if (botao) {
      botao.classList.add('pressionada');
      setTimeout(function () { botao.classList.remove('pressionada'); }, 120);
    }
  });

  // No iPhone, o efeito de "apertado" (:active) só funciona com isto.
  document.addEventListener('touchstart', function () {}, { passive: true });

  /* ---------- gesto secreto: toque longo de 2 s no visor ---------- */

  var temporizador = null;
  var inicioX = 0;
  var inicioY = 0;

  function cancelarToqueLongo() {
    clearTimeout(temporizador);
    temporizador = null;
  }

  visor.addEventListener('pointerdown', function (e) {
    inicioX = e.clientX;
    inicioY = e.clientY;
    cancelarToqueLongo();
    temporizador = setTimeout(function () {
      // replace(): o botão "voltar" do celular não leva de volta às configurações.
      location.replace('configuracoes.html');
    }, 2000);
  });

  visor.addEventListener('pointermove', function (e) {
    if (Math.abs(e.clientX - inicioX) > 12 || Math.abs(e.clientY - inicioY) > 12) cancelarToqueLongo();
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evento) {
    visor.addEventListener(evento, cancelarToqueLongo);
  });

  // Sem menu de contexto no toque longo / botão direito.
  visor.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('resize', ajustarFonte);
  desenhar();
})();
