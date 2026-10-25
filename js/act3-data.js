// =====================================================================
//  ARROZ DOURADO — ATO III: A FAROFA DE OURO (roteiro e dados)
//
//  Estrutura (cada estilo de jogo nasce da história):
//   PRÓLOGO  — o Rio começa a esquecer. Jinlong perdeu o King Size e o kung fu.
//   CAP. 1   — LUTA: treino no telhado + Torneio dos Acompanhamentos na Lapa
//              (pra achar a Dona Mei, tem que vencer os generais dela)
//   CAP. 2   — SURVIVAL HORROR: a Mansão do Joá, onde a família morreu
//              (Jinlong entra sozinho; descobre quem a Dona Mei realmente é)
//   CAP. 3   — CORRIDA: 23h15, a Niemeyer parada, só de moto até Copacabana
//   CAP. 4   — RITMO: o Réveillon. Memórias moram nas músicas.
//   EPÍLOGO  — o prato completo.
// =====================================================================

const DATA3 = {};

DATA3.MEMORY = { prologo: 88, torneio: 74, joa: 52, corrida: 31, reveillon: 9 };

// ---------------------------------------------------------------------
// LUTADORES
// ---------------------------------------------------------------------
DATA3.FIGHTERS = {
  jinlong: {
    name: 'HUANG JINLONG', short: 'JINLONG', look: 'jinlong', hp: 1000, speed: 3.3, jump: 9.5, scale: 1,
    color: '#ffd040',
    specials: { proj: 'ARROZ-DŌKEN', up: 'DRAGÃO-RYŪKEN', super: 'PRATO FEITO SUPREMO' },
    projColor: 0xfff4d0, desc: 'Equilibrado. Bola de arroz e uppercut do dragão.',
  },
  son: {
    name: 'XIAO DOU', short: 'XIAO DOU', look: 'son', hp: 950, speed: 3.9, jump: 10, scale: 1,
    color: '#40d080',
    specials: { proj: 'FEIJÃO-DŌKEN', up: 'TORNADO DE FEIJOADA', super: 'FEIJÃO DE OURO' },
    projColor: 0x8a5a2a, desc: 'Rápido. Feijão-dōken e chute-tornado.',
  },
  couve: {
    name: 'MESTRE COUVE', short: 'COUVE', look: 'couve', hp: 950, speed: 3.6, jump: 10, scale: 1,
    color: '#40c040', ai: { aggro: 0.55, block: 0.35, proj: 0.15, low: 0.45, jumpIn: 0.15, up: 0.3, react: 0.32 },
    specials: { proj: 'FOLHA CORTANTE', up: 'MEIA-LUA DE COMPASSO', super: 'RODA DE CAPOEIRA' },
    projColor: 0x40c040, desc: 'Capoeirista do Morro da Conceição. Ginga o tempo todo.',
  },
  vinagrete: {
    name: 'DAMA VINAGRETE', short: 'VINAGRETE', look: 'vinagrete', hp: 900, speed: 4.2, jump: 10.5, scale: 0.95,
    color: '#ff5040', ai: { aggro: 0.7, block: 0.45, proj: 0.3, low: 0.3, jumpIn: 0.2, up: 0.35, react: 0.26 },
    specials: { proj: 'RESPINGO ÁCIDO', up: 'PICADINHO', super: 'SALADA MORTAL' },
    projColor: 0xff4030, desc: 'Rápida e ácida. Corta tudo em cubinhos.',
  },
  torresmo: {
    name: 'TORRESMO', short: 'TORRESMO', look: 'torresmo', hp: 1400, speed: 2.5, jump: 8, scale: 1.3,
    color: '#e0a040', ai: { aggro: 0.6, block: 0.3, proj: 0.1, low: 0.2, jumpIn: 0.05, up: 0.4, react: 0.4 }, armor: true,
    specials: { proj: 'PURURUCA', up: 'CROCÂNCIA', super: 'TORRESMADA' },
    projColor: 0xe0a040, desc: 'Lenta. Pesada. Crocante. Aguenta porrada sem piscar.',
  },
  kwan: {
    name: 'KWAN TOSTADO', short: 'KWAN', look: 'kwanBurnt', hp: 1250, speed: 3.6, jump: 10, scale: 1,
    color: '#a0a0b0', ai: { aggro: 0.65, block: 0.6, proj: 0.35, low: 0.35, jumpIn: 0.2, up: 0.55, react: 0.2 },
    specials: { proj: 'FAROFA NO OLHO', up: 'LIGAÇÃO A COBRAR', super: 'ESQUECIMENTO' },
    projColor: 0xe8c070, desc: 'Sobreviveu aos fogos. Não lembra de quase nada. Lembra de lutar.',
  },
};

DATA3.FIGHTS = [
  { cpu: 'couve', stage: 'lapa', title: 'OITAVAS · ARCOS DA LAPA' },
  { cpu: 'vinagrete', stage: 'selaron', title: 'QUARTAS · ESCADARIA SELARÓN' },
  { cpu: 'torresmo', stage: 'lapa', title: 'SEMIFINAL · ARCOS DA LAPA', rain: true },
  { cpu: 'kwan', stage: 'circo', title: 'GRANDE FINAL · CIRCO VOADOR', forceP1: 'jinlong' },
];

