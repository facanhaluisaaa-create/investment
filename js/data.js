/* =========================================================
   Conteúdo da plataforma: textos, perfis, carteiras e dicionário.
   Tudo em linguagem simples. Nada aqui é recomendação financeira.
   ========================================================= */

// As quatro "caixinhas" em que dividimos qualquer carteira.
const CATEGORIAS = [
  {
    id: "reserva",
    nome: "Reserva de emergência",
    curto: "Reserva",
    cor: 1,
    explicacao:
      "Dinheiro que você consegue sacar a qualquer momento, sem perder nada. Serve para imprevistos: carro quebrou, perdeu o emprego, conta inesperada.",
    exemplos: "Tesouro Selic, CDB com liquidez diária, conta remunerada que rende 100% do CDI.",
  },
  {
    id: "rendafixa",
    nome: "Renda fixa",
    curto: "Renda fixa",
    cor: 2,
    explicacao:
      "Você empresta dinheiro (para o governo ou para um banco) e recebe de volta com juros combinados. É previsível e tem pouca surpresa.",
    exemplos: "Tesouro IPCA+, Tesouro Prefixado, CDB, LCI e LCA.",
  },
  {
    id: "fiis",
    nome: "Fundos imobiliários",
    curto: "Imóveis (FIIs)",
    cor: 3,
    explicacao:
      "Você compra um pedacinho de shoppings, galpões e prédios e recebe parte do aluguel todo mês. Sobe e desce, mas menos que ações.",
    exemplos: "Fundos imobiliários (FIIs) negociados na bolsa.",
  },
  {
    id: "acoes",
    nome: "Ações e ETFs",
    curto: "Ações",
    cor: 4,
    explicacao:
      "Você vira sócio de empresas. No longo prazo costuma render mais, mas o valor balança bastante no caminho. Só para dinheiro que não vai precisar tão cedo.",
    exemplos: "Ações de empresas, ETFs (cestas de ações como BOVA11 ou IVVB11).",
  },
];

// Categorias extras só para classificar o que a pessoa já tem.
const CATEGORIAS_EXTRA = [
  {
    id: "poupanca",
    nome: "Poupança",
    curto: "Poupança",
    cor: 0,
    explicacao:
      "A conta mais conhecida do Brasil. É segura e simples, mas costuma render menos que outras opções igualmente seguras.",
    exemplos: "Caderneta de poupança.",
  },
  {
    id: "outros",
    nome: "Outros",
    curto: "Outros",
    cor: 0,
    explicacao: "Criptomoedas, previdência, fundos variados e tudo que não se encaixa nas outras caixinhas.",
    exemplos: "Cripto, previdência privada, fundos multimercado.",
  },
];

const TODAS_CATEGORIAS = [...CATEGORIAS, ...CATEGORIAS_EXTRA];

// Perguntas do teste de perfil. Cada resposta tem pontos: mais pontos = aceita mais risco.
const PERGUNTAS = [
  {
    id: "objetivo",
    texto: "Para que você quer investir?",
    opcoes: [
      { texto: "Ter um dinheiro guardado para imprevistos", pontos: 0 },
      { texto: "Realizar um plano daqui a alguns anos (viagem, carro, casa)", pontos: 1 },
      { texto: "Construir patrimônio para o futuro ou aposentadoria", pontos: 2 },
    ],
  },
  {
    id: "prazo",
    texto: "Quando você acha que vai precisar desse dinheiro?",
    opcoes: [
      { texto: "Em menos de 1 ano", pontos: 0 },
      { texto: "Entre 1 e 5 anos", pontos: 1 },
      { texto: "Daqui a mais de 5 anos", pontos: 2 },
    ],
  },
  {
    id: "queda",
    texto: "Imagine que seus investimentos caíram 20% em um mês. O que você faria?",
    opcoes: [
      { texto: "Tiraria tudo, não durmo com isso", pontos: 0 },
      { texto: "Ficaria preocupado, mas esperaria melhorar", pontos: 1 },
      { texto: "Aproveitaria para investir mais, está barato", pontos: 2 },
    ],
  },
  {
    id: "reserva",
    texto: "Você já tem uma reserva de emergência (de 3 a 6 meses dos seus gastos)?",
    opcoes: [
      { texto: "Não, ainda não tenho", pontos: 0, semReserva: true },
      { texto: "Tenho uma parte", pontos: 1 },
      { texto: "Sim, já está completa", pontos: 2 },
    ],
  },
  {
    id: "conhecimento",
    texto: "Quanto você entende de investimentos hoje?",
    opcoes: [
      { texto: "Quase nada, e o assunto me cansa", pontos: 0 },
      { texto: "O básico: sei o que é poupança, CDB, Tesouro", pontos: 1 },
      { texto: "Bastante, já invisto em bolsa", pontos: 2 },
    ],
  },
];

