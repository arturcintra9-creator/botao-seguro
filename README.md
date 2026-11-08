# Botão Seguro — protótipo navegável

Projeto do Ano 2026 · Senac — **Artur, João Victor, Pedro e Renato**.

Um app disfarçado de calculadora: ao digitar um código secreto (padrão `1 9 0 =`), ele avisa em
silêncio os contatos de confiança, com a localização. **Isto é um protótipo acadêmico:** nada é
enviado de verdade (não há servidor, SMS nem GPS) e ele não substitui os canais oficiais —
em emergência, ligue **180** ou **190**.

Site 100% estático (HTML + CSS + JS puro), **sem internet e sem dependências externas**.

## Telas

| Arquivo | O que é |
|---|---|
| `index.html` | Entrada: o que é o projeto e como testar |
| `calculadora.html` | O disfarce. Calculadora funcional; `1 9 0 =` dispara o alerta sem mudar a tela. **Toque longo de 2 s no visor** abre as configurações |
| `configuracoes.html` | Nome, código secreto e até 3 contatos (salvos no `localStorage`) |
| `painel.html` | Tela do contato de confiança: alerta, horário, mapa em SVG, endereço |
| `estande.html` | Modo estande: calculadora + painel lado a lado e linha do tempo |
| `como-funciona.html` | Passos, diferencial, dados da pesquisa e limites |

## Como abrir no celular

1. No notebook, dentro da pasta do projeto, rode:
   ```bash
   python3 -m http.server 8000
   ```
2. Conecte o celular **na mesma rede Wi-Fi** e abra `http://IP-DO-NOTEBOOK:8000`
   (descubra o IP com `ipconfig` no Windows ou `ip addr` no Linux/Mac).
3. Para o disfarce ficar perfeito: abra `calculadora.html` e use **"Adicionar à tela de início"**.
   O ícone aparece como "Calculadora".

Para testar o alerta só no celular: dispare o código na calculadora e depois abra `painel.html`
em outra aba.

**Melhor ainda:** publique no GitHub Pages (Settings → Pages → branch). Depois do primeiro acesso,
o `sw.js` guarda tudo no aparelho e o site funciona **sem internet**.

## Como rodar o modo estande (notebook)

1. Rode `python3 -m http.server 8000` na pasta e abra `http://localhost:8000/estande.html`
   (ou dê dois cliques em `estande.html` — no Chrome/Edge funciona até sem servidor).
2. Clique em **Tela cheia** (pensado para 1366×768 ou maior).
3. O visitante digita `1 9 0 =` na calculadora (mouse, toque ou teclado) e vê o alerta chegar
   do outro lado. A linha do tempo acende as 4 etapas.
4. **Reiniciar demonstração** (ou tecla `R`) zera tudo para o próximo visitante.

> **Atenção — celular + notebook não sincronizam.** O `localStorage` fica dentro de cada
> navegador, então o evento `storage` só sincroniza abas/janelas **do mesmo navegador no mesmo
> aparelho**. Para o celular avisar o notebook seria preciso um servidor, o que quebraria a regra
> "nada é enviado". No estande, use a calculadora dentro da moldura (ou abra `calculadora.html`
> numa segunda janela do mesmo notebook — o estande também atualiza).

## Testes

```bash
node testes/teste-calculadora.js
```

Confere 40 contas (precedência, porcentagem, `=` repetido, divisão por zero, arredondamento…).

## Estrutura

```
css/site.css            identidade visual (todas as telas menos a calculadora)
css/calculadora.css     visual genérico da calculadora
js/estado.js            localStorage + sincronização entre telas
js/calculadora-motor.js matemática da calculadora (testável)
js/calculadora.js       tela da calculadora, código secreto e gesto secreto
js/configuracoes.js     formulário de configurações
js/painel.js            painel do contato + mapa SVG
js/estande.js           modo estande e linha do tempo
js/efeitos.js           animações e scroll trigger (início e como funciona)
css/efeitos.css         estilos das animações
sw.js                   cache para funcionar offline
```

## Segurança e desempenho

- `vercel.json` define uma política de segurança (CSP) com `connect-src 'self'`: o próprio
  navegador **proíbe** o site de enviar dados para qualquer outro endereço. Também bloqueia
  câmera, microfone e GPS, e não envia o endereço da página para outros sites (`no-referrer`).
- Lighthouse (celular): 100 em desempenho, acessibilidade e boas práticas em todas as páginas.
  A página de configurações tem `noindex` de propósito (não deve aparecer no Google).
- As animações respeitam a opção "reduzir movimento" do sistema e pausam fora da tela.
