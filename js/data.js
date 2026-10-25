// =====================================================================
//  ARROZ DOURADO — dados do jogo (história, upgrades, fitas, notícias)
//  Tudo que é texto/roteiro/balanceamento mora aqui pra facilitar lapidar.
// =====================================================================

const DATA = {};

// ---------------------------------------------------------------------
// DIAS DO FERIADÃO (20/11/2026 cai numa sexta mesmo!)
// ---------------------------------------------------------------------
DATA.DAYS = [
  { name: 'SEXTA', date: '20/11', tag: 'FERIADO · CONSCIÊNCIA NEGRA', parcela: 5000 },
  { name: 'SÁBADO', date: '21/11', tag: 'FERIADÃO', parcela: 100000 },
  { name: 'DOMINGO', date: '22/11', tag: 'ÚLTIMO DIA', parcela: 0 },
];
DATA.DAY_START = 7 * 60;       // 07:00
DATA.DAY_END = 22 * 60;        // 22:00 -> cobrança
DATA.GAME_MIN_PER_SEC = 1.6;   // ~9 min reais por dia
DATA.DEBT_START = 10000000;

// ---------------------------------------------------------------------
// SACOS — o tamanho cresce conforme sua velocidade de contagem
// ---------------------------------------------------------------------
DATA.SACKS = [
  { size: 20, name: 'Saquinho de Amostra' },
  { size: 50, name: 'Punhado' },
  { size: 100, name: 'Copo Americano' },
  { size: 250, name: 'Pote de Margarina' },
  { size: 500, name: 'Marmita' },
  { size: 1000, name: 'Saquinho de 20g' },
  { size: 2500, name: 'Pacotinho de 50g' },
  { size: 5000, name: 'Pacote de 100g' },
  { size: 12500, name: 'Pacote de 250g' },
  { size: 25000, name: 'Pacote de 500g' },
  { size: 50000, name: 'Pacote de 1kg' },
  { size: 250000, name: 'Fardo de 5kg' },
  { size: 1250000, name: 'Saco de 25kg' },
  { size: 2500000, name: 'Saco de 50kg' },
  { size: 10000000, name: 'Saca de 200kg' },
  { size: 50000000, name: 'Big Bag de 1 Tonelada' },
];
DATA.SACK_ORIGINS = [
  'Fazenda Jinlong · Campos dos Goytacazes',
  'Plantação Dragão Verde · Itaguaí',
  'Cooperativa do Seu Tião · Resende',
  'Sítio Lótus · Paty do Alferes',
  'Carga "sem nota" · Porto do Rio',
  'Fazenda Jinlong · Campos dos Goytacazes',
];

