/*
 * efeitos.js — animações e "scroll trigger" das páginas informativas.
 * Feito à mão, sem bibliotecas: IntersectionObserver + requestAnimationFrame.
 *
 * Atributos que este arquivo entende no HTML:
 *   data-palavras         título que entra palavra por palavra
 *   data-revelar="tipo"   surge ao rolar (subir, esquerda, direita, escala)
 *   data-revelar-grupo    os filhos surgem um depois do outro
 *   data-contar="57"      número que conta de 0 até o valor
 *   data-parallax="0.12"  move mais devagar que a rolagem
 *   data-preencher        frase que "acende" palavra por palavra com a rolagem
 *   data-historia         seção com celular fixo que muda a cada passo
 *   data-hero-demo        ilustração do início que digita 1 9 0 = sozinha
 *
 * Quem pede "reduzir movimento" no sistema vê tudo pronto e parado.
 */
(function () {
  'use strict';

  var reduzido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;

  function $$(seletor, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(seletor));
  }

  // Chama "cb" uma única vez, quando o elemento aparece na tela.
  function quandoVisivel(elementos, cb, opcoes) {
    if (!temIO || reduzido) { elementos.forEach(cb); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); }
      });
    }, opcoes || { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    elementos.forEach(function (el) { io.observe(el); });
  }

  // Quebra o texto em <span class="palavra">, mantendo as tags de dentro (ex.: destaques).
  function dividirPalavras(el) {
    var i = 0;
    (function andar(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          var pedaco = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { pedaco.appendChild(document.createTextNode(parte)); return; }
            var s = document.createElement('span');
            s.className = 'palavra';
            s.style.setProperty('--i', i++);
            s.textContent = parte;
            pedaco.appendChild(s);
          });
          no.replaceChild(pedaco, filho);
        } else if (filho.nodeType === 1) {
          andar(filho);
        }
      });
    })(el);
  }

  /* ---------- 1. Títulos palavra por palavra ---------- */
  $$('[data-palavras]').forEach(function (el) {
    dividirPalavras(el);
    quandoVisivel([el], function () { el.classList.add('animar'); });
  });

  /* ---------- 2. Surgir ao rolar ---------- */
  $$('[data-revelar-grupo]').forEach(function (grupo) {
    Array.prototype.forEach.call(grupo.children, function (filho, i) {
      if (!filho.hasAttribute('data-revelar')) {
        filho.setAttribute('data-revelar', grupo.getAttribute('data-revelar-grupo') || 'subir');
      }
      filho.style.setProperty('--atraso', (i * 110) + 'ms');
    });
  });
  quandoVisivel($$('[data-revelar]'), function (el) { el.classList.add('visivel'); });

  /* ---------- 3. Contadores ---------- */
  var contadores = $$('[data-contar]');
  if (!reduzido) contadores.forEach(function (el) { el.textContent = '0'; });
  quandoVisivel(contadores, function (el) {
    var alvo = Number(el.dataset.contar);
    if (reduzido) { el.textContent = alvo; return; }
    var inicio = null;
    var duracao = 1700;
    function passo(t) {
      if (inicio === null) inicio = t;
      var p = Math.min(1, (t - inicio) / duracao);
      var suave = 1 - Math.pow(1 - p, 3); // desacelera no final
      el.textContent = Math.round(alvo * suave);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }, { threshold: 0.6 });

  /* ---------- 4. Efeitos ligados à rolagem ---------- */
  var barra = document.createElement('div');
  barra.className = 'progresso-rolagem';
  barra.setAttribute('aria-hidden', 'true');
  document.body.appendChild(barra);

  var topo = document.querySelector('.topo-barra');
  var parallax = reduzido ? [] : $$('[data-parallax]');
  var frases = $$('[data-preencher]').map(function (el) {
    dividirPalavras(el);
    var palavras = $$('.palavra', el);
    if (reduzido) palavras.forEach(function (p) { p.classList.add('acesa'); });
    return { el: el, palavras: palavras, acesas: -1 };
  });

  var agendado = false;
  function aoRolar() {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizarRolagem); }
  }

  function atualizarRolagem() {
    agendado = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var total = document.documentElement.scrollHeight - vh;

    barra.style.transform = 'scaleX(' + (total > 0 ? Math.min(1, y / total) : 0) + ')';
    if (topo) topo.classList.toggle('rolou', y > 8);

    // Parallax: mede o "pai" (que não se move) para não criar efeito em cadeia.
    parallax.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      var distancia = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (-distancia * Number(el.dataset.parallax)).toFixed(1) + 'px,0)';
    });

    // Frase que acende: quanto mais a frase sobe na tela, mais palavras acendem.
    if (!reduzido) frases.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var progresso = (vh * 0.85 - r.top) / (r.height + vh * 0.3);
      progresso = Math.max(0, Math.min(1, progresso));
      var n = Math.round(progresso * f.palavras.length);
      if (n !== f.acesas) {
        f.acesas = n;
        f.palavras.forEach(function (p, i) { p.classList.toggle('acesa', i < n); });
      }
    });
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  atualizarRolagem();

  /* ---------- 5. Holofote nos cartões (só com mouse) ---------- */
  if (window.matchMedia && matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var cartao = e.target.closest && e.target.closest('.cartao');
      if (!cartao) return;
      var r = cartao.getBoundingClientRect();
      cartao.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      cartao.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- 6. História com celular fixo (scroll trigger) ---------- */
  var historia = document.querySelector('[data-historia]');
  if (historia) {
    var visor = historia.querySelector('[data-mock-visor]');
    var passos = $$('.historia-passo', historia);
    var teclas = {};
    $$('[data-k]', historia).forEach(function (t) { teclas[t.dataset.k] = t; });
    var ficha = 0; // muda a cada passo; cancela uma digitação antiga

    var ativar = function (n) {
      if (historia.dataset.ativo === n) return;
      historia.dataset.ativo = n;
      var minha = ++ficha;
      passos.forEach(function (p) { p.classList.toggle('ativo', p.dataset.passo === n); });

      if (n === '1') visor.textContent = '1.250';
      else if (n === '3') visor.textContent = '190';
      else if (reduzido) visor.textContent = '190';
      else {
        // Passo 2: o celular digita 1 9 0 = sozinho.
        visor.textContent = '0';
        var texto = '';
        ['1', '9', '0', '='].forEach(function (k, i) {
          setTimeout(function () {
            if (minha !== ficha) return;
            var t = teclas[k];
            t.classList.add('aperta');
            setTimeout(function () { t.classList.remove('aperta'); }, 260);
            if (k !== '=') { texto += k; visor.textContent = texto; }
          }, 450 + i * 420);
        });
      }
    };

    if (temIO) {
      // Um passo fica "ativo" quando passa pelo meio da tela.
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) ativar(e.target.dataset.passo); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      passos.forEach(function (p) { io.observe(p); });
    }
    ativar('1');
  }

  /* ---------- 7. Ilustração do início em loop ---------- */
  var demo = document.querySelector('[data-hero-demo]');
  if (demo) {
    var hv = demo.querySelector('[data-hero-visor]');
    if (reduzido) {
      hv.textContent = '190';
      demo.classList.add('enviando', 'enviado');
    } else {
      var hk = {};
      $$('[data-hk]', demo).forEach(function (t) { hk[t.dataset.hk] = t; });
      var tempos = [];
      var rodando = false;

      var agendar = function (fn, ms) { tempos.push(setTimeout(fn, ms)); };
      var apertar = function (k, texto) {
        hk[k].classList.add('aperta');
        setTimeout(function () { hk[k].classList.remove('aperta'); }, 240);
        if (texto !== null) hv.textContent = texto;
      };
      var ciclo = function () {
        tempos = [];
        demo.classList.remove('enviando', 'enviado');
        hv.textContent = '0';
        agendar(function () { apertar('1', '1'); }, 700);
        agendar(function () { apertar('9', '19'); }, 1150);
        agendar(function () { apertar('0', '190'); }, 1600);
        agendar(function () { apertar('=', null); demo.classList.add('enviando'); }, 2150);
        agendar(function () { demo.classList.add('enviado'); }, 2900);
        agendar(ciclo, 7000);
      };

      // Só anima enquanto a ilustração está na tela (economiza bateria).
      var observar = function (visivel) {
        if (visivel && !rodando) { rodando = true; ciclo(); }
        else if (!visivel && rodando) { rodando = false; tempos.forEach(clearTimeout); }
      };
      if (temIO) {
        new IntersectionObserver(function (e) { observar(e[0].isIntersecting); }).observe(demo);
      } else {
        observar(true);
      }
    }
  }
})();