DATA3.TUTORIAL = [
  { text: 'A / D anda · W pula · S agacha', test: 'move', tip: 'Ande pros dois lados e pule.' },
  { text: 'J = SOCO · K = CHUTE', test: 'hit', tip: 'Acerte 4 golpes no Xiǎo Dòu.' },
  { text: 'Segure pra TRÁS pra defender (agachado defende golpe baixo)', test: 'block', tip: 'Defenda 3 golpes.' },
  { text: '↓ ↘ → + J (ou L) = ARROZ-DŌKEN', test: 'proj', tip: 'Solte uma bola de arroz.' },
  { text: '→ ↓ ↘ + J (ou S + L) = DRAGÃO-RYŪKEN', test: 'up', tip: 'Dê um uppercut do dragão.' },
  { text: 'Barra azul cheia: J + K juntos (ou I) = SUPER', test: 'super', tip: 'Solte o PRATO FEITO SUPREMO.' },
];

// ---------------------------------------------------------------------
// MANSÃO DO JOÁ (survival horror)
//  cada sala: tamanho (w x d), câmera fixa, portas, itens, inimigos, móveis
// ---------------------------------------------------------------------
DATA3.ITEMS = {
  revolver: { name: 'Revólver de Arroz', icon: '🔫', desc: 'Calibre parboilizado. 6 tiros por tambor.' },
  ammo: { name: 'Munição de Arroz', icon: '🌾', desc: '+6 grãos de calibre parboilizado.', stack: true },
  boldo: { name: 'Boldo', icon: '🌿', desc: 'Amargo como a vida. Recupera um pouco de saúde.', heal: 35 },
  pimenta: { name: 'Pimenta Biquinho', icon: '🌶', desc: 'Combinada com boldo, cura tudo.' },
  mistura: { name: 'Chá de Boldo com Pimenta', icon: '🍵', desc: 'A receita da vó. Cura tudo.', heal: 100 },
  canja: { name: 'Canja da Lina', icon: '🥣', desc: 'Ainda quente. Como? Cura tudo.', heal: 100 },
  bailarina: { name: 'Bailarina de Jade', icon: '💃', desc: 'Uma bonequinha de jade. Estava dentro do bolo de aniversário.' },
  chave_escritorio: { name: 'Chave do Escritório', icon: '🗝', desc: 'Tem um dragão gravado.' },
  chave_porao: { name: 'Chave do Porão', icon: '🔑', desc: 'Enferrujada. Cheira a farofa.' },
  foto1962: { name: 'Foto de 1962', icon: '🖼', desc: 'Duas crianças num navio. Atrás: "Dashan e Mei. A Mei carregou o grão a viagem toda."' },
  diario: { name: 'Diário da Lina', icon: '📔', desc: '"A tia Mei veio de novo hoje. Ela olha pro Jinlong como quem espera ser lembrada."' },
};

