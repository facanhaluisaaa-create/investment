# Investir Fácil

Uma plataforma educativa para quem quer entender e melhorar os próprios investimentos sem precisar gostar do assunto. Tudo em português simples, sem jargão e sem planilha.

## O que ela faz

1. **Meu perfil** – cinco perguntas rápidas descobrem se a pessoa é conservadora, moderada ou arrojada. O resultado vem com uma divisão sugerida do dinheiro em quatro "caixinhas" (reserva de emergência, renda fixa, fundos imobiliários, ações) e três próximos passos.
2. **Simulador** – mostra quanto um valor inicial mais um aporte mensal viram ao longo dos anos, comparando com a poupança e com o dinheiro parado. Gráfico interativo, tabela e "lições" calculadas na hora (quanto custa esperar 5 anos, quanto rende guardar R$ 100 a mais).
3. **Minha carteira** – a pessoa anota o que já tem (inclusive poupança) e recebe uma comparação com o perfil e um diagnóstico em linguagem simples: poupança demais, falta de reserva, concentração, risco acima do perfil.
4. **Dicionário** – termos como CDI, liquidez e ETF explicados em duas frases e uma comparação do dia a dia.

Os dados ficam apenas no navegador da pessoa (localStorage). Nada é enviado a servidor algum.

## Como rodar

Não precisa instalar nada. Abra o arquivo `index.html` no navegador, ou sirva a pasta com qualquer servidor estático:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Para publicar de graça, ative o GitHub Pages do repositório apontando para a branch principal.

## Estrutura

```
index.html      página única com as cinco seções
css/style.css   estilos, tema claro e escuro
js/data.js      conteúdo: perguntas, perfis, categorias, taxas e dicionário
js/app.js       lógica: navegação, teste, simulador, carteira e busca
```

Para mudar textos, perfis ou taxas de referência, edite apenas `js/data.js`.

## Aviso

O site é educativo. Não vende investimentos nem substitui orientação profissional. As taxas do simulador são estimativas para comparação, não promessas.
