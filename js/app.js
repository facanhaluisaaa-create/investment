/* =========================================================
   Investir Fácil: lógica da plataforma
   Sem dependências. Tudo roda no navegador; dados ficam no localStorage.
   ========================================================= */

(function () {
  "use strict";

  // ---------- Utilidades ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Cria elemento com atributos e filhos. Texto sempre via textContent (seguro).
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v; // só para conteúdo nosso, nunca do usuário
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const brlCents = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmt = (v) => brl.format(Math.round(v));
  const fmtCents = (v) => brlCents.format(v);
  const pct = (v) => `${Math.round(v)}%`;

  // Formato compacto para eixos: 1,2 mil / 350 mil / 2,4 mi
  function compact(v) {
    const abs = Math.abs(v);
    if (abs >= 1e6) return `${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
    if (abs >= 1e3) return `${(v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
    return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* navegador sem armazenamento: segue sem salvar */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignora */
      }
    },
  };

  const catById = (id) => TODAS_CATEGORIAS.find((c) => c.id === id);

  // ---------- Tema ----------
  function initTheme() {
    const saved = storage.get("if_theme", null);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = current ? current === "dark" : systemDark;
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      storage.set("if_theme", next);
      // Redesenha o gráfico com as cores do novo tema (as cores vêm de CSS vars, mas por segurança)
      renderSimulador();
    });
  }

  // ---------- Navegação ----------
  const PAGES = ["inicio", "perfil", "simulador", "carteira", "dicionario"];

  function goTo(page, push = true) {
    if (!PAGES.includes(page)) page = "inicio";
    $$("section[data-page]").forEach((s) => s.classList.toggle("active", s.dataset.page === page));
    $$(".nav button").forEach((b) => {
      if (b.dataset.nav === page) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (push && location.hash !== `#${page}`) history.pushState(null, "", `#${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "inicio") renderHomeStatus();
    if (page === "carteira") renderCarteira();
    if (page === "simulador") renderSimulador();
  }

  function initNav() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-nav]");
      if (btn) {
        e.preventDefault();
        goTo(btn.dataset.nav);
      }
    });
    window.addEventListener("popstate", () => goTo(location.hash.slice(1) || "inicio", false));
    goTo(location.hash.slice(1) || "inicio", false);
  }

  // ---------- Início ----------
  function renderDicas() {
    const box = $("#dicas");
    box.replaceChildren(
      ...DICAS.map((d) =>
        el("div", {},
          el("div", { class: "tip-icon", text: d.icone, "aria-hidden": "true" }),
          el("strong", { text: d.titulo }),
          el("p", { class: "muted", text: d.texto, style: { margin: "2px 0 0" } })
        )
      )
    );
  }

  function renderHomeStatus() {
    const box = $("#home-status");
    const perfil = storage.get("if_perfil", null);
    const holdings = storage.get("if_holdings", []);
    box.replaceChildren();
    if (perfil && PERFIS[perfil.id]) {
      const p = PERFIS[perfil.id];
      box.append(
        el("div", { class: "alert alert-good", style: { marginTop: "14px" } },
          el("span", { class: "icon", text: p.emoji }),
          el("p", {}, "Seu perfil: ", el("strong", { text: p.nome }), `. ${holdings.length ? `Você já anotou ${holdings.length} investimento${holdings.length > 1 ? "s" : ""}.` : "Próximo passo: anotar o que você já tem na Minha carteira."}`)
        )
      );
    }
  }

  // ---------- Perfil (quiz) ----------
  const quiz = { idx: 0, answers: [] };

  function renderQuiz() {
    const q = PERGUNTAS[quiz.idx];
    $("#quiz-bar").style.width = `${(quiz.idx / PERGUNTAS.length) * 100}%`;
    $("#quiz-counter").textContent = `Pergunta ${quiz.idx + 1} de ${PERGUNTAS.length}`;
    $("#quiz-question").textContent = q.texto;
    const chosen = quiz.answers[quiz.idx];
    $("#quiz-options").replaceChildren(
      ...q.opcoes.map((o, i) =>
        el("button", {
          class: "option", type: "button", "aria-pressed": chosen === i ? "true" : "false",
          text: o.texto,
          onclick: () => { quiz.answers[quiz.idx] = i; renderQuiz(); },
        })
      )
    );
    $("#quiz-back").disabled = quiz.idx === 0;
    $("#quiz-next").disabled = chosen === undefined;
    $("#quiz-next").textContent = quiz.idx === PERGUNTAS.length - 1 ? "Ver meu perfil" : "Próxima";
  }

  function calcularPerfil(answers) {
    let pontos = 0;
    let semReserva = false;
    answers.forEach((ai, qi) => {
      const op = PERGUNTAS[qi].opcoes[ai];
      pontos += op.pontos;
      if (op.semReserva) semReserva = true;
    });
    // Máximo = 10 pontos. Prazo curto puxa para conservador independentemente do resto.
    const prazoCurto = PERGUNTAS[1].opcoes[answers[1]].pontos === 0;
    let id = pontos <= 3 ? "conservador" : pontos <= 7 ? "moderado" : "arrojado";
    if (prazoCurto && id !== "conservador") id = "conservador";
    return { id, semReserva, pontos };
  }

  function allocBar(carteira, container) {
    container.replaceChildren();
    const total = Object.values(carteira).reduce((a, b) => a + b, 0) || 1;
    for (const [id, valor] of Object.entries(carteira)) {
      if (valor <= 0) continue;
      const cat = catById(id);
      const share = (valor / total) * 100;
      container.append(el("div", { "data-cor": cat.cor, style: { flex: `${share} 1 0` }, title: `${cat.nome}: ${pct(share)}` }));
    }
  }

  function legendFor(carteira, container, { showValues = false } = {}) {
    const total = Object.values(carteira).reduce((a, b) => a + b, 0) || 1;
    container.replaceChildren(
      ...Object.entries(carteira)
        .filter(([, v]) => v > 0)
        .map(([id, v]) => {
          const cat = catById(id);
          return el("span", { class: "legend-item" },
            el("span", { class: "swatch", "data-cor": cat.cor }),
            `${cat.curto} `,
            el("b", { text: showValues ? `${pct((v / total) * 100)} · ${fmt(v)}` : pct(v) })
          );
        })
    );
  }

  function renderResultado(res) {
    const p = PERFIS[res.id];
    const box = $("#perfil-resultado");
    $("#quiz").classList.add("hidden");
    box.classList.remove("hidden");

    const alloc = el("div", { class: "alloc", role: "img", "aria-label": "Divisão sugerida" });
    allocBar(p.carteira, alloc);
    const legend = el("div", { class: "legend" });
    legendFor(p.carteira, legend);

    const table = el("table", { class: "alloc-table" },
      el("thead", {}, el("tr", {}, el("th", { text: "Caixinha" }), el("th", { text: "O que é" }), el("th", { class: "num", text: "Fatia" }))),
      el("tbody", {}, ...CATEGORIAS.map((c) =>
        el("tr", {},
          el("td", {}, el("span", { class: "legend-item" }, el("span", { class: "swatch", "data-cor": c.cor }), el("b", { text: c.nome }))),
          el("td", { class: "muted small", text: c.explicacao }),
          el("td", { class: "num", text: pct(p.carteira[c.id]) })
        )
      ))
    );

    box.replaceChildren(
      el("div", { class: "card" },
        el("span", { class: "profile-badge" }, el("span", { text: p.emoji, "aria-hidden": "true" }), `Perfil ${p.nome}`),
        el("h2", { text: p.resumo, style: { marginTop: "14px" } }),
        el("p", { class: "lead", text: p.descricao }),
        res.semReserva
          ? el("div", { class: "alert alert-warn" },
              el("span", { class: "icon", text: "⚠️" }),
              el("p", {}, el("strong", { text: "Antes de tudo: a reserva de emergência. " }), "Você disse que ainda não tem. Esse é o primeiro passo, seja qual for o perfil. Guarde de 3 a 6 meses dos seus gastos em algo seguro e de saque imediato antes de pensar no resto."))
          : null
      ),
      el("div", { class: "card" },
        el("h3", { text: "Como dividir o seu dinheiro" }),
        el("p", { class: "muted", text: "Uma sugestão de partida para o seu perfil. Não precisa ser exato: o importante é a proporção." }),
        alloc, legend, table
      ),
      el("div", { class: "card" },
        el("h3", { text: "Seus próximos passos" }),
        el("div", { class: "steps" }, ...p.passos.map((t, i) =>
          el("div", { class: "step", style: { cursor: "default" } }, el("span", { class: "step-num", text: String(i + 1) }), el("div", {}, el("span", { text: t })))
        )),
        el("div", { class: "btn-row", style: { marginTop: "16px" } },
          el("button", { class: "btn", "data-nav": "simulador", text: "Simular com esse perfil" }),
          el("button", { class: "btn btn-secondary", "data-nav": "carteira", text: "Anotar o que já tenho" }),
          el("button", { class: "btn btn-ghost", text: "Refazer o teste", onclick: resetQuiz })
        )
      )
    );
  }

  function resetQuiz() {
    quiz.idx = 0;
    quiz.answers = [];
    storage.remove("if_perfil");
    $("#perfil-resultado").classList.add("hidden");
    $("#quiz").classList.remove("hidden");
    renderQuiz();
    renderHomeStatus();
  }

  function initQuiz() {
    $("#quiz-back").addEventListener("click", () => { if (quiz.idx > 0) { quiz.idx--; renderQuiz(); } });
    $("#quiz-next").addEventListener("click", () => {
      if (quiz.answers[quiz.idx] === undefined) return;
      if (quiz.idx < PERGUNTAS.length - 1) { quiz.idx++; renderQuiz(); return; }
      const res = calcularPerfil(quiz.answers);
      res.answers = quiz.answers;
      storage.set("if_perfil", res);
      renderResultado(res);
      // Ajusta a taxa padrão do simulador para o perfil
      $("#sim-taxa").value = res.id === "conservador" ? "selic" : res.id;
      syncTaxaFromSelect();
      renderCarteira();
    });
    const saved = storage.get("if_perfil", null);
    if (saved && PERFIS[saved.id]) {
      quiz.answers = saved.answers || [];
      renderResultado(saved);
    } else {
      renderQuiz();
    }
  }

  // ---------- Simulador ----------
  function projetar(inicial, mensal, anos, taxaAnual) {
    // Retorna um ponto por ano: { ano, total, aportado }
    const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
    const pontos = [{ ano: 0, total: inicial, aportado: inicial }];
    let saldo = inicial;
    let aportado = inicial;
    for (let m = 1; m <= anos * 12; m++) {
      saldo = saldo * (1 + i) + mensal;
      aportado += mensal;
      if (m % 12 === 0) pontos.push({ ano: m / 12, total: saldo, aportado });
    }
    return pontos;
  }

  function lerSimulador() {
    const inicial = Math.max(0, Number($("#sim-inicial").value) || 0);
    const mensal = Math.max(0, Number($("#sim-mensal").value) || 0);
    const anos = Number($("#sim-anos").value) || 1;
    const taxa = Number($("#sim-taxa-custom").value) || 0;
    const escolhaId = $("#sim-taxa").value;
    const escolha = TAXAS_REFERENCIA.find((t) => t.id === escolhaId);
    return { inicial, mensal, anos, taxa, escolha };
  }

  function syncTaxaFromSelect() {
    const t = TAXAS_REFERENCIA.find((x) => x.id === $("#sim-taxa").value);
    if (t) $("#sim-taxa-custom").value = t.taxa;
    renderSimulador();
  }

  function renderSimulador() {
    if (!$("#sim-taxa").options.length) return;
    const { inicial, mensal, anos, taxa, escolha } = lerSimulador();
    $("#sim-anos-valor").textContent = `${anos} ano${anos > 1 ? "s" : ""}`;
    $("#sim-taxa-valor").textContent = `${taxa.toLocaleString("pt-BR")}% ao ano`;

    const nomeEscolha = escolha && escolha.taxa === taxa ? escolha.nome : `Sua escolha (${taxa.toLocaleString("pt-BR")}% ao ano)`;
    const poup = TAXAS_REFERENCIA.find((t) => t.id === "poupanca");

    // Séries: cores em ordem fixa (1 = azul, 2 = laranja, 3 = verde-água), nunca recicladas.
    const series = [{ id: "escolha", nome: nomeEscolha, cor: 1, pontos: projetar(inicial, mensal, anos, taxa) }];
    if (taxa !== poup.taxa) series.push({ id: "poupanca", nome: "Na poupança", cor: 2, pontos: projetar(inicial, mensal, anos, poup.taxa) });
    if (taxa !== 0) series.push({ id: "parado", nome: "Dinheiro parado", cor: 3, pontos: projetar(inicial, mensal, anos, 0) });

    const fim = series[0].pontos[series[0].pontos.length - 1];
    const juros = fim.total - fim.aportado;
    $("#sim-total").textContent = fmt(fim.total);
    const frase = $("#sim-frase");
    frase.replaceChildren();
    if (fim.aportado === 0) {
      frase.textContent = "Coloque algum valor inicial ou mensal para ver a simulação.";
    } else if (juros <= 0) {
      frase.textContent = `Você colocou ${fmt(fim.aportado)} e, sem render, ele continua sendo ${fmt(fim.aportado)}. A inflação vai comendo um pedaço todo ano.`;
    } else {
      frase.append("Você colocou ", el("strong", { text: fmt(fim.aportado) }), " do seu bolso. Os juros trabalharam e colocaram ", el("strong", { class: "delta-good", text: fmt(juros) }), " a mais.");
    }

    const stats = [
      { label: "Saiu do seu bolso", value: fmt(fim.aportado) },
      { label: "Veio dos juros", value: fmt(Math.max(0, juros)) },
      { label: "Parte do total que é juros", value: fim.total > 0 ? pct((Math.max(0, juros) / fim.total) * 100) : "0%" },
    ];
    $("#sim-stats").replaceChildren(...stats.map((s) => el("div", { class: "stat" }, el("div", { class: "label", text: s.label }), el("div", { class: "value", text: s.value }))));

    // Legenda (2+ séries sempre têm legenda)
    $("#sim-legend").replaceChildren(
      ...series.map((s) => el("span", { class: "legend-item" }, el("span", { class: "swatch line", "data-cor": s.cor }), el("b", { text: s.nome })))
    );

    drawLineChart($("#sim-chart"), series);
    renderSimTable(series);
    renderLicoes({ inicial, mensal, anos, taxa, fim, juros, series });
  }

  function renderSimTable(series) {
    const box = $("#sim-table");
    const anos = series[0].pontos.map((p) => p.ano);
    box.replaceChildren(
      el("table", { class: "chart-table" },
        el("thead", {}, el("tr", {}, el("th", { text: "Ano" }), ...series.map((s) => el("th", { text: s.nome })))),
        el("tbody", {}, ...anos.map((a, i) =>
          el("tr", {}, el("td", { text: String(a) }), ...series.map((s) => el("td", { text: fmt(s.pontos[i].total) })))
        ))
      )
    );
  }

  function renderLicoes({ inicial, mensal, anos, taxa, fim, juros, series }) {
    const box = $("#sim-licoes");
    const itens = [];
    const poupS = series.find((s) => s.id === "poupanca");
    if (poupS && taxa > TAXAS_REFERENCIA[1].taxa) {
      const dif = fim.total - poupS.pontos[poupS.pontos.length - 1].total;
      itens.push(["💡", `A diferença para a poupança é de ${fmt(dif)} no final. Mesmo dinheiro, mesmo esforço, só mudando o lugar onde ele fica.`]);
    }
    if (anos > 5 && (inicial > 0 || mensal > 0)) {
      const tarde = projetar(inicial, mensal, anos - 5, taxa);
      const custo = fim.total - tarde[tarde.length - 1].total;
      itens.push(["⏳", `Se você esperasse 5 anos para começar, chegaria ao fim com ${fmt(custo)} a menos. Começar cedo pesa mais que acertar o investimento perfeito.`]);
    }
    if (mensal > 0 && anos >= 2) {
      const mais = projetar(inicial, mensal + 100, anos, taxa);
      const ganho = mais[mais.length - 1].total - fim.total;
      itens.push(["➕", `Guardar só R$ 100 a mais por mês viraria ${fmt(ganho)} a mais no final.`]);
    }
    if (juros > fim.aportado && fim.aportado > 0) {
      itens.push(["🎉", "Nesse prazo os juros rendem mais do que tudo que você colocou. É a bola de neve funcionando a seu favor."]);
    }
    if (!itens.length) itens.push(["👉", "Aumente o prazo ou o valor mensal para ver o efeito dos juros compostos aparecer."]);
    box.replaceChildren(...itens.map(([ic, t]) => el("div", { class: "alert alert-info" }, el("span", { class: "icon", text: ic }), el("p", { text: t }))));
  }

  // Gráfico de linhas em SVG com crosshair, tooltip e rótulos no fim.
  function drawLineChart(container, series) {
    container.replaceChildren();
    // Largura real do contêiner: o texto do gráfico não encolhe no celular.
    const W = Math.max(320, Math.round(container.clientWidth || 640));
    const H = Math.round(Math.min(360, Math.max(240, W * 0.5)));
    const m = { top: 16, right: W < 480 ? 80 : 110, bottom: 36, left: 52 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const n = series[0].pontos.length;
    const maxY = Math.max(1, ...series.flatMap((s) => s.pontos.map((p) => p.total)));
    // Ticks "redondos"
    const rawStep = maxY / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= rawStep);
    const yMax = Math.ceil(maxY / step) * step;
    const x = (i) => m.left + (i / Math.max(1, n - 1)) * iw;
    const y = (v) => m.top + ih - (v / yMax) * ih;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Evolução do dinheiro ao longo dos anos. Veja a tabela para os valores exatos.");
    const S = (tag, attrs) => {
      const e = document.createElementNS(svgNS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      return e;
    };

    // Grade e eixo Y
    for (let v = 0; v <= yMax; v += step) {
      svg.append(S("line", { x1: m.left, x2: W - m.right, y1: y(v), y2: y(v), class: v === 0 ? "axis-line" : "grid-line" }));
      const t = S("text", { x: m.left - 8, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = compact(v);
      svg.append(t);
    }
    // Eixo X (anos). Mostra até ~8 rótulos
    const every = Math.max(1, Math.ceil((n - 1) / Math.max(3, Math.floor(iw / 70))));
    for (let i = 0; i < n; i++) {
      if (i % every !== 0 && i !== n - 1) continue;
      if (i !== n - 1 && n - 1 - i <= every / 2) continue; // evita colar no último rótulo
      const t = S("text", { x: x(i), y: H - m.bottom + 20, "text-anchor": "middle" });
      t.textContent = i === 0 ? "hoje" : `${series[0].pontos[i].ano} anos`;
      svg.append(t);
    }

    const cores = { 1: "var(--s1)", 2: "var(--s2)", 3: "var(--s3)", 4: "var(--s4)" };
    // Área só na série principal (lavagem a 10%)
    const principal = series[0];
    const areaD = principal.pontos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.total)}`).join(" ") + ` L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    svg.append(S("path", { d: areaD, class: "series-area", fill: cores[principal.cor] }));

    series.forEach((s) => {
      const d = s.pontos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.total)}`).join(" ");
      svg.append(S("path", { d, class: "series-line", stroke: cores[s.cor] }));
    });

    // Rótulos no fim das linhas (evita colisão: se encostarem, mantém só a principal)
    const ends = series.map((s) => ({ s, yy: y(s.pontos[n - 1].total) })).sort((a, b) => a.yy - b.yy);
    const visibles = [];
    for (const e of ends) {
      if (visibles.every((v) => Math.abs(v.yy - e.yy) >= 16) || e.s === principal) visibles.push(e);
    }
    const colide = (e) => visibles.some((v) => v !== e && Math.abs(v.yy - e.yy) < 16);
    visibles.forEach((e) => {
      if (e.s !== principal && colide(e)) return;
      svg.append(S("circle", { cx: x(n - 1), cy: e.yy, r: 4, fill: cores[e.s.cor], class: "dot" }));
      const t = S("text", { x: x(n - 1) + 10, y: e.yy + 4, class: "end-label" });
      t.textContent = fmt(e.s.pontos[n - 1].total);
      svg.append(t);
    });

    // Camada de hover
    const cross = S("line", { x1: 0, x2: 0, y1: m.top, y2: m.top + ih, class: "crosshair", visibility: "hidden" });
    svg.append(cross);
    const dots = series.map((s) => { const c = S("circle", { r: 5, fill: cores[s.cor], class: "dot", visibility: "hidden" }); svg.append(c); return c; });
    const hit = S("rect", { x: m.left, y: m.top, width: iw, height: ih, class: "hit" });
    svg.append(hit);

    const tooltip = el("div", { class: "tooltip hidden" });
    container.append(svg, tooltip);

    const show = (clientX) => {
      const rect = svg.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * W;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.left) / iw) * (n - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      series.forEach((s, k) => { dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(s.pontos[i].total)); dots[k].setAttribute("visibility", "visible"); });
      tooltip.classList.remove("hidden");
      tooltip.replaceChildren(
        el("div", { class: "tt-title", text: i === 0 ? "Hoje" : `Depois de ${series[0].pontos[i].ano} ano${i > 1 ? "s" : ""}` }),
        ...series.map((s) => el("div", { class: "tt-row" }, el("span", {}, el("span", { class: "swatch line", "data-cor": s.cor }), s.nome), el("b", { text: fmt(s.pontos[i].total) })))
      );
      const left = ((x(i) / W) * rect.width);
      const flip = left > rect.width * 0.6;
      tooltip.style.left = flip ? `${left - tooltip.offsetWidth - 12}px` : `${left + 12}px`;
      tooltip.style.top = `${(m.top / H) * rect.height}px`;
    };
    const hide = () => {
      cross.setAttribute("visibility", "hidden");
      dots.forEach((d) => d.setAttribute("visibility", "hidden"));
      tooltip.classList.add("hidden");
    };
    hit.addEventListener("pointermove", (e) => show(e.clientX));
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("touchstart", (e) => show(e.touches[0].clientX), { passive: true });
  }

  function initSimulador() {
    const sel = $("#sim-taxa");
    sel.replaceChildren(...TAXAS_REFERENCIA.map((t) => el("option", { value: t.id, text: `${t.nome} (~${t.taxa}% ao ano)` })));
    sel.value = "selic";
    const perfil = storage.get("if_perfil", null);
    if (perfil && PERFIS[perfil.id] && perfil.id !== "conservador") sel.value = perfil.id;
    syncTaxaFromSelect();
    sel.addEventListener("change", syncTaxaFromSelect);
    ["#sim-inicial", "#sim-mensal", "#sim-anos", "#sim-taxa-custom"].forEach((id) => $(id).addEventListener("input", renderSimulador));
    $("#sim-table-toggle").addEventListener("click", (e) => {
      const t = $("#sim-table");
      const open = t.classList.toggle("hidden") === false;
      e.currentTarget.setAttribute("aria-expanded", String(open));
      e.currentTarget.textContent = open ? "Esconder tabela" : "Ver em tabela";
    });
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderSimulador, 150); });
  }

  // ---------- Carteira ----------
  function getHoldings() {
    const h = storage.get("if_holdings", []);
    return Array.isArray(h) ? h.filter((x) => x && typeof x.nome === "string" && catById(x.cat) && Number(x.valor) > 0) : [];
  }
  const setHoldings = (h) => storage.set("if_holdings", h);

  function renderCarteira() {
    const holdings = getHoldings();
    const total = holdings.reduce((a, h) => a + Number(h.valor), 0);
    const list = $("#holdings");
    $("#cart-empty").classList.toggle("hidden", holdings.length > 0);
    $("#cart-total").textContent = holdings.length ? fmtCents(total) : "";
    list.replaceChildren(
      ...holdings.map((h) => {
        const cat = catById(h.cat);
        return el("li", {},
          el("span", { class: "bar swatch", "data-cor": cat.cor }),
          el("div", { class: "name" }, el("strong", { text: h.nome }), el("span", { text: `${cat.nome} · ${pct((h.valor / total) * 100)} da carteira` })),
          el("span", { class: "val", text: fmtCents(h.valor) }),
          el("button", { class: "icon-btn", "aria-label": `Remover ${h.nome}`, title: "Remover", text: "✕", onclick: () => { setHoldings(getHoldings().filter((x) => x.id !== h.id)); renderCarteira(); renderHomeStatus(); } })
        );
      })
    );

    // Divisão atual por categoria
    const porCat = {};
    TODAS_CATEGORIAS.forEach((c) => (porCat[c.id] = 0));
    holdings.forEach((h) => (porCat[h.cat] += Number(h.valor)));
    allocBar(porCat, $("#cart-alloc"));
    legendFor(porCat, $("#cart-legend"), { showValues: true });

    const perfilSalvo = storage.get("if_perfil", null);
    const perfil = perfilSalvo && PERFIS[perfilSalvo.id] ? PERFIS[perfilSalvo.id] : null;
    renderComparacao(porCat, total, perfil);
    renderDiagnostico(holdings, porCat, total, perfil, perfilSalvo);
  }

  function renderComparacao(porCat, total, perfil) {
    const box = $("#cart-compare");
    box.replaceChildren();
    if (!total) return;
    if (!perfil) {
      box.append(el("div", { class: "alert alert-info" }, el("span", { class: "icon", text: "🧭" }),
        el("p", {}, "Faça o ", el("button", { class: "btn btn-ghost", "data-nav": "perfil", text: "teste de perfil", style: { padding: "0 4px" } }), " para comparar sua divisão com a sugerida para você.")));
      return;
    }
    // Poupança conta como reserva (é líquida e segura); "outros" fica fora da comparação.
    const atual = {
      reserva: porCat.reserva + porCat.poupanca,
      rendafixa: porCat.rendafixa,
      fiis: porCat.fiis,
      acoes: porCat.acoes,
    };
    const base = total - porCat.outros || 1;
    box.append(el("h3", { text: `Atual × sugerido para o perfil ${perfil.nome}`, style: { fontSize: "1rem" } }));
    CATEGORIAS.forEach((c) => {
      const a = (atual[c.id] / base) * 100;
      const alvo = perfil.carteira[c.id];
      const d = Math.round(a - alvo);
      const deltaTxt = Math.abs(d) < 5 ? "no ponto" : d > 0 ? `${d} pontos acima` : `${-d} pontos abaixo`;
      const bar = (lbl, v, cls) => el("div", { class: "compare-bar" },
        el("span", { class: "lbl", text: lbl }),
        el("div", { class: "track" }, el("div", { class: `fill ${cls}`, "data-cor": c.cor, style: { width: `${Math.min(100, v)}%`, background: `var(--s${c.cor})` } })),
        el("span", { class: "pct", text: pct(v) }));
      box.append(el("div", { class: "compare-row" },
        el("div", { class: "compare-head" }, el("strong", { text: c.nome }), el("span", { class: "delta", text: deltaTxt })),
        el("div", { class: "compare-bars" }, bar("Hoje", a, ""), bar("Alvo", alvo, "target"))
      ));
    });
    box.append(el("p", { class: "small muted", style: { marginTop: "10px" }, text: "A poupança entra como reserva de emergência. O que está em \"Outros\" fica fora dessa comparação." }));
  }

  function renderDiagnostico(holdings, porCat, total, perfil, perfilSalvo) {
    const box = $("#cart-diagnostico");
    const msgs = [];
    const add = (tipo, icone, titulo, texto) => msgs.push({ tipo, icone, titulo, texto });

    if (!total) {
      add("info", "📝", "Comece anotando", "Coloque ao lado tudo que você tem guardado, inclusive a poupança. Só de ver o total junto já muda a forma de pensar.");
    } else {
      const share = (id) => (porCat[id] / total) * 100;
      const reservaTotal = porCat.reserva + porCat.poupanca;

      if (share("poupanca") >= 30) {
        const ganhoAno = porCat.poupanca * ((TAXAS_REFERENCIA[2].taxa - TAXAS_REFERENCIA[1].taxa) / 100);
        add("warn", "🐷", `${pct(share("poupanca"))} na poupança`,
          `São ${fmt(porCat.poupanca)} rendendo pouco. Em um Tesouro Selic ou CDB que pague 100% do CDI, com a mesma segurança e saque no mesmo dia, isso renderia cerca de ${fmt(ganhoAno)} a mais por ano. A mudança leva uns minutos no app do banco ou corretora.`);
      }
      if (reservaTotal === 0 || (perfilSalvo && perfilSalvo.semReserva && reservaTotal < total * 0.2)) {
        add("bad", "🚨", "Sem reserva de emergência",
          "Nada do que você tem pode ser sacado hoje sem risco de perda. Antes de qualquer outro passo, monte uma reserva de 3 a 6 meses de gastos em Tesouro Selic ou CDB com liquidez diária.");
      }
      if (holdings.length === 1 && total > 5000) {
        add("info", "🥚", "Tudo em um só lugar",
          "Normal no começo. Conforme o valor crescer, espalhe em duas ou três caixinhas diferentes para que um problema não derrube tudo.");
      } else if (holdings.length >= 2) {
        const maior = holdings.reduce((a, b) => (Number(a.valor) > Number(b.valor) ? a : b));
        const sm = (Number(maior.valor) / total) * 100;
        if (sm > 60 && !["reserva", "rendafixa", "poupanca"].includes(maior.cat)) {
          add("warn", "🧺", `${pct(sm)} em "${maior.nome}"`,
            "Mais da metade do dinheiro em um único investimento de renda variável. Se ele cair, sua carteira inteira cai junto. Vale distribuir.");
        }
      }
      if (perfil) {
        const alvoAcoes = perfil.carteira.acoes;
        if (share("acoes") > alvoAcoes + 15) {
          add("warn", "🎢", "Mais ações do que o seu perfil costuma aguentar",
            `Você tem ${pct(share("acoes"))} em ações e a sugestão para o perfil ${perfil.nome} é por volta de ${pct(alvoAcoes)}. Não é errado, mas nos meses ruins o susto vai ser maior do que você disse que aguenta.`);
        } else if (alvoAcoes > 0 && share("acoes") === 0 && share("fiis") === 0 && reservaTotal > 0 && total > 10000) {
          add("info", "🌱", "Dá para crescer um pouco mais",
            `Seu perfil ${perfil.nome} permite uma fatia em ações e fundos imobiliários, e você não tem nada neles. Comece pequeno, com um ETF, só com o dinheiro que não vai precisar nos próximos anos.`);
        }
        if (perfil.id === "conservador" && share("acoes") + share("fiis") > 25) {
          add("warn", "🛡️", "Mais risco do que você quer",
            "Você se descreveu como conservador, mas uma parte grande está em renda variável. Se o sobe e desce incomoda, reduza aos poucos; não precisa vender tudo de uma vez.");
        }
      }
      if (share("outros") > 20) {
        add("warn", "❓", `${pct(share("outros"))} em "Outros"`,
          "Uma fatia grande em coisas que não se encaixam nas caixinhas básicas (cripto, fundos variados). Vale entender exatamente o que é cada uma e se você aguentaria perder esse valor.");
      }
      if (!msgs.length) {
        add("good", "✅", "Está bem encaminhado",
          "Nada de alarmante na sua carteira. O trabalho agora é o mais chato e o mais importante: continuar aportando todo mês e não mexer nos dias de queda.");
      } else if (!msgs.some((m) => m.tipo === "bad")) {
        add("good", "👏", "Você já está à frente", "Só de ter o dinheiro guardado e anotado você já faz mais que a maioria. Os ajustes acima são melhorias, não emergências.");
      }
    }
    box.replaceChildren(...msgs.map((m) =>
      el("div", { class: `alert alert-${m.tipo}` }, el("span", { class: "icon", text: m.icone }),
        el("p", {}, el("strong", { text: m.titulo + ". " }), m.texto))
    ));
  }

  function initCarteira() {
    const sel = $("#h-cat");
    sel.replaceChildren(...TODAS_CATEGORIAS.map((c) => el("option", { value: c.id, text: c.nome })));
    const help = () => { const c = catById(sel.value); $("#h-cat-help").textContent = `${c.explicacao} Exemplos: ${c.exemplos}`; };
    sel.addEventListener("change", help);
    help();

    $("#holding-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = $("#h-nome").value.trim();
      const valor = Number($("#h-valor").value);
      if (!nome || !(valor > 0)) return;
      const h = getHoldings();
      h.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome, cat: sel.value, valor: Math.round(valor * 100) / 100 });
      setHoldings(h);
      $("#h-nome").value = "";
      $("#h-valor").value = "";
      $("#h-nome").focus();
      renderCarteira();
      renderHomeStatus();
    });

    $("#cart-clear").addEventListener("click", () => {
      if (!getHoldings().length) return;
      if (confirm("Apagar todos os investimentos anotados? Isso não pode ser desfeito.")) {
        setHoldings([]);
        renderCarteira();
        renderHomeStatus();
      }
    });

    $("#cart-export").addEventListener("click", () => {
      const h = getHoldings();
      if (!h.length) return;
      const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
      const linhas = ["nome;tipo;valor", ...h.map((x) => `${esc(x.nome)};${esc(catById(x.cat).nome)};${x.valor.toFixed(2).replace(".", ",")}`)];
      const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = el("a", { href: URL.createObjectURL(blob), download: "minha-carteira.csv" });
      document.body.append(a); a.click(); a.remove();
    });
  }

  // ---------- Dicionário ----------
  function renderDicionario(filtro = "") {
    const q = filtro.trim().toLowerCase();
    const itens = DICIONARIO.filter((d) => !q || d.termo.toLowerCase().includes(q) || d.explicacao.toLowerCase().includes(q));
    const box = $("#dict-list");
    box.replaceChildren(
      ...itens.map((d) => el("div", { class: "card dict-item" }, el("h3", { text: d.termo }), el("p", { text: d.explicacao, style: { margin: 0 } }), el("p", { class: "analogy", text: d.analogia })))
    );
    if (!itens.length) box.append(el("p", { class: "empty", text: "Nenhum termo encontrado. Tente outra palavra." }));
  }

  function initDicionario() {
    renderDicionario();
    $("#dict-q").addEventListener("input", (e) => renderDicionario(e.target.value));
  }

  // ---------- Inicialização ----------
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderDicas();
    initQuiz();
    initSimulador();
    initCarteira();
    initDicionario();
    initNav();
  });
})();