DATA3.ROOMS = {
  jardim: {
    name: 'JARDIM DA MANSÃO', w: 14, d: 10, outside: true, cam: [6.5, 6, 6.5], look: [-1, 0, -1.5],
    floor: 'grass', wall: 'hedge', start: [0, 3.5, Math.PI],
    doors: [{ to: 'hall', x: 0, z: -5, side: 'n', label: 'Porta da mansão' }],
    items: [{ id: 'boldo', x: -5, z: 2 }, { id: 'ammo', x: 5, z: -3 }],
    props: [['fountain', 0, 0], ['tree', -5, -3], ['tree', -5.6, 4], ['statue', 4.5, -3.8]],
    enemies: [],
  },
  hall: {
    name: 'HALL DE ENTRADA', w: 14, d: 12, cam: [-6.4, 7, 5.5], look: [1, 0, -1],
    floor: 'marble', wall: 'burnt', save: [5.5, 4.5],
    doors: [
      { to: 'jardim', x: 0, z: 6, side: 's' }, { to: 'jantar', x: 7, z: 0, side: 'e' },
      { to: 'corredor', x: -2, z: -6, side: 'n', label: 'Escada pro segundo andar' },
      { to: 'escritorio', x: -7, z: 0, side: 'w', lock: 'chave_escritorio', label: 'Escritório do Vovô' },
    ],
    items: [{ id: 'diario', x: 5.5, z: 3.5 }],
    props: [['stairs', -2, -4.5], ['portrait', 3, -5.9], ['chandelier', 0, 0], ['sofa', 3, 2]],
    enemies: [{ type: 'farofeiro', x: 3, z: -3, flag: 'hallAmbush' }],
  },
  jantar: {
    name: 'SALA DE JANTAR', w: 12, d: 9, cam: [5.6, 6.5, 4.2], look: [-1, 0, -1],
    floor: 'wood', wall: 'burnt',
    doors: [{ to: 'hall', x: -6, z: 0, side: 'w' }, { to: 'cozinha', x: 0, z: -4.5, side: 'n' }],
    items: [{ id: 'bailarina', x: 0, z: 0.9, label: 'O bolo de aniversário' }, { id: 'ammo', x: -4.5, z: -3.5 }],
    props: [['table', 0, 0], ['cake', 0, 0], ['cabinet', 5.4, -3.8]],
    enemies: [{ type: 'farofeiro', x: -3, z: 2 }, { type: 'farofeiro', x: 3.5, z: -2.5 }],
  },
  cozinha: {
    name: 'COZINHA', w: 10, d: 8, cam: [-4.6, 6, 3.6], look: [1, 0, -1],
    floor: 'tile', wall: 'tile',
    doors: [{ to: 'jantar', x: 0, z: 4, side: 's' }, { to: 'porao', x: 5, z: -2, side: 'e', lock: 'chave_porao', label: 'Porta do porão' }],
    items: [{ id: 'pimenta', x: -3.5, z: -3 }, { id: 'ammo', x: 3.5, z: 2.8 }],
    props: [['stove', -3.5, -3.6], ['counter', 1.5, -3.6], ['pot', -3.5, -3.6]],
    enemies: [{ type: 'cachorro', x: 2, z: -1 }],
  },
  corredor: {
    name: 'CORREDOR DO SEGUNDO ANDAR', w: 16, d: 5, cam: [-7.6, 5.5, 2.2], look: [1, 0, -0.2],
    floor: 'wood', wall: 'burnt',
    doors: [
      { to: 'hall', x: -4, z: 2.5, side: 's', label: 'Escada pro hall' },
      { to: 'quarto_mimi', x: 3, z: -2.5, side: 'n', label: 'Quarto da Mimi' },
      { to: 'quarto_casal', x: 8, z: 0, side: 'e', label: 'Quarto do casal' },
    ],
    items: [{ id: 'ammo', x: 6.5, z: 1.5 }],
    props: [['window', -1, -2.45], ['window', 6, -2.45], ['vase', -7, -1.8]],
    enemies: [{ type: 'farofeiro', x: 4, z: 0 }],
  },
  quarto_mimi: {
    name: 'QUARTO DA MIMI', w: 9, d: 8, cam: [4, 5.5, 3.6], look: [-1, 0, -1],
    floor: 'pink', wall: 'pink',
    doors: [{ to: 'corredor', x: 0, z: 4, side: 's' }],
    items: [],
    props: [['bed', -2.8, -2.4], ['musicbox', 2.6, -3.4], ['toys', -3, 2]],
    enemies: [],
    puzzle: 'musicbox',
  },
  quarto_casal: {
    name: 'QUARTO DO CASAL', w: 10, d: 8, cam: [-4.6, 5.5, 3.6], look: [1, 0, -1],
    floor: 'wood', wall: 'burnt',
    doors: [{ to: 'corredor', x: -5, z: 0, side: 'w' }],
    items: [{ id: 'canja', x: 3.6, z: -3 }, { id: 'ammo', x: -2, z: 3 }],
    props: [['bigbed', 1, -2.2], ['mirror', 4.9, 1], ['wardrobe', -3.8, -3.4]],
    enemies: [{ type: 'cachorro', x: 3, z: 2, flag: 'casalDog' }],
  },
  escritorio: {
    name: 'ESCRITÓRIO DO VOVÔ', w: 10, d: 8, cam: [4.6, 5.5, 3.6], look: [-1, 0, -1],
    floor: 'wood', wall: 'wood',
    doors: [{ to: 'hall', x: 5, z: 0, side: 'e' }],
    items: [],
    props: [['desk', -1, -2.4], ['safe', -4.2, -3.2], ['books', 2, -3.7], ['plaque', -1, -3.95]],
    enemies: [],
    puzzle: 'safe',
  },
  porao: {
    name: 'PORÃO', w: 14, d: 12, cam: [-6.4, 6.5, 5.4], look: [1, 0, -1],
    floor: 'stone', wall: 'stone', dark: true,
    doors: [],
    items: [],
    props: [['tv', 0, -5.5], ['barrels', 5, -4], ['barrels', -5, -4], ['lab', 4, 3]],
    enemies: [],
    puzzle: 'tv',
  },
};

DATA3.ENEMIES3 = {
  farofeiro: { hp: 45, speed: 0.95, dmg: 14, range: 1.1, cd: 1.5 },
  cachorro: { hp: 28, speed: 4.2, dmg: 9, range: 1.0, cd: 0.9 },
  boss: { hp: 320, speed: 1.5, dmg: 24, range: 1.7, cd: 1.6 },
};

DATA3.HORROR_TEXT = {
  locked: 'Está trancada.',
  plaque: 'Uma placa de bronze: "CHEGAMOS AO RIO NO ANO EM QUE TUDO COMEÇOU." — Huang Dashan',
  safeAsk: 'Um cofre com 4 dígitos.',
  safeWrong: 'Nada acontece. O cofre parece rir de você.',
  safeOk: 'CLIQUE. O cofre abre.',
  musicboxEmpty: 'Uma caixinha de música. Falta a bailarina.',
  musicboxOk: 'Você coloca a bailarina. A caixinha toca uma música que você conhece de algum lugar...',
  cakeText: 'O bolo de aniversário daquela noite. Apodrecido. Tem alguma coisa dura lá dentro.',
  portrait: 'O retrato da família. Queimado. Só dá pra ver as mãos de uma senhora no canto, segurando um prato de pastel.',
  mirror: 'Você no espelho. Por um segundo, a Lina está atrás de você.',
  save: 'Uma panela elétrica de arroz e um radinho tocando pagode baixinho. Salvar o progresso?',
  saved: 'Progresso salvo. O arroz continua quentinho.',
  stairs: 'A escada range.',
};

