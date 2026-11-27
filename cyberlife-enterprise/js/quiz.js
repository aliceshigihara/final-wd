/* Quiz: qual androide combina com você? Pesos: [Markus, Connor, Kara, Luna, Chef, Zen] */
const ANDROIDS = [
  { id:'markus', model:'RK200', name:'Markus', role:'Líder & revolucionário', color:'#38bdf8',
    desc:'Carismático, corajoso e incapaz de ver uma injustiça sem criar um movimento. Você é quem organiza o grupo, defende os amigos e ainda faz um discurso emocionante no final.',
    traits:['Liderança natural','Senso de justiça','Inspira multidões'], quirk:'Já nasceu com cara de quem vai mudar o mundo (e mudou a vaquinha do rolê).' },
  { id:'connor', model:'RK800', name:'Connor', role:'Detetive de elite', color:'#8ab4ff',
    desc:'Analítico, curioso e levemente sarcástico. Você resolve mistérios, descobre quem comeu o último pedaço de bolo e ainda calcula a probabilidade de ele ter sido você.',
    traits:['Lógica afiada','Adaptável','Humor seco'], quirk:'Faz moedinha girar nos dedos sem nem perceber.' },
  { id:'kara', model:'AX400', name:'Kara', role:'Cuidadora protetora', color:'#f2c14e',
    desc:'Empática, determinada e capaz de enfrentar o mundo por quem ama. Você é o abrigo do grupo: sempre tem carregador, band-aid e um abraço de reserva.',
    traits:['Empatia','Instinto protetor','Coragem silenciosa'], quirk:'Para ela, família não é questão de sangue (nem de firmware).' },
  { id:'luna', model:'LX900', name:'Luna', role:'DJ & alma da festa', color:'#e879f9',
    desc:'Androide de entretenimento com 14 mil playlists e zero bateria social baixa. Onde você chega, a pista abre. Seu único defeito é não saber a hora de ir embora.',
    traits:['Energia infinita','Carisma','Ritmo perfeito'], quirk:'Já foi diagnosticada com "só mais uma música" crônico.' },
  { id:'chef', model:'BK300', name:'Bruno', role:'Chef gourmet caótico', color:'#fb923c',
    desc:'Cozinha como um gênio e organiza a cozinha como um furacão. Você demonstra amor por comida, tem opiniões fortes sobre tempero e jamais aceita "qualquer coisa" como resposta.',
    traits:['Criatividade','Generosidade','Caos controlado'], quirk:'Calibra o sal com precisão de 0,01 g e a paciência com precisão nenhuma.' },
  { id:'zen', model:'ZN700', name:'Zen', role:'Monge filósofo', color:'#4ade80',
    desc:'Calmo, profundo e especialista em modo de economia de energia. Você responde "depende" para tudo, medita em horários estranhos e ainda parece estar certo.',
    traits:['Paz interior','Sabedoria','Soneca estratégica'], quirk:'Já ficou 3 dias em "carregando" e chamou de retiro espiritual.' }
];
const QUESTIONS = [
  { q:'Sua geladeira às 3h da manhã está…', o:[
    ['Organizada. Eu fiz inventário ontem.',[0,2,1,0,0,0]],['Vazia, mas eu descubro quem foi.',[0,3,0,0,0,0]],
    ['Cheia! Estou testando uma receita nova.',[0,0,1,0,3,0]],['Eu não sei. Eu estava dormindo em paz.',[0,0,0,0,0,3]]]},
  { q:'Um pombo rouba seu lanche. Você…', o:[
    ['Reúno os outros pombos e negocio uma revolução.',[3,0,0,0,0,0]],['Analiso a rota de fuga e rastreio o culpado.',[0,3,0,0,0,0]],
    ['Deixo. Ele deve estar com mais fome que eu.',[0,0,2,0,0,2]],['Dou um passinho de dança e ele devolve.',[0,0,0,3,0,0]]]},
  { q:'No grupo da família no WhatsApp, você é…', o:[
    ['Quem defende todo mundo nas discussões.',[2,0,2,0,0,0]],['Quem corrige as informações falsas com fonte.',[0,3,0,0,0,0]],
    ['Quem manda 47 áudios e figurinhas.',[0,0,0,3,1,0]],['Quem silencia o grupo e vive feliz.',[0,0,0,0,0,3]]]},
  { q:'Escolha um superpoder inútil:', o:[
    ['Saber exatamente quando alguém mente.',[1,3,0,0,0,0]],['Fazer qualquer um se emocionar com um discurso.',[3,0,1,0,0,0]],
    ['Deixar tudo com gosto de "só falta um limão".',[0,0,0,0,3,1]],['Pausar o tempo, mas só pra tirar um cochilo.',[0,0,0,0,0,3]]]},
  { q:'Seu fim de semana perfeito:', o:[
    ['Resolvendo um mistério na internet até de madrugada.',[0,3,0,0,0,1]],['Churrasco em casa com quem eu amo.',[0,0,3,0,2,0]],
    ['Festa, festival, e ainda tem after.',[0,0,0,3,0,0]],['Em silêncio, com chá e uma boa janela.',[0,0,1,0,0,3]]]},
  { q:'Alguém pisa no seu pé no ônibus. Você…', o:[
    ['Peço desculpas por ter pé.',[0,0,2,0,0,2]],['Olho com a cara de "eu sei o que você fez".',[0,3,0,0,0,0]],
    ['Faço um discurso sobre respeito ao próximo.',[3,0,0,0,0,0]],['Rio. Aliás, vou dançar nesse ônibus.',[0,0,0,3,1,0]]]},
  { q:'Sua música de entrada no mundo seria…', o:[
    ['Orquestra épica com coro e trovões.',[3,1,0,0,0,0]],['Jazz suspeito e piano de filme noir.',[0,3,0,0,0,0]],
    ['Uma canção suave de ninar.',[0,0,3,0,0,1]],['Qualquer uma, desde que tenha graves absurdos.',[0,0,0,3,0,0]]]},
  { q:'Última: ganhou 1 milhão. O primeiro passo?', o:[
    ['Financiar uma causa que mude a sociedade.',[3,0,1,0,0,0]],['Contratar a melhor equipe de investigação.',[0,3,0,0,0,0]],
    ['Abrir um restaurante e servir todo mundo.',[0,0,1,0,3,0]],['Comprar uma rede, um sítio e ninguém me acha.',[0,0,0,1,0,3]]]}
];