// Perfis resultantes. A carteira é a divisão sugerida em porcentagem (soma 100).
const PERFIS = {
  conservador: {
    id: "conservador",
    nome: "Conservador",
    emoji: "🛡️",
    resumo: "Você prefere dormir tranquilo. Segurança vem antes de ganhar mais.",
    descricao:
      "Seu dinheiro deve ficar em lugares previsíveis. Nada de montanha-russa. O foco é não perder, render um pouco acima da inflação e ter o dinheiro à mão quando precisar.",
    carteira: { reserva: 40, rendafixa: 50, fiis: 10, acoes: 0 },
    rentabilidadeAnual: 10,
    passos: [
      "Complete sua reserva de emergência em algo que renda 100% do CDI e tenha saque imediato.",
      "Com a reserva pronta, coloque o restante em Tesouro IPCA+ ou CDBs de bancos sólidos.",
      "Se quiser um pouco mais de retorno, experimente uma pequena fatia em fundos imobiliários.",
    ],
  },
  moderado: {
    id: "moderado",
    nome: "Moderado",
    emoji: "⚖️",
    resumo: "Você aceita um pouco de sobe e desce em troca de render mais no longo prazo.",
    descricao:
      "Uma mistura equilibrada: a maior parte em opções seguras, e uma fatia em ações e imóveis para o dinheiro crescer com o tempo. Nos meses ruins o saldo cai um pouco, mas você sabe que é normal.",
    carteira: { reserva: 25, rendafixa: 45, fiis: 15, acoes: 15 },
    rentabilidadeAnual: 11,
    passos: [
      "Garanta a reserva de emergência antes de qualquer outra coisa.",
      "Monte a base em renda fixa (Tesouro IPCA+ e CDBs).",
      "Aos poucos, compre uma cesta de ações (ETF) e alguns fundos imobiliários. Comece pequeno.",
    ],
  },
  arrojado: {
    id: "arrojado",
    nome: "Arrojado",
    emoji: "🚀",
    resumo: "Você tem tempo, estômago e vontade de fazer o dinheiro crescer de verdade.",
    descricao:
      "Boa parte em ações e imóveis, porque você não vai precisar desse dinheiro tão cedo e aguenta ver o saldo cair sem desespero. Mesmo assim, reserva e renda fixa continuam no jogo: ninguém é arrojado com o aluguel do mês.",
    carteira: { reserva: 15, rendafixa: 35, fiis: 15, acoes: 35 },
    rentabilidadeAnual: 12,
    passos: [
      "Mesmo arrojado, tenha a reserva de emergência pronta. Ela te permite não vender nas quedas.",
      "Use ETFs para começar na bolsa: você compra dezenas de empresas de uma vez.",
      "Invista todo mês, no mesmo dia, sem olhar o preço. A constância vale mais que o timing.",
    ],
  },
};