// ---------------------------------------------------------------------
// CORRIDA — da Mansão do Joá até Copacabana (3 trechos)
// ---------------------------------------------------------------------
DATA3.RACERS = [
  { id: 'jinlong', name: 'JINLONG', vehicle: 'moto', color: 0xffd040, look: 'jinlong', speed: 1.0, player: true },
  { id: 'son', name: 'XIAO DOU', vehicle: 'kombi', color: 0x40c080, look: 'son', speed: 0.985 },
  { id: 'torresmo', name: 'TORRESMO', vehicle: 'foodtruck', color: 0xe0a040, look: 'torresmo', speed: 0.965 },
  { id: 'vinagrete', name: 'VINAGRETE', vehicle: 'patinete', color: 0xff5040, look: 'vinagrete', speed: 1.0 },
  { id: 'couve', name: 'COUVE', vehicle: 'bike', color: 0x40c040, look: 'couve', speed: 0.98 },
  { id: 'kwan', name: 'KWAN (474)', vehicle: 'onibus', color: 0x3a6ad0, look: 'kwanBurnt', speed: 0.95 },
];

DATA3.KART_ITEMS = {
  manga: { name: 'CASCA DE MANGA', icon: '🥭' },
  chinelo: { name: 'CHINELO TELEGUIADO', icon: '🩴' },
  mate: { name: 'TURBO DE MATE', icon: '🧃' },
  farofa: { name: 'BOMBA DE FAROFA', icon: '💥' },
  pombo: { name: 'POMBO DA PRAÇA XV', icon: '🐦' },
  guarda: { name: 'GUARDA-SOL', icon: '⛱' },
};

DATA3.TRACKS = [
  { id: 'niemeyer', name: 'TRECHO 1 · ELEVADO DO JOÁ E AV. NIEMEYER', clock: '23:21', len: 1900, sea: 'left', cliff: true, tunnel: [0.12, 0.2], theme: 'cliff', seed: 3 },
  { id: 'leblon', name: 'TRECHO 2 · LEBLON E IPANEMA', clock: '23:36', len: 2000, sea: 'right', theme: 'beach', seed: 7 },
  { id: 'copa', name: 'TRECHO 3 · ARPOADOR → COPACABANA', clock: '23:49', len: 2100, sea: 'right', theme: 'copa', fireworks: true, seed: 11 },
];

// ---------------------------------------------------------------------
// MÚSICAS (o tema da Mimi aparece na caixinha de música e no final)
//  melodia: [batida, semitom (0 = Dó), duração em batidas]
// ---------------------------------------------------------------------
DATA3.MIMI_THEME = [
  [0, 4, 1], [1, 4, 1], [2, 7, 1], [3, 9, 1], [4, 7, 1], [5, 4, 1], [6, 2, 1], [7, 0, 1],
  [8, 2, 1], [9, 4, 1], [10, 7, 1], [11, 4, 1], [12, 2, 3],
  [16, 4, 1], [17, 4, 1], [18, 7, 1], [19, 9, 1], [20, 12, 1], [21, 9, 1], [22, 7, 1], [23, 4, 1],
  [24, 2, 1], [25, 4, 1], [26, 2, 1], [27, -1, 1], [28, 0, 3],
];

DATA3.SONGS = [
  { id: 'despertar', name: 'PAGODE DO DESPERTAR', artist: 'Jinlong & Xiǎo Dòu', bpm: 104, bars: 40, key: 0, style: 'pagode', battle: false, need: 0.5,
    intro: 'Acorde a praia! Encha a barra da memória acertando as notas.' },
  { id: 'opera', name: 'ÓPERA DO DRAGÃO DOURADO', artist: 'Os Huang vs. Dona Mei', bpm: 138, bars: 52, key: 2, style: 'metal', battle: true,
    intro: 'Batalha! A Dona Mei ataca com farofa. Use o MODO KING SIZE (ESPAÇO) pra contra-atacar.' },
  { id: 'mimi', name: 'A CANÇÃO DA MIMI', artist: 'Todo o Rio de Janeiro', bpm: 96, bars: 56, key: 0, style: 'final', battle: true, final: true,
    intro: 'A última música. Meia-noite chegando.' },
];

