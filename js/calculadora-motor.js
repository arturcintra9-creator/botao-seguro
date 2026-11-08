/*
 * calculadora-motor.js — a matemática da calculadora, sem nada de tela.
 *
 * Fica separado da interface para poder ser testado sozinho
 * (veja testes/teste-calculadora.js). Se a calculadora errar uma conta,
 * o disfarce cai — por isso o cuidado.
 *
 * Regras (iguais às de uma calculadora de celular):
 *  - × e ÷ são feitos antes de + e −   (2 + 3 × 4 = 14)
 *  - "=" repetido repete a última operação   (2 + 3 = = -> 8)
 *  - % depois de + ou − é "porcentagem de"   (200 + 10 % = 220)
 *  - % sozinho divide por 100                (50 % -> 0,5)
 *  - até 9 dígitos por número; resultados grandes viram notação científica
 *  - dividir por zero mostra "Erro"
 *
 * Teclas aceitas por pressionar(): '0'..'9', ',', '+', '-', '*', '/', '=', '%', '±', 'C'
 */
(function (global) {
  'use strict';

  var MAX_DIGITOS = 9;

  // Remove o "ruído" de ponto flutuante (0,1 + 0,2 = 0,30000000000000004).
  function arredondar(n) {
    return n === 0 ? 0 : Number(n.toPrecision(15));
  }

  function aplicar(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
    }
    return NaN;
  }

  // Avalia uma lista [número, op, número, op, número...] com precedência.
  function avaliar(lista) {
    var termos = [lista[0]];
    var somas = [];
    for (var i = 1; i < lista.length; i += 2) {
      var op = lista[i];
      var n = lista[i + 1];
      if (op === '*' || op === '/') {
        termos[termos.length - 1] = aplicar(termos[termos.length - 1], op, n);
      } else {
        somas.push(op);
        termos.push(n);
      }
    }
    var r = termos[0];
    for (var j = 0; j < somas.length; j++) r = aplicar(r, somas[j], termos[j + 1]);
    return arredondar(r);
  }

  /* ---------- formatação no padrão brasileiro (1.234,5) ---------- */

  function agruparMilhar(inteiro) {
    return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Formata o que a pessoa está digitando, preservando "0," e zeros finais.
  function formatarEntrada(txt) {
    var negativo = txt.charAt(0) === '-';
    if (negativo) txt = txt.slice(1);
    var partes = txt.split('.');
    var s = agruparMilhar(partes[0]);
    if (partes.length > 1) s += ',' + partes[1];
    return (negativo ? '-' : '') + s;
  }

  // Formata um resultado com no máximo 9 dígitos visíveis.
  function formatarNumero(n) {
    if (!isFinite(n)) return 'Erro';
    if (n === 0) return '0';
    var abs = Math.abs(n);
    var sinal = n < 0 ? '-' : '';

    if (abs >= 1e-8 && abs < 1e9) {
      var digitosInteiros = abs >= 1 ? String(Math.floor(abs)).length : 1;
      var casas = Math.max(0, MAX_DIGITOS - digitosInteiros);
      var txt = abs.toFixed(casas);
      if (txt.indexOf('.') >= 0) txt = txt.replace(/0+$/, '').replace(/\.$/, '');
      if (txt !== '0' && txt.split('.')[0].length <= MAX_DIGITOS) {
        return sinal + formatarEntrada(txt);
      }
    }

    // Notação científica: 1,23457e12
    var partes = abs.toExponential(5).split('e');
    var mantissa = partes[0].replace(/0+$/, '').replace(/\.$/, '');
    return sinal + mantissa.replace('.', ',') + 'e' + Number(partes[1]);
  }

  /* ---------- a calculadora em si ---------- */

  function criar() {
    var fila;          // contas pendentes: [número, op, número, op...] — termina com op
    var entrada;       // texto do número sendo digitado (com '.' como decimal)
    var editando;      // a pessoa está digitando um número agora?
    var pendente;      // existe um número "novo" na tela que ainda não entrou na fila?
    var resultado;     // valor mostrado quando não está digitando
    var ultimoOp;      // para repetir com "=" seguido
    var ultimoOperando;
    var opAtivo;       // operador destacado na tela
    var erro;

    function zerar() {
      fila = [];
      entrada = '0';
      editando = false;
      pendente = false;
      resultado = 0;
      ultimoOp = null;
      ultimoOperando = null;
      opAtivo = null;
      erro = false;
    }
    zerar();

    function valorAtual() {
      return editando ? Number(entrada) : resultado;
    }

    function definirResultado(n) {
      resultado = n;
      if (!isFinite(n)) {
        erro = true;
        fila = [];
        opAtivo = null;
      }
    }

    function comecarEntrada(texto) {
      // Número novo logo depois de "=": não repete mais a conta anterior.
      if (fila.length === 0) ultimoOp = null;
      entrada = texto;
      editando = true;
      pendente = true;
      opAtivo = null;
    }

    function digito(d) {
      if (erro) zerar();
      if (!editando) comecarEntrada('0');
      var qtd = entrada.replace(/[^0-9]/g, '').length;
      var vazio = entrada === '0' || entrada === '-0';
      if (qtd >= MAX_DIGITOS && !vazio) return;
      if (entrada === '0') entrada = d;
      else if (entrada === '-0') entrada = '-' + d;
      else entrada += d;
    }

    function virgula() {
      if (erro) zerar();
      if (!editando) comecarEntrada('0');
      if (entrada.indexOf('.') < 0) entrada += '.';
    }

    // Último índice de + ou − na fila (para saber onde começa a parte × ÷).
    function ultimoIndiceSoma() {
      for (var i = fila.length - 1; i >= 0; i--) {
        if (fila[i] === '+' || fila[i] === '-') return i;
      }
      return -1;
    }

    function operador(op) {
      if (erro) return;
      if (pendente || fila.length === 0) fila.push(valorAtual());
      else fila.pop(); // apertou dois operadores seguidos: troca o anterior

      editando = false;
      pendente = false;
      ultimoOp = null;

      var r;
      if (op === '+' || op === '-') {
        // Fecha toda a conta até aqui.
        r = avaliar(fila);
        fila = [r];
      } else {
        // × ou ÷: fecha só a sequência de × ÷ do final (precedência).
        var i = ultimoIndiceSoma();
        r = avaliar(fila.slice(i + 1));
        fila = fila.slice(0, i + 1).concat([r]);
      }
      definirResultado(r);
      if (erro) return;
      fila.push(op);
      opAtivo = op;
    }

    function igual() {
      if (erro) return;
      if (fila.length === 0) {
        if (ultimoOp !== null) {
          definirResultado(arredondar(aplicar(valorAtual(), ultimoOp, ultimoOperando)));
        } else {
          definirResultado(valorAtual());
        }
      } else {
        var operando = valorAtual();
        fila.push(operando);
        ultimoOp = fila[fila.length - 2];
        ultimoOperando = operando;
        var r = avaliar(fila);
        fila = [];
        definirResultado(r);
      }
      editando = false;
      pendente = false;
      opAtivo = null;
    }

    function porcentagem() {
      if (erro) return;
      var x = valorAtual();
      var n = fila.length;
      if (n >= 2 && (fila[n - 1] === '+' || fila[n - 1] === '-')) {
        x = avaliar(fila.slice(0, -1)) * x / 100;
      } else {
        x = x / 100;
      }
      editando = false;
      pendente = true;
      definirResultado(arredondar(x));
    }

    function trocarSinal() {
      if (erro) return;
      if (editando) {
        entrada = entrada.charAt(0) === '-' ? entrada.slice(1) : '-' + entrada;
      } else if ((!pendente && fila.length > 0) || valorAtual() === 0) {
        comecarEntrada('-0');
      } else {
        pendente = true;
        definirResultado(-valorAtual());
      }
    }

    // "C" apaga só o número atual; "AC" apaga tudo.
    function rotuloLimpar() {
      return (editando || pendente) && !erro ? 'C' : 'AC';
    }

    function limpar() {
      if (rotuloLimpar() === 'C') {
        entrada = '0';
        editando = false;
        pendente = false;
        resultado = 0;
        opAtivo = fila.length ? fila[fila.length - 1] : null;
      } else {
        zerar();
      }
    }

    function pressionar(t) {
      if (/^[0-9]$/.test(t)) digito(t);
      else if (t === ',' || t === '.') virgula();
      else if (t === '+' || t === '-' || t === '*' || t === '/') operador(t);
      else if (t === '=') igual();
      else if (t === '%') porcentagem();
      else if (t === '±') trocarSinal();
      else if (t === 'C') limpar();
    }

    return {
      pressionar: pressionar,
      visor: function () {
        if (erro) return 'Erro';
        return editando ? formatarEntrada(entrada) : formatarNumero(resultado);
      },
      // Número exatamente como foi digitado (ou null): usado para reconhecer o código secreto.
      entradaDigitada: function () { return editando ? entrada : null; },
      operadorAtivo: function () { return opAtivo; },
      rotuloLimpar: rotuloLimpar
    };
  }

  global.BotaoCalc = { criar: criar, formatarNumero: formatarNumero };
})(typeof window !== 'undefined' ? window : globalThis);