// ---------------------------------------------------------------------
// LOJA — Camelódromo da Uruguaiana (entrega via motoboy)
// type: 'tool' (uma vez, clique), 'helper' (compra várias, grãos/s), 'boost' (uma vez)
// ---------------------------------------------------------------------
DATA.UPGRADES = [
  // ---------- FERRAMENTAS (clique) ----------
  { id: 'pinca', type: 'tool', name: 'Pinça de Sobrancelha da Tia Cleide', cost: 15,
    desc: '+1 grão por clique. Ainda tem cheiro de cera quente.',
    effect: { clickAdd: 1 } },
  { id: 'hashi', type: 'tool', name: 'Hashi da Pastelaria do SAARA', cost: 120,
    desc: '+4 grãos por clique. Você segura do jeito certo de primeira. Estranho.',
    effect: { clickAdd: 4 } },
  { id: 'colher', type: 'tool', name: 'Colher de Pau da Vó', cost: 2500,
    desc: 'Clique ×3. Já bateu em muito neto. Agora conta arroz.',
    effect: { clickMul: 3 }, req: { grains: 400 } },
  { id: 'peneira', type: 'tool', name: 'Peneira de Feijão', cost: 60000,
    desc: 'Cada clique também conta 5% da sua produção por segundo.',
    effect: { clickGps: 0.05 }, req: { grains: 15000 } },
  { id: 'pa', type: 'tool', name: 'Pá de Pedreiro do Seu Jorge', cost: 600000,
    desc: 'Clique ×5. Seu Jorge pediu de volta segunda sem falta.',
    effect: { clickMul: 5 }, req: { grains: 200000 } },

  // ---------- AJUDANTES (grãos por segundo) ----------
  { id: 'pombo', type: 'helper', name: 'Pombo da Praça XV', cost: 20, gps: 1,
    desc: 'Conta 1 grão/s. Come uns 3 escondido, mas a gente finge que não viu.' },
  { id: 'abaco', type: 'helper', name: 'Ábaco do Vovô', cost: 160, gps: 6,
    desc: '6 grãos/s. Você sabe usar isso. Por que você sabe usar isso?',
    req: { tape: 1 } },
  { id: 'bicho', type: 'helper', name: 'Maquininha do Jogo do Bicho', cost: 1300, gps: 40,
    desc: '40 grãos/s. Deu cabra na cabeça. Deu arroz no milhar.',
    req: { grains: 1200 } },
  { id: 'balanca', type: 'helper', name: 'Balança Hackeada da CEASA', cost: 10000, gps: 300,
    desc: '300 grãos/s. Pesa, divide pelo peso do grão, arredonda pra cima. Ética? Na CEASA?',
    req: { day: 2 } },
  { id: 'robo', type: 'helper', name: 'Robô Xing Ling do Camelô', cost: 100000, gps: 1600,
    desc: '1.600 grãos/s. Veio sem manual. Fala só chinês. Você entende algumas palavras...',
    req: { tape: 4 } },
  { id: 'esteira', type: 'helper', name: 'Esteira Desviada do Porto Maravilha', cost: 1500000, gps: 11000,
    desc: '11.000 grãos/s. "Caiu do contêiner". Ninguém perguntou nada.',
    req: { day: 3 } },
  { id: 'dragao', type: 'helper', name: 'Dragão do Ano Novo Chinês', cost: 14000000, gps: 80000,
    desc: '80.000 grãos/s. Doze caras dentro de um dragão de pano contando arroz. Eles te chamam de "senhor".',
    req: { tape: 7 } },

  // ---------- BOOSTS ----------
  { id: 'radio', type: 'boost', name: 'Rádio de Pilha (Pagode 24h)', cost: 400,
    desc: 'Toda produção +25%. Toca pagode e notícia. Ninguém trabalha sem pagode.',
    effect: { allMul: 1.25 }, req: { grains: 150 } },
  { id: 'biscoito', type: 'boost', name: 'Biscoito Globo pros Pombos', cost: 900,
    desc: 'Pombos ×3. Salgado ou doce? Os pombos não ligam.',
    effect: { helperMul: { pombo: 3 } }, req: { owned: { pombo: 3 } } },
  { id: 'oculos', type: 'boost', name: 'Óculos Fundo de Garrafa', cost: 4000,
    desc: 'Você acha 5× mais Grãos Pretos (valem 77× o clique). Agora você enxerga TUDO.',
    effect: { blackChance: 5 }, req: { grains: 2000 } },
  { id: 'palpite', type: 'boost', name: 'Palpite do Bicheiro', cost: 18000,
    desc: 'Maquininhas do Bicho ×3. "Vai no dragão." — Não existe dragão no jogo do bicho.',
    effect: { helperMul: { bicho: 3 } }, req: { owned: { bicho: 5 } } },
  { id: 'maneki', type: 'boost', name: 'Maneki-neko do Camelô', cost: 45000,
    desc: 'Toda produção ×2. O gatinho acena pra você como quem diz "bem-vindo de volta".',
    effect: { allMul: 2 }, req: { day: 2 } },
  { id: 'arno', type: 'boost', name: 'Ventilador Arno no Talo', cost: 300000,
    desc: 'Balanças e Robôs ×2. 42 graus na Gamboa, os robôs agradecem.',
    effect: { helperMul: { balanca: 2, robo: 2 } }, req: { owned: { robo: 1 } } },
  { id: 'mantra', type: 'boost', name: 'Mantra da Contagem 一二三', cost: 1500000,
    desc: 'Toda produção ×2. Yī, èr, sān... Você nunca estudou isso. Você sabe isso.',
    effect: { allMul: 2 }, req: { tape: 6 } },
  { id: 'esteira2', type: 'boost', name: 'Esteira com Graxa de Navio', cost: 9000000,
    desc: 'Esteiras ×3. Graxa roubada do navio "Dragão de Jade". Navio que você... conhece?',
    effect: { helperMul: { esteira: 3 } }, req: { owned: { esteira: 3 } } },
  { id: 'selo', type: 'boost', name: 'Anel com o Selo 金龙', cost: 6000000,
    desc: 'Toda produção ×3. Achado num saco. Serve perfeitamente no seu dedo. Perfeitamente.',
    effect: { allMul: 3 }, req: { tape: 8 } },
];