// ---------------------------------------------------------------------
// ROTEIRO
// ---------------------------------------------------------------------
DATA3.SCRIPT = {
  prologo: [
    ['NARRADOR', 'Um mês depois. 15 de dezembro. Lapa.'],
    ['NARRADOR', 'Inauguração do "PF DO KING SIZE": o primeiro restaurante da história com arroz dos Huang e feijão das Serpentes no mesmo prato.'],
    ['WELLINGTON', 'Chefe! Chegou a encomenda de 40 quilos de arroz e o seu filho já queimou o primeiro feijão!'],
    ['XIAO DOU', 'Não queimou. Tá "tostadinho". É estilo.'],
    ['JINLONG', 'Wellington, você entrega marmita pra gente há um mês e eu ainda não sei seu sobrenome.'],
    ['WELLINGTON', 'Wellington Flash, motoboy. 47 entregas por dia, zero multas, uma moto que já foi do meu avô. Prazer, King Size.'],
    ['FREGUÊS', 'Moço, me vê um PF com... com... como é que chama aquilo... branco... que fica do lado do feijão...'],
    ['JINLONG', '...Arroz?'],
    ['FREGUÊS', 'ISSO! Nossa. Esqueci. Esqueci a palavra arroz. Que estranho.'],
    ['NARRADOR', 'Na TV do restaurante, o plantão:', 'tv'],
    ['REPÓRTER', 'Plantão: cariocas estão esquecendo coisas. Ontem, 40 mil pessoas esqueceram a própria senha do banco. Hoje, o Maracanã amanheceu sem ninguém lembrar o nome dele.'],
    ['REPÓRTER', 'Especialistas não sabem explicar. Todas as vítimas tinham comido... farofa.'],
    ['XIAO DOU', 'Pai. Olha isso.', 'crumb'],
    ['NARRADOR', 'No fundo de um prato devolvido: farelos de farofa. Brilhando em dourado.'],
    ['JINLONG', '...Dona Mei.'],
    ['NARRADOR', 'A Pastelaria Dragão Feliz está fechada há três semanas. Na porta, um bilhete e um panfleto.', 'flyer'],
    ['NARRADOR', '"Fui ao Torneio. Ninguém sente falta da farofa até ela faltar. — M."'],
    ['NARRADOR', 'O panfleto: "TORNEIO DOS ACOMPANHAMENTOS · Arcos da Lapa · Sábado, meia-noite · Apresentação: RATÃO · Prêmio: uma audiência com A SENHORA DA FAROFA".'],
    ['XIAO DOU', 'Um torneio de luta. Os generais dela vão estar lá. Se a gente vencer, ela tem que aparecer.'],
    ['JINLONG', 'Filho... tem um problema.'],
    ['JINLONG', 'O Grão Dourado explodiu junto com o Tio Kwan. Eu não sou mais King Size.'],
    ['JINLONG', 'E eu passei três dias contando arroz achando que me chamava Zé. Eu não lembro de nenhum golpe de kung fu.'],
    ['XIAO DOU', '...Então eu vou te ensinar. Do jeito que eu aprendi sozinho, te odiando.'],
    ['XIAO DOU', 'Sem ofensa.'],
    ['JINLONG', 'Ofensa total. Vamo pro telhado.'],
  ],
  treinoIntro: [
    ['NARRADOR', 'Telhado do restaurante. Caixa d\'água, antena, a Lapa inteira acesa lá embaixo.'],
    ['XIAO DOU', 'Kung fu é que nem contar arroz, pai. Um grão de cada vez. Um golpe de cada vez.'],
  ],
  treinoMemoria: [
    'Você lembra: seu pai, no quintal, te ensinando a dar o primeiro soco. Você tinha seis anos.',
    'Você lembra: o chute que você deu num poste da Praça XV pra impressionar a Lina. Doeu muito.',
    'Você lembra: "Nunca bata em quem não pode se defender, Jinlong." A voz do seu pai.',
    'Você lembra: o primeiro arroz-dōken. Você queimou a cortina da sala.',
    'Você lembra: o dragão-ryūken que você ensinou pra Mimi. Ela usou no gato.',
    'Você lembra de TUDO.',
  ],
  treinoFim: [
    ['XIAO DOU', '...Tá bom. Você ainda luta como um velho.'],
    ['JINLONG', 'Eu sou um velho.'],
    ['XIAO DOU', 'Um velho que lembra. Isso já é muita coisa nessa cidade.'],
  ],
  torneioIntro: [
    ['NARRADOR', 'Sábado. Meia-noite. Arcos da Lapa. Quatro mil pessoas, um ringue improvisado e um apresentador que você conhece.'],
    ['RATÃO', 'BOA NOITE, LAPA! Bem-vindos ao primeiro, único e completamente ilegal TORNEIO DOS ACOMPANHAMENTOS!'],
    ['PLATEIA', 'RA-TÃO! RA-TÃO! RA-TÃO!'],
    ['RATÃO', 'Hoje: os quatro generais da misteriosa SENHORA DA FAROFA contra... olha só quem voltou pro meu palco... O PAI E O FILHO DO TESTE DE DNA!'],
    ['PLATEIA', 'É O PAI! É O PAI! É O PAI!'],
    ['JINLONG', 'Isso vai me perseguir pro resto da vida.'],
    ['RATÃO', 'As regras: não tem regra! Pode escolher quem luta em cada rodada. Valendo!'],
  ],
  preFight: {
    couve: [
      ['RATÃO', 'Na primeira rodada! Direto do Morro da Conceição! O homem que nunca para de gingar: MESTRE COUVE!'],
      ['MESTRE COUVE', 'Couve é o que dá cor pra feijoada, rapaz. Sem a couve, é só um caldo marrom triste.'],
      ['MESTRE COUVE', 'Me chama de acompanhamento mais uma vez e eu te dou uma meia-lua na cara.'],
    ],
    vinagrete: [
      ['RATÃO', 'Segunda rodada! Ela é ácida! Ela é picadinha! Ela vai no churrasco de todo mundo e ninguém agradece: DAMA VINAGRETE!'],
      ['DAMA VINAGRETE', 'Tomate, cebola, pimentão. Tudo em cubinhos. Do mesmo tamanho. Sabe quanto trabalho dá isso?'],
      ['DAMA VINAGRETE', 'Ninguém sabe. Ninguém nunca perguntou. A Senhora perguntou.'],
    ],
    torresmo: [
      ['RATÃO', 'Semifinal! Debaixo de chuva! Ele pesa 180 quilos de pura crocância: TORRESMO!'],
      ['TORRESMO', '...'],
      ['TORRESMO', 'TORRESMO NÃO FALA. TORRESMO ESTALA.'],
    ],
    kwan: [
      ['RATÃO', 'GRANDE FINAL! No Circo Voador! Ele caiu do céu no Réveillon passado... digo, mês passado... queimado, sem memória e com raiva: KWAN TOSTADO!'],
      ['NARRADOR', 'Ele entra no ringue. Meio rosto queimado. Um tapa-olho. O mesmo hashi de prata.'],
      ['JINLONG', '...Tio Kwan.'],
      ['KWAN TOSTADO', 'Esse nome... eu conheço esse nome? A Senhora disse que eu não tenho nome. Que é melhor assim.'],
      ['KWAN TOSTADO', 'Ela me achou boiando em Copacabana, cheio de pólvora. Me deu pastel. Me deu um lugar. Ninguém mais me deu nada.'],
      ['JINLONG', 'Você me fez contar arroz por três dias. Você abriu o portão do Joá.'],
      ['KWAN TOSTADO', 'Se eu fiz isso... eu não lembro. E você deveria saber melhor que ninguém: quem não lembra não pode pedir desculpa.'],
    ],
  },
  postFight: {
    couve: [
      ['MESTRE COUVE', '...Boa ginga, pai do Teste de DNA.'],
      ['MESTRE COUVE', 'Sabe por que eu luto pra ela? Ela foi a única que lembrou do meu aniversário. Trinta anos de roda e ninguém lembrava.'],
      ['MESTRE COUVE', 'Agora ninguém vai lembrar de nada. Ela diz que é mais justo assim.'],
    ],
    vinagrete: [
      ['DAMA VINAGRETE', 'Você... cortou meu ataque em cubinhos. Do mesmo tamanho.'],
      ['DAMA VINAGRETE', 'Tá. Respeito. Mas presta atenção: a Senhora não quer dinheiro. Ela quer ser lembrada. E ela vai conseguir.'],
    ],
    torresmo: [
      ['TORRESMO', '...'],
      ['TORRESMO', '*crec*'],
      ['RATÃO', 'Ele estalou! Isso quer dizer que ele... respeita você! Eu acho!'],
    ],
    kwan: [
      ['NARRADOR', 'Kwan cai de joelhos. A farofa dourada escapa da roupa dele, grão por grão.'],
      ['KWAN TOSTADO', 'Senhor... eu... eu lembrei uma coisa.'],
      ['KWAN TOSTADO', 'Eu lembro de te dar a primeira bicicleta. Você tinha cinco anos. Você caiu, e não chorou. Eu chorei.'],
      ['KWAN TOSTADO', 'Eu não lembro o que eu fiz depois disso. Mas pelo seu rosto... foi coisa ruim.'],
      ['KWAN TOSTADO', '...Desculpa.'],
      ['JINLONG', 'Onde ela está, Kwan?'],
      ['KWAN TOSTADO', 'Na mansão do Joá. Onde tudo começou. Ela disse que é lá que tudo vai acabar.'],
      ['KWAN TOSTADO', 'Ela vai jogar a farofa nos fogos do Réveillon. Dois milhões de pessoas em Copacabana. Ninguém vai lembrar de nada. De vocês. Do arroz. Do feijão.'],
      ['KWAN TOSTADO', 'Só dela.'],
      ['NARRADOR', 'Os olhos de Kwan ficam vazios. A última memória dele sai como poeira dourada.'],
      ['KWAN TOSTADO', '...Oi. Vocês sabem contar arroz? Eu acho que eu gostava de contar arroz.'],
      ['XIAO DOU', '...Pai. É dia 31. Faltam 6 horas pra meia-noite.'],
    ],
  },
  joaIntro: [
    ['NARRADOR', '31 de dezembro. 22h40. Chove sobre o Joá.'],
    ['NARRADOR', 'A mansão está como naquela noite. Queimada. Em silêncio. Ninguém entrou aqui em seis meses.'],
    ['XIAO DOU', 'Pai... eu não consigo entrar aí.'],
    ['XIAO DOU', 'Eu fiz isso. Eu entrei por esse portão com trinta homens. Eu não consigo.'],
    ['JINLONG', 'Então me espera aqui. E reza.'],
    ['XIAO DOU', 'Pega. Era da minha mãe. (um revólver velho, carregado com... arroz?)'],
    ['XIAO DOU', 'Arroz parboilizado. Ela dizia que é mais duro.'],
    ['NARRADOR', 'CONTROLES: W/S anda · A/D gira · SHIFT corre · segure K (ou botão direito) pra mirar · J (ou clique) atira · E interage · I inventário'],
  ],
  joaTV: [
    ['NARRADOR', 'No fundo do porão, uma TV de tubo liga sozinha. Uma fita VHS. Escrito na etiqueta: "PRO JINLONG".', 'tvon'],
    ['DONA MEI', 'Oi, querido. Se você tá vendo isso, você foi teimoso. Igual ao seu avô.'],
    ['DONA MEI', 'Eu vou te contar uma história que ninguém nunca contou. Porque ninguém nunca lembrou de mim pra contar.'],
    ['DONA MEI', '1962. Um navio de arroz saindo de Cantão. Dois irmãos: Dashan, de doze anos, e Mei, de nove.'],
    ['DONA MEI', 'O Grão Dourado era da nossa mãe. Ela deu pra MIM. Eu carreguei o grão na boca por quarenta e três dias de viagem. Eu.'],
    ['DONA MEI', 'Quando o navio chegou no Rio, o Dashan contou a história pra todo mundo. "Eu cheguei com um grão no bolso." Eu. Eu. Eu.'],
    ['DONA MEI', 'Ele virou o King Size. Eu virei a irmã que frita pastel no SAARA. Sessenta anos fritando pastel pra família que esqueceu o meu nome.'],
    ['DONA MEI', 'Eu traduzi as suas fitas, Jinlong. Eu cobrei o pix. Eu chorei traduzindo. E você nunca me perguntou quem eu era.'],
    ['DONA MEI', 'Então eu fiz a farofa. Farofa absorve tudo. O caldo. O tempero. A memória. Cinco anos no meu forno.'],
    ['DONA MEI', 'Hoje à meia-noite, a farofa vai junto com os fogos de Copacabana. Dois milhões de pessoas vão esquecer o arroz. O feijão. Os Huang. O King Size.'],
    ['DONA MEI', 'E sabe o que vai sobrar? A única coisa que ninguém nunca lembrou de esquecer.'],
    ['DONA MEI', 'A farofa.'],
    ['DONA MEI', 'Feliz Ano Novo, sobrinho. Deixei um amigo pra te fazer companhia.', 'boss'],
  ],
  joaFim: [
    ['NARRADOR', 'O Farofeiro-Mor desmorona num monte de farofa fumegante. O porão começa a pegar fogo.'],
    ['NARRADOR', 'Você corre. Escada, hall, jardim. Atrás de você, a mansão do Joá desaba de vez.'],
    ['XIAO DOU', 'PAI!'],
    ['JINLONG', 'A tia Mei. A Dona Mei é a minha tia-avó. Ela carregou o grão. Ela...'],
    ['JINLONG', 'Ela vai apagar a memória do Rio inteiro à meia-noite.'],
    ['NARRADOR', 'VRRRRRUUUUMMMM. Faróis no portão.', 'moto'],
    ['WELLINGTON', 'CHEFE! 23h15! A Niemeyer tá parada de ponta a ponta! Carro não chega em Copacabana antes de 2027!'],
    ['WELLINGTON', 'Só de moto. A minha é sua. A Kombi da feijoada é do seu filho. Eu vou de garupa e rezando.'],
    ['NARRADOR', 'No retrovisor: faróis. Um food truck, um patinete, uma bicicleta laranja... e um ônibus 474.'],
    ['XIAO DOU', 'Os generais. Ela mandou eles atrás da gente.'],
    ['JINLONG', 'Então que vença o melhor motoboy.'],
  ],
  raceIntro: [
    'CONTROLES: W acelera · S freia · A/D vira · SHIFT (segurando na curva) = DERRAPAGEM com turbo · E usa item · Chegue em 1º, 2º ou 3º!',
  ],
  raceBetween: [
    [
      ['VINAGRETE', 'Por que vocês tão correndo tanto? É só esquecer! Esquecer não dói!'],
      ['XIAO DOU', 'Dói sim! Eu esqueci que tinha pai por vinte anos!'],
    ],
    [
      ['KWAN (474)', 'PRÓXIMA PARADA: ...eu não sei! Alguém sabe pra onde esse ônibus vai?!'],
      ['WELLINGTON', 'O 474 nunca soube, tio!'],
      ['MESTRE COUVE', '...Ei. Eu lembro de você, Jinlong. Você me pagou uma água de coco na Lapa uma vez. Por que eu tô correndo contra você?'],
    ],
  ],
  raceFim: [
    ['NARRADOR', '23h50. Avenida Atlântica. Dois milhões de pessoas de branco na areia.'],
    ['NARRADOR', 'Ninguém fala. Ninguém pula onda. Ninguém sabe por que está ali. A farofa já está no ar.'],
    ['NARRADOR', 'Os generais freiam do seu lado. Um por um.'],
    ['MESTRE COUVE', 'A gente lembrou. Na corrida. Vocês correndo, a gente lembrou de tudo que ela quer apagar.'],
    ['DAMA VINAGRETE', 'Ela tá errada. Ser esquecida é horrível. Mas fazer todo mundo esquecer... é pior.'],
    ['TORRESMO', '*CREC* (Torresmo está com vocês.)'],
    ['KWAN TOSTADO', 'Eu não lembro de quase nada. Mas eu sei tocar erhu. Isso eu nunca esqueci.'],
    ['NARRADOR', 'No mar, sobre uma balsa de fogos gigante, uma frigideira do tamanho de uma piscina. Em cima dela, tostando a farofa dourada: Dona Mei.'],
    ['DONA MEI', '(no megafone) Boa noite, Rio de Janeiro! Nove minutos pro ano novo! Nove minutos pra vocês esquecerem tudo!'],
    ['JINLONG', 'O palco do Réveillon. Tá vazio. Os cantores esqueceram as músicas.'],
    ['XIAO DOU', 'Pai. Memória mora em música. Igual àquelas fitas.'],
    ['JINLONG', '...Wellington, você toca alguma coisa?'],
    ['WELLINGTON', 'Pandeiro, cavaco, surdo e flauta doce. Motoboy é multiinstrumentista.'],
    ['JINLONG', 'Então sobe. Todo mundo sobe. A gente vai fazer o Rio lembrar.'],
  ],
  songIntro: [
    [
      ['NARRADOR', 'Primeira música. A praia está parada. Dois milhões de olhos vazios.'],
      ['JINLONG', 'Um, dois, três... PAGODE!'],
    ],
    [
      ['NARRADOR', 'A praia acorda. As pessoas começam a cantar. No mar, a frigideira gira na sua direção.'],
      ['DONA MEI', 'Música? MÚSICA? Eu ensinei ópera chinesa pra metade do SAARA! Vocês querem batalha? TOMA BATALHA!'],
    ],
    [
      ['DONA MEI', 'Sessenta anos fritando pastel pra uma família que esqueceu meu nome! SESSENTA ANOS!'],
      ['JINLONG', '(tira uma foto molhada do bolso) "Huang Mei. Nove anos. Carregou o grão a viagem toda."'],
      ['JINLONG', 'Eu não esqueci, tia. Não mais.'],
      ['DONA MEI', '...Tarde demais. 23h59. A farofa já está nos fogos.'],
      ['XIAO DOU', 'Pai. A música da caixinha. A música da Mimi.'],
      ['NARRADOR', 'Você começa a tocar. Uma voz de criança canta junto. Não é ninguém do palco.', 'ghosts'],
    ],
  ],
  final: [
    ['NARRADOR', '10... 9... 8... A praia inteira conta junto.'],
    ['NARRADOR', '3... 2... 1...'],
    ['NARRADOR', 'Os fogos explodem. A farofa dourada sobe junto, sobre dois milhões de pessoas.', 'fogos'],
    ['NARRADOR', 'Mas a farofa absorve tudo. O caldo. O tempero. A memória.'],
    ['NARRADOR', 'E naquela noite, o que ela absorveu foi uma música inteira. Dois milhões de vozes cantando a mesma lembrança.'],
    ['NARRADOR', 'A farofa não apaga nada. Ela devolve. O céu de Copacabana se enche de memórias.', 'memorias'],
    ['DONA MEI', '...Eles estão lembrando.'],
    ['DONA MEI', 'Eles estão lembrando... de mim?'],
    ['NARRADOR', 'No céu, entre o 金 e o 豆, aparece um terceiro ideograma. 梅. Mei.'],
  ],
  epilogo: [
    ['NARRADOR', '1º de janeiro. 06h00. Copacabana.'],
    ['NARRADOR', 'Dona Mei está sentada na areia, olhando o mar. Os fogos acabaram. A farofa acabou.'],
    ['JINLONG', 'Tia.'],
    ['DONA MEI', 'Eu ia apagar vocês. Todos vocês. Por que você trouxe café da manhã?'],
    ['JINLONG', 'Porque o prato não tá completo sem você.'],
    ['NARRADOR', 'Ele abre a marmita. Arroz. Feijão. E farofa.'],
    ['XIAO DOU', 'O Pacto do Prato Feito, versão 2027. Arroz dos Huang. Feijão das Serpentes. E farofa da tia Mei.'],
    ['DONA MEI', '...Vocês são uns bobos. Iguaizinhos ao Dashan.'],
    ['DONA MEI', '(come uma garfada, chorando) ...Tá sem sal.'],
    ['WELLINGTON', 'Isso é amor, Dona Mei.'],
    ['DONA MEI', '...'],
    ['DONA MEI', 'E o ovo?'],
    ['JINLONG', 'NÃO.'],
  ],
  epilogo2: [
    ['NARRADOR', 'Três meses depois. Lapa.'],
    ['NARRADOR', 'Na fachada: "PF DOURADO · ARROZ · FEIJÃO · FAROFA · DESDE 1962". Embaixo, em letra menor: 黄梅.'],
    ['NARRADOR', 'Mestre Couve dá aula de capoeira no segundo andar. A Dama Vinagrete cuida das saladas. O Torresmo é segurança. Ele ainda não fala.'],
    ['NARRADOR', 'O Wellington virou sócio. A moto do avô dele está pendurada na parede, como troféu.'],
    ['NARRADOR', 'O Kwan conta arroz na cozinha. Todo dia. Ele é feliz. Às vezes ele pede desculpas sem saber pelo quê.'],
    ['NARRADOR', 'E toda noite, quando o restaurante fecha, Jinlong, Xiǎo Dòu e a tia Mei sentam na calçada e contam alguma história antiga.'],
    ['NARRADOR', 'Pra ninguém esquecer.'],
  ],
};