// Taxas de referência para o simulador. São estimativas para fins educativos.
const TAXAS_REFERENCIA = [
  { id: "parado", nome: "Dinheiro parado (debaixo do colchão)", taxa: 0 },
  { id: "poupanca", nome: "Poupança", taxa: 6 },
  { id: "selic", nome: "Tesouro Selic ou CDB 100% do CDI", taxa: 10 },
  { id: "moderado", nome: "Carteira moderada (mistura)", taxa: 11 },
  { id: "arrojado", nome: "Carteira arrojada (mais ações)", taxa: 12 },
];

// Dicionário: termos traduzidos para gente normal.
const DICIONARIO = [
  {
    termo: "Renda fixa",
    explicacao: "Você empresta dinheiro e sabe, desde o início, como vai ser remunerado. Tem pouca surpresa.",
    analogia: "É como emprestar para um amigo que combina devolver com um extra no fim do ano.",
  },
  {
    termo: "Renda variável",
    explicacao: "Investimentos cujo valor sobe e desce todo dia, como ações e fundos imobiliários. Pode render mais, mas sem garantia.",
    analogia: "É como ser dono de um pedaço de uma padaria: se ela vende bem, você ganha; se vende mal, perde.",
  },
  {
    termo: "Tesouro Direto",
    explicacao: "Programa para emprestar dinheiro ao governo brasileiro. É considerado o investimento mais seguro do país.",
    analogia: "Você vira credor do governo e recebe juros por isso.",
  },
  {
    termo: "Tesouro Selic",
    explicacao: "Título do governo que rende perto da taxa básica de juros (Selic). Pode sacar a qualquer momento sem perder dinheiro. Ótimo para a reserva de emergência.",
    analogia: "Uma poupança turbinada e segura.",
  },
  {
    termo: "Tesouro IPCA+",
    explicacao: "Título do governo que rende a inflação mais uma taxa fixa. Garante que seu dinheiro ganhe da inflação se você levar até o vencimento.",
    analogia: "Um escudo contra a alta dos preços, com um bônus em cima.",
  },
  {
    termo: "Selic",
    explicacao: "A taxa básica de juros do Brasil, definida pelo Banco Central. Quando sobe, a renda fixa rende mais; quando cai, rende menos.",
    analogia: "O 'termostato' da economia.",
  },
  {
    termo: "CDI",
    explicacao: "Taxa que os bancos usam entre si. Anda colada na Selic. Muitos investimentos prometem render 'X% do CDI'.",
    analogia: "Se um CDB rende 100% do CDI, ele rende basicamente a Selic.",
  },
  {
    termo: "CDB",
    explicacao: "Você empresta dinheiro para um banco e ele devolve com juros. É protegido pelo FGC até R$ 250 mil por banco.",
    analogia: "A poupança do banco, só que paga melhor.",
  },
  {
    termo: "LCI e LCA",
    explicacao: "Parecidos com o CDB, mas o dinheiro vai para o setor imobiliário ou agrícola. A vantagem: não paga imposto de renda.",
    analogia: "Um CDB com desconto no imposto.",
  },
  {
    termo: "FGC",
    explicacao: "Fundo Garantidor de Créditos. Se o banco quebrar, ele devolve até R$ 250 mil por pessoa e por banco.",
    analogia: "Um seguro gratuito para o seu dinheiro em CDB, LCI, LCA e poupança.",
  },
  {
    termo: "Liquidez",
    explicacao: "A rapidez com que você consegue transformar o investimento em dinheiro na conta. 'Liquidez diária' = sai no mesmo dia.",
    analogia: "Dinheiro na carteira tem liquidez total. Um imóvel, quase nenhuma.",
  },
  {
    termo: "Rentabilidade",
    explicacao: "Quanto o seu dinheiro rendeu, em porcentagem, num período. 10% ao ano = cada R$ 100 virou R$ 110.",
    analogia: "A 'nota' do investimento.",
  },
  {
    termo: "Juros compostos",
    explicacao: "Os juros que rendem sobre os juros anteriores. É o que faz um valor pequeno crescer muito ao longo dos anos.",
    analogia: "Uma bola de neve: começa pequena e cresce cada vez mais rápido.",
  },
  {
    termo: "Inflação",
    explicacao: "O aumento geral dos preços. Se seu dinheiro rende menos que a inflação, você está ficando mais pobre mesmo com saldo maior.",
    analogia: "O carrinho de supermercado que custa mais todo ano com as mesmas coisas.",
  },
  {
    termo: "Diversificação",
    explicacao: "Espalhar o dinheiro em vários tipos de investimento para que um problema não derrube tudo.",
    analogia: "Não colocar todos os ovos na mesma cesta.",
  },
  {
    termo: "Ações",
    explicacao: "Pedacinhos de uma empresa. Quem tem ações é sócio e participa dos lucros (e dos prejuízos).",
    analogia: "Ser dono de 0,0001% da padaria da esquina.",
  },
  {
    termo: "ETF",
    explicacao: "Um fundo negociado na bolsa que compra uma cesta inteira de ações de uma vez. Simples e barato para começar.",
    analogia: "Em vez de escolher uma fruta, você leva a cesta pronta.",
  },
  {
    termo: "Fundo imobiliário (FII)",
    explicacao: "Fundo que compra imóveis (shoppings, galpões, escritórios) e distribui o aluguel aos cotistas todo mês.",
    analogia: "Receber aluguel sem ter que comprar um imóvel inteiro nem lidar com inquilino.",
  },
  {
    termo: "Dividendos",
    explicacao: "Parte do lucro que uma empresa ou fundo distribui para quem tem suas ações ou cotas.",
    analogia: "A 'mesada' que o investimento te paga.",
  },
  {
    termo: "Volatilidade",
    explicacao: "O quanto o preço de um investimento balança. Alta volatilidade = muito sobe e desce.",
    analogia: "Um mar agitado versus um lago calmo.",
  },
  {
    termo: "Aporte",
    explicacao: "Cada vez que você coloca dinheiro novo em um investimento.",
    analogia: "A 'parcela' que você paga para o seu eu do futuro.",
  },
  {
    termo: "Reserva de emergência",
    explicacao: "Dinheiro para imprevistos, equivalente a 3 a 6 meses dos seus gastos, guardado em algo seguro e com saque imediato.",
    analogia: "O extintor de incêndio das suas finanças: você torce para não usar, mas precisa ter.",
  },
  {
    termo: "Corretora",
    explicacao: "Empresa que te dá acesso aos investimentos (Tesouro, ações, fundos). Hoje a maioria não cobra para abrir conta.",
    analogia: "O 'supermercado' onde você compra os investimentos.",
  },
  {
    termo: "Imposto de renda nos investimentos",
    explicacao: "Em renda fixa, o imposto cai com o tempo: de 22,5% (menos de 6 meses) até 15% (acima de 2 anos). Poupança, LCI e LCA não pagam.",
    analogia: "Quanto mais tempo você deixa, menos o governo leva.",
  },
];

// Dicas rápidas para a página inicial.
const DICAS = [
  { icone: "1", titulo: "Primeiro a reserva", texto: "Antes de pensar em render muito, garanta 3 a 6 meses de gastos em um lugar seguro e de saque imediato." },
  { icone: "2", titulo: "Todo mês, sem falta", texto: "Investir um valor fixo todo mês vale mais que acertar o momento certo. Ninguém acerta o momento certo." },
  { icone: "3", titulo: "Comece simples", texto: "Tesouro Selic e um CDB já são um começo melhor que 90% das pessoas. Não precisa entender tudo para começar." },
  { icone: "4", titulo: "Desconfie de promessa", texto: "Rendimento garantido e muito acima da Selic não existe. Se parece bom demais, é golpe." },
  { icone: "5", titulo: "Tempo é seu amigo", texto: "Os juros compostos precisam de anos para mostrar o efeito. Quanto antes começar, menos esforço vai precisar." },
];