// ---------------------------------------------------------------------
// FITAS CASSETE — o coração da história
// at: total de grãos contados pra fita aparecer num saco
// cost: preço da tradução (Dona Mei, Pastelaria Dragão Feliz, SAARA)
// voice: { pitch, rate } pro TTS em chinês (se o PC tiver voz zh)
// ---------------------------------------------------------------------
DATA.TAPES = [
  { day: 1, at: 30, cost: 25, speaker: 'VOZ DE VELHO',
    title: 'Para o meu filho', voice: { pitch: 0.55, rate: 0.8 },
    cn: '儿子，如果你在听这盘磁带，说明你迷路了。别怕。数米。一粒，一粒，再一粒。我们黄家的男人，都是从数米开始的。',
    pt: 'Filho, se você está ouvindo esta fita, é porque se perdeu. Não tenha medo. Conte o arroz. Um grão, um grão, mais um grão. Todo homem da família Huang começou contando arroz.',
    hint: 'Você reconhece... nada. Mas a voz te dá vontade de chorar. Por quê?',
    mei: 'Oi querido! Traduzi. Coisa de família, né? Que bonitinho. Pix recebido 🥟' },
  { day: 1, at: 450, cost: 250, speaker: 'VOZ DE VELHO',
    title: 'O Navio', voice: { pitch: 0.55, rate: 0.8 },
    cn: '一九六二年，我从广州坐一艘运米的船来到里约热内卢。口袋里只有一粒米。一粒金色的米。港口的人都笑我。三十年后，整个港口都是我们的。',
    pt: 'Em 1962, eu vim de Cantão para o Rio de Janeiro num navio carregado de arroz. No bolso, só um grão de arroz. Um grão DOURADO. O pessoal do porto riu de mim. Trinta anos depois, o porto inteiro era nosso.',
    hint: 'Você jura que ouviu "Rio de Janeiro" no meio. E alguma coisa sobre um navio?',
    mei: 'Zé... você tem certeza que não sabe chinês? Você pronuncia "xièxie" muito bem nos seus áudios.' },
  { day: 1, at: 5000, cost: 2000, speaker: 'VOZ DE VELHO',
    title: 'King Size', voice: { pitch: 0.55, rate: 0.8 },
    cn: '世上有很多王。但在所有的王之上，有一个最大的王。King Size。谁拿着金米，谁就是King Size。全世界的三合会都要向他低头。儿子，总有一天，金米会传给你。',
    pt: 'Existem muitos reis no mundo. Mas acima de todos eles existe um rei maior que todos: o KING SIZE. Quem segura o Grão Dourado é o King Size. Todas as tríades do mundo baixam a cabeça pra ele. Filho, um dia o grão vai passar pra você.',
    hint: 'No meio do chinês: "KING SIZE". Em inglês. Tipo colchão. Por que isso te dá arrepio?',
    mei: '...Zé, onde você achou essas fitas? Não manda isso pra mais ninguém, tá? Só pra mim.' },
  { day: 2, at: 20000, cost: 10000, speaker: 'VOZ DE MULHER',
    title: 'Lina e Mimi', voice: { pitch: 1.25, rate: 0.95 },
    cn: '金龙，生日快乐！米米，快给爸爸唱歌！……你答应过我，今年以后，不再管三合会的事了。我们搬去帕拉蒂，每天看海，好吗？',
    pt: '(barulho de churrascaria, pagode ao fundo) Jinlong, feliz aniversário! Mimi, canta pro papai! ... Você me prometeu que depois desse ano ia largar a tríade. A gente se muda pra Paraty, vê o mar todo dia, tá bom?',
    hint: 'Barulho de churrascaria. Pagode no fundo. Uma criança cantando "parabéns". Você sorri sem querer.',
    mei: 'Querido... você chorou ouvindo essa? Eu chorei traduzindo. A Lina era uma moça tão boa.' },
  { day: 2, at: 80000, cost: 30000, speaker: 'VOZ DE VELHO (FRACA)',
    title: 'As Serpentes', voice: { pitch: 0.5, rate: 0.7 },
    cn: '澳门蛇帮来到了里约。他们的头子叫蛇王。他想要金米，想当King Size。儿子，我老了。从今天起，你就是King Size。保护金米。保护家人。',
    pt: 'As Serpentes de Macau chegaram ao Rio. O chefe deles se chama Rei Cobra. Ele quer o Grão Dourado, quer ser o King Size. Filho, eu estou velho. A partir de hoje, VOCÊ é o King Size. Proteja o grão. Proteja a família.',
    hint: 'O velho tosse muito. Ele fala "King Size" de novo. E aponta pra alguém. Pra você?',
    mei: 'O preço subiu, querido. Não é ganância. É medo. Isso que você tá ouvindo é perigoso.' },
  { day: 2, at: 250000, cost: 90000, speaker: 'VOZ DE HOMEM (FAMILIAR)',
    title: 'Minha própria voz', voice: { pitch: 0.85, rate: 0.85 },
    cn: '我是黄金龙。我录下这些，因为我害怕。医生说，人受到太大的打击，大脑会把记忆藏起来。如果我忘了……这些磁带会带我回家。',
    pt: 'Eu sou Huang Jinlong. Estou gravando isso porque tenho medo. O médico disse que, quando um homem sofre um golpe grande demais, o cérebro esconde as memórias. Se eu esquecer... estas fitas vão me trazer de volta pra casa.',
    hint: 'Essa voz... você conhece essa voz. Você ouve ela toda vez que fala sozinho.',
    mei: 'Essa voz... Zé, me manda um áudio. Fala qualquer coisa. Por favor.' },
  { day: 3, at: 2200000, cost: 650000, speaker: 'VOZ DE HOMEM (SUA?)',
    title: 'A noite do Joá', voice: { pitch: 0.85, rate: 0.75 },
    cn: '那天晚上，在卓阿的房子里……蛇帮来了。丽娜，米米，爸爸……全都……我回来的时候已经太晚了。蛇王没有找到金米。因为金米在我的舌头下面。',
    pt: 'Naquela noite, na mansão do Joá... as Serpentes vieram. Lina, Mimi, papai... todos... Quando eu cheguei já era tarde demais. O Rei Cobra não achou o Grão Dourado. Porque o grão estava debaixo da minha língua.',
    hint: 'Você não precisa de tradução pra entender o choro. Sua mão treme. Você para de contar por um segundo.',
    mei: 'Eu sinto muito, Jin— Zé. Eu sinto muito, muito.' },
  { day: 3, at: 8000000, cost: 2200000, speaker: 'VOZ DE HOMEM (SUA)',
    title: 'O Plano', voice: { pitch: 0.85, rate: 0.85 },
    cn: '关叔，听好。我会忘记一切。给所有人放假。把金米藏进工厂的一个米袋里。每天打电话给我，说我欠三合会的钱。让我数米。数到我想起来为止。……是的，关叔。这是命令。',
    pt: 'Tio Kwan, escuta bem. Eu vou esquecer tudo. Dá férias pra todo mundo. Esconde o Grão Dourado num saco de arroz aqui na fábrica. Liga pra mim todo dia e diz que eu devo dinheiro pra tríade. Me faz contar arroz. Até eu lembrar. ...Sim, Tio Kwan. É uma ORDEM.',
    hint: 'Você está mexendo a boca junto com a fita. Você sabe o que vem depois de cada palavra.',
    mei: 'Agora você sabe quem liga pra você todo dia, querido.' },
  { day: 3, at: 22000000, cost: 0, speaker: 'DONA MEI',
    title: 'Você entende', voice: { pitch: 1.1, rate: 0.85 },
    cn: '金龙，你听得懂，对吧？你一直都听得懂。你不是工人。你从来都不是。这是你的工厂，你的港口，你的城市。最后一袋米里，有你的金米。拿起来吧。King Size。',
    pt: 'Jinlong, você entende, né? Você sempre entendeu. Você não é funcionário. Nunca foi. Esta é a SUA fábrica, o SEU porto, a SUA cidade. No último saco de arroz está o seu Grão Dourado. Pegue. King Size.',
    hint: '',
    mei: '' },
];

