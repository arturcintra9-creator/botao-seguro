/*
 * Testes do motor da calculadora. Rode com:  node testes/teste-calculadora.js
 * Cada caso é uma sequência de teclas e o que o visor deve mostrar no final.
 */
require('../js/calculadora-motor.js');
const { criar } = globalThis.BotaoCalc;

const casos = [
  // [teclas separadas por espaço, visor esperado]
  ['1 9 0 =', '190'],
  ['2 + 3 =', '5'],
  ['2 + 3 * 4 =', '14'],            // precedência
  ['2 * 3 + 4 =', '10'],
  ['1 0 - 4 / 2 =', '8'],
  ['2 + 3 *', '3'],                 // mostra só o trecho × ÷ pendente
  ['2 + 3 * 4 +', '14'],
  ['2 + 3 = =', '8'],               // "=" repetido
  ['2 * 3 = =', '18'],
  ['0 , 1 + 0 , 2 =', '0,3'],       // sem ruído de ponto flutuante
  ['1 / 3 =', '0,33333333'],
  ['2 / 3 =', '0,66666667'],
  ['1 / 3 * 3 =', '1'],
  ['1 0 / 4 =', '2,5'],
  ['5 / 0 =', 'Erro'],
  ['5 / 0 = 7', '7'],               // digitar depois do erro recomeça
  ['5 0 %', '0,5'],
  ['2 0 0 + 1 0 % =', '220'],       // porcentagem de
  ['2 0 0 - 1 0 % =', '180'],
  ['5 0 * 1 0 % =', '5'],
  ['5 ±', '-5'],
  ['5 ± ±', '5'],
  ['3 - ± 2 =', '5'],               // 3 − (−2)
  ['± 4', '-4'],
  ['1 2 3 4 5 6 7', '1.234.567'],
  ['1 2 3 4 5 6 7 8 9 0', '123.456.789'], // limite de 9 dígitos
  ['9 9 9 9 9 9 9 9 9 * 1 0 =', '1e10'],          // arredonda como o celular
  ['1 2 3 4 5 6 7 8 9 * 1 0 0 0 =', '1,23457e11'],
  ['1 , 5 0', '1,50'],
  ['1 , ,', '1,'],                  // só uma vírgula
  ['7 + C', '0'],
  ['7 + 8 C 2 =', '9'],             // C apaga só o número atual
  ['7 + 8 C C', '0'],               // AC apaga tudo
  ['5 + - 2 =', '3'],               // troca de operador
  ['2 + 3 = 7 =', '7'],             // número novo após "=" não repete a conta
  ['2 + 3 = + 1 =', '6'],           // continua a partir do resultado
  ['1 0 0 0 * 1 0 0 0 =', '1.000.000'],
  ['0 , 0 0 0 0 0 1 / 1 0 =', '0,0000001'],
  ['1 / 3 0 0 0 0 0 0 0 0 =', '3,33333e-9'],
];

const rotulo = { '*': '×', '/': '÷', '-': '−' };
let falhas = 0;
for (const [teclas, esperado] of casos) {
  const c = criar();
  teclas.split(' ').forEach((t) => c.pressionar(t));
  const obtido = c.visor();
  const ok = obtido === esperado;
  if (!ok) falhas++;
  const legivel = teclas.split(' ').map((t) => rotulo[t] || t).join(' ');
  console.log(`${ok ? '✓' : '✗'} ${legivel.padEnd(28)} -> ${obtido}${ok ? '' : `  (esperado ${esperado})`}`);
}

// Rótulo AC/C
const c = criar();
const r1 = c.rotuloLimpar();
c.pressionar('5');
const r2 = c.rotuloLimpar();
if (r1 !== 'AC' || r2 !== 'C') { falhas++; console.log('✗ rótulo AC/C'); } else console.log('✓ rótulo AC -> C');

console.log(falhas ? `\n${falhas} falha(s).` : `\nTodos os ${casos.length + 1} testes passaram.`);
process.exit(falhas ? 1 : 0);