DATA3.CREDITS = [
  ['ARROZ DOURADO', 'big'],
  ['A TRILOGIA', ''],
  ['ATO I: O FERIADÃO · ATO II: A VINGANÇA DO REI COBRA · ATO III: A FAROFA DE OURO', ''],
  ['', ''],
  ['IDEIA ORIGINAL E DIREÇÃO', 'h'], ['Murilo', ''],
  ['JOGO, CÓDIGO, MÚSICA SINTETIZADA E MUITO POLÍGONO', 'h'], ['Claude', ''],
  ['', ''],
  ['ELENCO', 'h'],
  ['Huang Jinlong · o King Size que contava arroz', ''],
  ['Xiǎo Dòu · o filho, o feijãozinho', ''],
  ['Huang Mei · a Dona Mei · a farofa que ninguém lembrava', ''],
  ['Wellington Flash · motoboy, multiinstrumentista', ''],
  ['Kwan · o telefone, o tostado, o contador de arroz', ''],
  ['Mestre Couve · Dama Vinagrete · Torresmo', ''],
  ['Ratão · ele mesmo, sempre', ''],
  ['Lina e Mimi · que cantaram no final', ''],
  ['', ''],
  ['LOCAÇÕES', 'h'],
  ['Gamboa · SAARA · Niterói · Lapa · Escadaria Selarón · Circo Voador', ''],
  ['Joá · Av. Niemeyer · Leblon · Ipanema · Arpoador · Copacabana', ''],
  ['', ''],
  ['NENHUMA FAROFA FOI DESPERDIÇADA', 'h'],
  ['O ônibus 474 continua sem saber pra onde vai', ''],
  ['', ''],
  ['OBRIGADO POR LEMBRAR', 'big'],
];

if (typeof module !== 'undefined') module.exports = DATA3;