// ---------------------------------------------------------------------
// LIGAÇÕES DO "CHEFE"  (who: 'CHEFE' | 'VOCÊ' | 'NARRADOR' | 'DONA MEI')
// ---------------------------------------------------------------------
DATA.INTRO_CRAWL = [
  'Rio de Janeiro. Zona Portuária. Gamboa.',
  'Sexta-feira, 20 de novembro de 2026. Feriado.',
  'A cidade inteira desceu pra praia.',
  'Menos você.',
];

DATA.CALLS = {
  intro: [
    ['VOCÊ', '...Onde eu tô?'],
    ['NARRADOR', 'Galpão da ARROZ DRAGÃO DOURADO 金龙米. Você trabalha aqui. Você ACHA que trabalha aqui.'],
    ['NARRADOR', 'No seu peito, um crachá escrito à mão, com a sua letra: "ZÉ".'],
    ['NARRADOR', '* TRRRIM TRRRIM * — o telefone vermelho da parede está tocando.'],
    ['CHEFE', 'Zé. Bom dia. Sabe quem fala?'],
    ['VOCÊ', '...Não?'],
    ['CHEFE', 'Ótimo. Continua assim. Escuta: você deve DEZ MILHÕES DE REAIS à Tríade do Dragão de Jade.'],
    ['VOCÊ', 'Eu devo O QUÊ??'],
    ['CHEFE', 'Não interrompe. Os sacos chegam direto da plantação. Em um deles tem um grão de arroz de OURO MACIÇO. O Grão Dourado. Vale mais que você, mais que essa fábrica, mais que a Zona Sul inteira.'],
    ['CHEFE', 'Conta os grãos. Cada grão contado, um real no seu bolso. Achou o Grão Dourado, a dívida tá paga.'],
    ['CHEFE', 'É feriadão. Não tem mais ninguém na fábrica. Às dez da noite eu ligo pra cobrar a parcela: R$ 5.000.'],
    ['CHEFE', 'Ah, e Zé... se achar alguma coisa estranha nos sacos... não pergunta. Só escuta.'],
    ['NARRADOR', '* click *'],
    ['VOCÊ', 'Dez milhões... a um real o grão... Tá. Um de cada vez.'],
  ],
  morning2: [
    ['NARRADOR', '* TRRRIM TRRRIM *'],
    ['CHEFE', 'Bom dia, Zé. Dormiu bem no quartinho dos fundos?'],
    ['CHEFE', 'Fiquei sabendo que você anda mandando áudio pra uma pastelaria no SAARA.'],
    ['VOCÊ', 'Como é que você sabe disso?'],
    ['CHEFE', 'Eu sei tudo que acontece nessa fábrica, Zé. ...Quase tudo.'],
    ['CHEFE', 'Sábado. A parcela de hoje é R$ 100.000. Conta rápido.'],
    ['NARRADOR', '* click *'],
  ],
  morning3: [
    ['NARRADOR', '* TRRRIM TRRRIM *'],
    ['CHEFE', '...'],
    ['CHEFE', 'Bom dia, 老板— ...digo. Bom dia, Zé.'],
    ['VOCÊ', 'O que foi que você disse?'],
    ['CHEFE', 'Nada. Último dia do feriadão. Amanhã os funcionários voltam.'],
    ['VOCÊ', 'Que funcionários? Eu sou o único funcionário daqui.'],
    ['CHEFE', '...É. Claro que é. Hoje não tem parcela, Zé. Hoje só tem o grão.'],
    ['NARRADOR', '* click *'],
  ],
  night1: [
    ['CHEFE', 'Amanhã a parcela sobe. Vai descansar, Zé.'],
    ['CHEFE', 'E Zé... se sonhar com alguma coisa... não conta pra ninguém.'],
    ['NARRADOR', '* click *'],
  ],
  night2: [
    ['CHEFE', 'As Serpentes andam rondando a Gamboa. Não abre a porta pra ninguém.'],
    ['VOCÊ', 'Serpentes? Que serpentes?'],
    ['CHEFE', '...Boa noite, Zé.'],
    ['NARRADOR', '* click *'],
  ],
  finalMachines: [
    ['NARRADOR', 'As luzes piscam. As máquinas param, todas ao mesmo tempo. Os pombos ficam em silêncio.'],
    ['NARRADOR', 'Um último saco desce. Sem rótulo. Só um ideograma, escrito à mão, com a SUA letra: 金'],
    ['VOCÊ', '金... Jīn. Ouro.'],
    ['VOCÊ', 'Esse eu conto com as minhas mãos.'],
  ],
  ending: [
    ['NARRADOR', '* TRRRIM TRRRIM *'],
    ['CHEFE', '...Alô? Senhor?'],
    ['CHEFE', 'Eu sabia que o senhor ia conseguir.'],
    ['CHEFE', 'Sou eu. Tio Kwan. Três dias eu liguei, cobrei, ameacei. Tudo ordem sua.'],
    ['CHEFE', 'O dinheiro que o senhor "pagou" pra Tríade... tá na sua conta. O senhor pagou a si mesmo.'],
    ['CHEFE', 'Os carros estão lá fora. Os homens estão esperando. O porto inteiro está esperando.'],
    ['CHEFE', 'E o Rei Cobra... ainda está no Rio.'],
    ['CHEFE', 'Bem-vindo de volta, Huang Jinlong.'],
    ['CHEFE', 'Bem-vindo de volta, KING SIZE.'],
  ],
};

