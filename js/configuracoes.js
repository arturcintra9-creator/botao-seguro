/*
 * configuracoes.js — cadastro do nome, do código secreto e de até 3 contatos.
 * Salva no localStorage (via estado.js).
 */
(function () {
  'use strict';

  var MAX_CONTATOS = 3;
  var form = document.getElementById('form');
  var campoNome = document.getElementById('nome');
  var campoCodigo = document.getElementById('codigo');
  var listaContatos = document.getElementById('contatos');
  var mensagem = document.getElementById('mensagem');

  /* ---------- montar os campos dos contatos ---------- */

  function htmlContato(i) {
    return (
      '<div class="contato">' +
        '<div class="contato-titulo">Contato ' + (i + 1) + (i === 0 ? '' : ' (opcional)') + '</div>' +
        '<div class="contato-campos">' +
          '<div class="campo">' +
            '<label for="contato-nome-' + i + '">Nome</label>' +
            '<input id="contato-nome-' + i + '" type="text" maxlength="40" autocomplete="off" placeholder="Ex.: Juliana (irmã)">' +
          '</div>' +
          '<div class="campo">' +
            '<label for="contato-tel-' + i + '">Telefone</label>' +
            '<input id="contato-tel-' + i + '" type="tel" inputmode="tel" maxlength="16" autocomplete="off" placeholder="(11) 90000-0000">' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var html = '';
  for (var i = 0; i < MAX_CONTATOS; i++) html += htmlContato(i);
  listaContatos.innerHTML = html;

  function campo(tipo, i) {
    return document.getElementById('contato-' + tipo + '-' + i);
  }

  /* ---------- máscara de telefone: (11) 91234-5678 ---------- */

  function formatarTelefone(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  listaContatos.addEventListener('input', function (e) {
    if (e.target.type === 'tel') e.target.value = formatarTelefone(e.target.value);
  });

  // O código aceita só números.
  campoCodigo.addEventListener('input', function () {
    campoCodigo.value = campoCodigo.value.replace(/\D/g, '');
  });

  /* ---------- preencher com o que já está salvo ---------- */

  function preencher() {
    var cfg = BS.config();
    campoNome.value = cfg.nome;
    campoCodigo.value = cfg.codigo;
    for (var i = 0; i < MAX_CONTATOS; i++) {
      var c = cfg.contatos[i] || { nome: '', telefone: '' };
      campo('nome', i).value = c.nome;
      campo('tel', i).value = c.telefone;
    }
    limparErros();
  }

  /* ---------- validar e salvar ---------- */

  function limparErros() {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
  }

  function mostrar(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = 'mensagem ' + tipo;
  }

  function erro(el, texto) {
    el.setAttribute('aria-invalid', 'true');
    el.focus();
    mostrar(texto, 'erro');
    return false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limparErros();

    var nome = campoNome.value.trim();
    var codigo = campoCodigo.value.trim();
    if (!nome) return erro(campoNome, 'Escreva seu nome.');
    if (!/^[1-9][0-9]{2,7}$/.test(codigo)) {
      return erro(campoCodigo, 'O código precisa ter de 3 a 8 números e não pode começar com 0.');
    }

    var contatos = [];
    for (var i = 0; i < MAX_CONTATOS; i++) {
      var n = campo('nome', i);
      var t = campo('tel', i);
      var nomeC = n.value.trim();
      var telC = t.value.trim();
      if (!nomeC && !telC) continue;                    // linha vazia: ignora
      if (!nomeC) return erro(n, 'Falta o nome do contato ' + (i + 1) + '.');
      if (telC.replace(/\D/g, '').length < 10) {
        return erro(t, 'O telefone do contato ' + (i + 1) + ' precisa ter DDD + número.');
      }
      contatos.push({ nome: nomeC, telefone: telC });
    }
    if (!contatos.length) return erro(campo('nome', 0), 'Cadastre pelo menos 1 contato de confiança.');

    BS.salvarConfig({ nome: nome, codigo: codigo, contatos: contatos });
    preencher();
    mostrar('Configurações salvas neste aparelho.', 'ok');
  });

  /* ---------- voltar / restaurar ---------- */

  // replace(): o "voltar" do celular não reabre as configurações.
  document.getElementById('voltar').addEventListener('click', function () {
    location.replace('calculadora.html');
  });

  document.getElementById('restaurar').addEventListener('click', function () {
    BS.restaurarPadrao();
    preencher();
    mostrar('Configurações de exemplo restauradas (código 190).', 'ok');
  });

  preencher();
})();