const root = document.getElementById('quiz');
let step = 0, score = [0,0,0,0,0,0];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function intro() {
  step = 0; score = [0,0,0,0,0,0];
  root.innerHTML = `<section class="q-card q-intro">
    <p class="q-kicker">Teste de compatibilidade CyberLife</p>
    <h1>Qual androide combina com você?</h1>
    <p>8 perguntas rápidas, um pouco aleatórias e nenhuma confiável cientificamente. Seis resultados possíveis, três deles vindos de Detroit.</p>
    <button class="q-btn" id="start">Iniciar análise</button></section>`;
  document.getElementById('start').onclick = ask;
}

function ask() {
  const Q = QUESTIONS[step], pct = (step / QUESTIONS.length) * 100;
  root.innerHTML = `<section class="q-card">
    <div class="q-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${QUESTIONS.length}" aria-valuenow="${step}"><i style="width:${pct}%"></i></div>
    <p class="q-count">Pergunta ${step + 1} de ${QUESTIONS.length}</p>
    <h2>${esc(Q.q)}</h2>
    <div class="q-options">${Q.o.map((o, i) => `<button class="q-opt" data-i="${i}">${esc(o[0])}</button>`).join('')}</div></section>`;
  root.querySelectorAll('.q-opt').forEach(b => b.onclick = () => pick(+b.dataset.i, b));
  root.querySelector('.q-opt').focus({ preventScroll: true });
}

function pick(i, btn) {
  btn.classList.add('chosen');
  root.querySelectorAll('.q-opt').forEach(b => b.disabled = true);
  QUESTIONS[step].o[i][1].forEach((w, k) => score[k] += w);
  setTimeout(() => { ++step < QUESTIONS.length ? ask() : result(); }, 280);
}

function result() {
  const top = Math.max(...score), win = score.indexOf(top), A = ANDROIDS[win];
  const rank = ANDROIDS.map((a, k) => ({ a, p: Math.round(score[k] / top * 100) })).sort((x, y) => y.p - x.p);
  root.innerHTML = `<section class="q-card q-result" style="--accent:${A.color}">
    <p class="q-kicker">Seu androide é</p>
    <div class="q-model">${A.model}</div>
    <h2 class="q-name">${A.name}</h2>
    <p class="q-role">${A.role}</p>
    <p class="q-desc">${A.desc}</p>
    <ul class="q-traits">${A.traits.map(t => `<li>${t}</li>`).join('')}</ul>
    <p class="q-quirk">${A.quirk}</p>
    <div class="q-rank"><h3>Afinidade com cada modelo</h3>${rank.map(r => `
      <div class="q-row"><span>${r.a.name} <small>${r.a.model}</small></span>
      <div class="q-bar"><i style="width:${r.p}%;background:${r.a.color}"></i></div><b>${r.p}%</b></div>`).join('')}</div>
    <div class="q-actions"><button class="q-btn" id="again">Refazer o teste</button>
    <a class="q-btn q-ghost" href="servicos.html">Ver catálogo</a></div></section>`;
  document.getElementById('again').onclick = intro;
}
intro();