DATA.DREAMS = {
  1: [
    'Você sonha.',
    'Fogos estourando sobre Copacabana. Todo mundo de branco. Réveillon.',
    'Um velho grita um nome que você não reconhece:',
    '— 金龙！ Jīnlóng!',
    'Você vira pra responder.',
    'Por que você virou?',
  ],
  2: [
    'Você sonha de novo.',
    'Uma casa enorme pendurada no morro do Joá, de frente pro mar.',
    'Uma menininha de vestido vermelho corre na sua direção gritando:',
    '— 爸爸！ Bàba!',
    'Você abre os braços.',
    'Então chegam as cobras.',
    'Você acorda suando. O único cheiro que te acalma é o de arroz cru.',
  ],
};

// ---------------------------------------------------------------------
// COISAS QUE VÊM DENTRO DOS SACOS
// effect: 'money' (x segundos de produção), 'buff' (produção x2 por 30s), null
// ---------------------------------------------------------------------
DATA.SACK_ITEMS = [
  { day: 1, text: 'Uma Havaiana esquerda. Cadê a direita?' },
  { day: 1, text: 'Um bilhete do jogo do bicho: "DRAGÃO — milhar 8888". Não existe dragão no jogo do bicho.' },
  { day: 1, text: 'Um pacote de Biscoito Globo! Você come. Produção ×2 por 30s.', effect: 'buff' },
  { day: 1, text: 'Uma moeda de 1 real de 1998. Brilha. Não é o grão.', effect: 'money', secs: 5 },
  { day: 1, text: 'Um rato. Ele te encara. Você encara ele. Ele vai embora com dignidade.' },
  { day: 1, text: 'Uma carteira de trabalho em branco. O campo "nome" foi raspado com estilete.' },
  { day: 1, text: 'Um grão... DOURADO?!?! ...Não. É milho. Milho com purpurina de carnaval.', fake: true },
  { day: 1, text: 'Um mate de galão vazio. Alguém da plantação tem bom gosto.' },
  { day: 1, text: 'Uma ficha de orelhão. Do tempo que existia orelhão.' },
  { day: 2, text: 'Uma foto rasgada: uma menininha sorrindo na frente do Cristo. Atrás, escrito: 米米.' },
  { day: 2, text: 'Um dente de ouro! Não é o grão, mas é ouro. Você vende pro cara do Saara.', effect: 'money', secs: 40 },
  { day: 2, text: 'Um ingresso: "Réveillon Copacabana — Camarote Dragão Dourado — VIP".' },
  { day: 2, text: 'Um GRÃO DOURADO!!! ...Pintado com caneta Pilot dourada. Alguém tá zoando com a sua cara.', fake: true },
  { day: 2, text: 'Um panfleto: "Pastelaria Dragão Feliz — pastel de flango e caldo de cana". A Dona Mei!' },
  { day: 2, text: 'Um pastel de queijo, ainda quente. Como?? Produção ×2 por 30s.', effect: 'buff' },
  { day: 3, text: 'Uma chave com chaveiro: "MANSÃO DO JOÁ". Você guarda no bolso sem pensar.' },
  { day: 3, text: 'Um cartão preto: "Serpentes de Macau — sabemos onde você está."' },
  { day: 3, text: 'Uma fotografia de casamento. O noivo tem o seu rosto. Você vira a foto pra baixo.' },
  { day: 3, text: 'Um maço de dólares amarrado com fita vermelha. "Pro chefe." Que chefe?', effect: 'money', secs: 60 },
  { day: 3, text: 'Um gatinho maneki-neko quebrado. O bracinho ainda acena.' },
];

// ---------------------------------------------------------------------
// RÁDIO — notícias no letreiro (algumas só aparecem depois de certas fitas)
// ---------------------------------------------------------------------
DATA.NEWS = [
  { text: 'CALOR DE 41°C NO RIO; BANGU REGISTRA SENSAÇÃO TÉRMICA DE 52°C' },
  { text: 'FERIADÃO: ENGARRAFAMENTO DE 30 KM NA PONTE RIO-NITERÓI' },
  { text: 'POLÍCIA SEGUE SEM PISTAS DO MASSACRE NA MANSÃO DO JOÁ' },
  { text: 'EMPRESÁRIO HUANG JINLONG, DONO DA ARROZ DRAGÃO DOURADO, SEGUE DESAPARECIDO HÁ 3 MESES' },
  { text: 'PREÇO DO ARROZ DISPARA NO CEASA; FEIRANTES CULPAM "BOATO DE GRÃO DE OURO"' },
  { text: 'BISCOITO GLOBO NEGA BOATO DE SABOR ARROZ-DOCE' },
  { text: 'PRAIA DE COPACABANA LOTADA; VENDEDOR DE MATE BATE RECORDE' },
  { text: 'LENDA URBANA: "KING SIZE", O REI QUE NINGUÉM VIU, CONTROLARIA O PORTO DO RIO' },
  { day: 2, text: 'MOVIMENTAÇÃO ESTRANHA DE CARROS PRETOS NA GAMBOA DURANTE O FERIADO' },
  { day: 2, text: 'SERPENTES DE MACAU SÃO VISTAS EM RESTAURANTE NA BARRA DA TIJUCA' },
  { day: 2, text: 'PASTELARIA DO SAARA FECHA MAIS CEDO: "COISA DE FAMÍLIA", DIZ DONA' },
  { day: 3, text: 'URGENTE: HOMENS DE TERNO CERCAM GALPÃO DA ZONA PORTUÁRIA — "ESTAMOS ESPERANDO", DIZEM' },
  { day: 3, text: 'FAMILIARES DE HUANG JINLONG FORAM VÍTIMAS NO JOÁ; HERDEIRO NUNCA FOI ENCONTRADO' },
  { day: 3, text: 'REI COBRA, LÍDER DAS SERPENTES DE MACAU, OFERECE RECOMPENSA POR "GRÃO DE ARROZ"' },
];

DATA.MEMORY_LABELS = ['', '???', '???', 'MEMÓRIA?', 'MEMÓRIA?', 'MEMÓRIA?', 'MEMÓRIA', 'MEMÓRIA', 'MEMÓRIA', '记忆 · MEMÓRIA'];
DATA.BADGE_NAMES = ['ZÉ', 'ZÉ', 'ZÉ', 'ZÉ', 'ZÉ', 'ZÉ', 'ZÉ (?)', 'ZÉ (?)', 'Z̶É̶ · 黄?', '黄金龙'];

if (typeof module !== 'undefined') module.exports = DATA;
