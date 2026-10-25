// =====================================================================
//  ARROZ DOURADO — ATO II: A VINGANÇA DO REI COBRA (dados e roteiro)
// =====================================================================

const DATA2 = {};

// ---------------------------------------------------------------------
// MANSÃO DO REI COBRA (Niterói) — cada caractere é um bloco de 4x4m
//  # parede (papel de parede vermelho)   % azulejo português (cozinha)
//  & madeira e jade (mahjong)            @ mármore dourado (trono)
//  D porta do trono (3 chaves)           B Rei Cobra    P você
//  1 2 3 chaves    g capanga   c cozinheiro   n ninja
//  + marmita (vida)   r saco de arroz (munição)   $ grana   o vaso   ~ piscina
// ---------------------------------------------------------------------
DATA2.MAP = [
  '###############################',
  '#########@@@@@@@@@@@@@#########',
  '#%%%%%%%#@...........@#&&&&&&&#',
  '#%..+..%#@.....B.....@#&..$..&#',
  '#%.c...%#@...........@#&..n..&#',
  '#%.....%#@...........@#&.....&#',
  '#%%.%%%%#@@@@@@D@@@@@@#&&&.&&&#',
  '#%...g.%#######.#######&..g..&#',
  '#%.%%%.%#.............#&.&&&.&#',
  '#%.%1%.%#..g.......g..#&.&2&.&#',
  '#%.%.%.%#.............#&.&.&.&#',
  '#%.....%#....#####....#&.....&#',
  '#%%%.%%%#....#.$.#....#&&&.&&&#',
  '#.......#..o.#...#.o..#.......#',
  '#.c.......................n.c.#',
  '#.......#.............#.......#',
  '####.####.....g.g.....####.####',
  '#.....+#...............#+.....#',
  '#.r....#####.#####.#####....r.#',
  '#..g...#...#.......#...#..g...#',
  '#......#.n.#.......#.n.#......#',
  '###.####...####.####...####.###',
  '#......#.......+.......#..$...#',
  '#.~~~~.#.g...........g.#.~~~~.#',
  '#.~~~~...................~~3~.#',
  '#.~~~~.#...............#.~~~~.#',
  '#......#####.......#####......#',
  '#......#.......P.......#......#',
  '#..n...#...............#...g..#',
  '#......#...o.......o...#......#',
  '###############################',
];

DATA2.ZONES = [
  { name: 'SALA DO TRONO', x0: 9, x1: 21, y0: 1, y1: 6 },
  { name: 'COZINHA DA FEIJOADA', x0: 1, x1: 8, y0: 2, y1: 12 },
  { name: 'SALÃO DE MAHJONG', x0: 22, x1: 29, y0: 2, y1: 12 },
  { name: 'HALL DAS SERPENTES', x0: 9, x1: 21, y0: 7, y1: 15 },
  { name: 'CORREDOR DOS VASOS', x0: 0, x1: 30, y0: 13, y1: 21 },
  { name: 'PISCINA DAS COBRAS', x0: 0, x1: 30, y0: 22, y1: 25 },
  { name: 'ENTRADA DA MANSÃO', x0: 0, x1: 30, y0: 26, y1: 29 },
];

DATA2.KEYS = {
  1: { name: 'CHAVE DE JADE', color: 0x30c070, css: '#30c070' },
  2: { name: 'CHAVE DE MARFIM', color: 0xf0ead0, css: '#f0ead0' },
  3: { name: 'CHAVE DE BRONZE', color: 0xc07030, css: '#c07030' },
};

// ---------------------------------------------------------------------
// INIMIGOS
// ---------------------------------------------------------------------
DATA2.ENEMIES = {
  g: { name: 'Capanga', hp: 30, speed: 3.4, range: 22, cd: 1.6, shot: { n: 1, spread: 0, dmg: 6, speed: 15 }, drop: [40, 80], ks: 12, look: 'capanga' },
  c: { name: 'Cozinheiro', hp: 110, speed: 2.0, range: 16, cd: 2.3, shot: { n: 4, spread: 0.22, dmg: 4, speed: 12, lob: true }, drop: [120, 170], ks: 22, look: 'chef', scale: 1.2 },
  n: { name: 'Ninja Serpente', hp: 22, speed: 7.2, range: 2.0, cd: 0.9, melee: 9, drop: [60, 90], ks: 15, look: 'ninja' },
};

// ---------------------------------------------------------------------
// ARMAS DE ARROZ (compradas na ordem, no Zap do Tio Kwan)
// ---------------------------------------------------------------------
DATA2.WEAPONS = [
  { id: 'mao', name: 'PUNHADO DE ARROZ', cost: 0, rate: 2.6, pellets: 4, spread: 0.07, dmg: 5, speed: 32, ammo: 0, grav: 5,
    desc: 'Arroz cru na mão. Como em casamento.' },
  { id: 'estilingue', name: 'ESTILINGUE DE BAMBU', cost: 150, rate: 3.2, pellets: 1, spread: 0.01, dmg: 22, speed: 60, ammo: 0,
    desc: 'Um grão por vez, na testa. Munição infinita.' },
  { id: 'doze', name: 'DOZE DE ARROZ', cost: 500, rate: 1.3, pellets: 10, spread: 0.1, dmg: 9, speed: 65, ammo: 1,
    desc: 'Escopeta de cano duplo de bambu. 10 grãos por tiro.' },
  { id: 'matic', name: 'ARROZ-MATIC DO CAMELÔ', cost: 1100, rate: 11, pellets: 1, spread: 0.035, dmg: 10, speed: 75, ammo: 1,
    desc: 'Metralhadora Xing Ling. Garantia de 3 dias. Igual ao feriado.' },
  { id: 'bazuca', name: 'BAZUCA DE BOLINHO DE ARROZ', cost: 1800, rate: 1.1, pellets: 1, spread: 0, dmg: 40, speed: 28, ammo: 4, explode: { r: 4.5, dmg: 90 },
    desc: 'Bolinho de arroz da vó com recheio de pólvora. Explode.' },
  { id: 'panela', name: 'PANELA DE PRESSÃO GATLING 9000', cost: 2600, rate: 20, pellets: 2, spread: 0.05, dmg: 11, speed: 85, ammo: 0.5, explode: { r: 1.6, dmg: 12 },
    desc: 'Seis canos giratórios movidos a pressão. Apita quando atira. A ARMA DEFINITIVA.' },
];

DATA2.SHOP = [
  { id: 'marmita', name: 'Marmita da Dona Mei', desc: '+50 de vida. Arroz, feijão, ovo e farofa.', cost: 120, repeat: true },
  { id: 'municao', name: 'Recarga: 100 grãos', desc: 'Munição pras armas que gastam arroz.', cost: 80, repeat: true },
  { id: 'saco', name: 'Saco de 5kg nas costas', desc: 'Munição máxima +150 (e enche tudo).', cost: 400 },
  { id: 'havaianas', name: 'Havaianas Turbo', desc: '+20% de velocidade. As que não soltam a tira.', cost: 600 },
  { id: 'colete', name: 'Colete de Sacas de Arroz', desc: 'Vida máxima +50.', cost: 900 },
  { id: 'tempero', name: 'Tempero Baiano da Vó', desc: '+30% de dano em tudo. Arde no olho.', cost: 1500 },
];

// ---------------------------------------------------------------------
// ROTEIRO
// ---------------------------------------------------------------------
DATA2.SCRIPT = {
  balsa1: [
    ['NARRADOR', 'Baía de Guanabara. 23h47. A última barca pra Niterói.'],
    ['NARRADOR', 'Três passageiros: você, Tio Kwan e um saco de arroz de 5kg.'],
    ['TIO KWAN', 'O senhor quer saber quem ele é. O Rei Cobra.'],
    ['JINLONG', 'Eu quero saber por que ele matou a minha família.'],
    ['TIO KWAN', 'Ninguém nunca viu o rosto dele. Usa uma máscara de jade em forma de cobra. Apareceu em Macau há vinte anos, do nada.'],
    ['TIO KWAN', 'Em 1962 o seu avô fez um pacto com as Serpentes: o arroz é dos Huang, o feijão é das Serpentes. Arroz e feijão, lado a lado, no prato de todo brasileiro.'],
    ['TIO KWAN', 'Sessenta anos de paz. O Pacto do Prato Feito.'],
    ['TIO KWAN', 'O Rei Cobra rasgou o pacto. Ele não quer metade do prato. Ele quer o PRATO INTEIRO.'],
    ['TIO KWAN', 'Comprou a polícia de Niterói, metade da Câmara e todos os nossos homens. Trezentos capangas. Cozinheiros treinados em Macau. Ninjas.'],
    ['JINLONG', 'E nós?'],
    ['TIO KWAN', 'Nós somos dois. Um velho e um homem que até ontem achava que se chamava Zé.'],
    ['TIO KWAN', '...E o grão.'],
    ['NARRADOR', 'Você abre a mão. O Grão Dourado pulsa, quente, como um coração.'],
    ['TIO KWAN', 'O poder do King Size, senhor. Quando o grão escolhe alguém, um homem vale um exército. Mas o grão só acorda quando o sangue ferve.'],
    ['TIO KWAN', 'Derrube os homens dele. A raiva vai enchendo o senhor. Quando estiver cheio... deixe o grão falar.'],
    ['TIO KWAN', 'Até lá...  (ele te entrega um saco de arroz)  ...taca arroz neles.'],
    ['JINLONG', '...Arroz.'],
    ['TIO KWAN', 'O senhor era o maior lançador de arroz do Rio. Em casamento. Uma lenda.'],
    ['NARRADOR', 'A barca encosta em Niterói. No alto do morro, iluminada por lanternas vermelhas: a Mansão do Rei Cobra.'],
  ],
  mansionIntro: [
    ['TIO KWAN', 'Eu espero o senhor na barca. Qualquer coisa, me manda um Zap que eu peço pro motoboy levar. (aperte B)'],
    ['NARRADOR', 'A porta do trono tem três fechaduras. Jade. Marfim. Bronze.'],
  ],
  doorLocked: 'A porta do trono tem três fechaduras: Jade, Marfim e Bronze.',
  boss1Intro: [
    ['NARRADOR', 'A porta se fecha atrás de você. No trono, uma figura de manto vermelho e máscara de jade.'],
    ['REI COBRA', 'Huang Jinlong. Finalmente lembrou do próprio nome.'],
    ['REI COBRA', 'Eu esperei vinte anos por esse jantar.'],
    ['JINLONG', 'Você vai pagar pelo Joá.'],
    ['REI COBRA', 'Pagar? Quem tem uma dívida comigo é você, King Size. E eu vim cobrar.'],
    ['REI COBRA', 'PROVA O MEU FEIJÃO!'],
  ],
  boss1Defeat: [
    ['NARRADOR', 'O Rei Cobra cai de joelhos. A máscara de jade racha.'],
    ['JINLONG', 'Por quê? Por que a minha família? A Lina... a Mimi... o meu pai...'],
    ['REI COBRA', '...Você quer ver o rosto de quem fez isso?'],
    ['NARRADOR', 'Ele tira a máscara.', 'unmask'],
    ['NARRADOR', 'É um rapaz. Uns vinte anos. Ele tem os seus olhos. O seu nariz. A sua cara de quem conta arroz.'],
    ['REI COBRA', 'Eu sou seu filho, pai.'],
    ['JINLONG', 'O QUÊ?!'],
    ['REI COBRA', 'A minha mãe era cozinheira na sua mansão. Você foi embora pra viver a sua vida de luxo de King Size e nunca mais olhou pra trás.'],
    ['REI COBRA', 'Ela me criou sozinha numa quitinete em São Gonçalo, vendendo feijoada na rua. Morreu achando que um dia você ia voltar.'],
    ['REI COBRA', 'Eu passei a vida inteira treinando pra te derrotar. Kung fu em Macau. Feijão em Minas. Ódio em São Gonçalo.'],
    ['REI COBRA', 'Você tinha uma família nova. Eu queria que você soubesse como é perder uma.'],
    ['JINLONG', '...'],
    ['JINLONG', 'Ah, mas você não é meu filho.'],
  ],
  ratao: [
    ['NARRADOR', '♪ PAN-PAN-PAN-PAAAAN ♪'],
    ['RATÃO', 'BOA NOITE, BRASIL! Tá começando mais um TESTE DE DNA no PROGRAMA DO RATÃO!'],
    ['PLATEIA', 'RA-TÃO! RA-TÃO! RA-TÃO!'],
    ['RATÃO', 'Hoje no palco, de um lado: o chefão da máfia do ARROZ, que diz que NÃO é o pai!'],
    ['PLATEIA', 'UUUUUUUUUUH!'],
    ['RATÃO', 'Do outro lado: o chefão da máfia do FEIJÃO, que diz que É o filho!'],
    ['PLATEIA', 'AAAAAAAAAH!'],
    ['JINLONG', 'Como é que a gente veio parar aqui?'],
    ['REI COBRA', 'Pegamos a barca, pai.'],
    ['RATÃO', 'Sem conversinha no meu palco! Produção, traz o envelope!'],
    ['NARRADOR', 'Na terceira fila, Tio Kwan come pipoca. Do lado dele, Dona Mei filma tudo com o celular na vertical.'],
    ['RATÃO', 'O resultado do exame, feito pelo Laboratório Feijão com Arroz de Niterói, é...'],
    ['NARRADOR', '♪ trrrrrrrrrrrrrrrrrrrr ♪  (rufar de tambores)', 'drum'],
    ['RATÃO', '99,9%... POSITIVO!!! É O PAI!!! É O PAAAAAI!!!', 'reveal'],
    ['PLATEIA', 'É O PAI! É O PAI! É O PAI!'],
    ['JINLONG', 'E esses 0,1%?'],
    ['RATÃO', 'Aqui diz... "feijão".'],
    ['REI COBRA', 'PAAAAAAAI!'],
    ['RATÃO', 'Pai que é pai ASSUME, meu filho! Dá um abraço nesse menino!'],
    ['NARRADOR', 'Vocês se abraçam. Duros. Desconfortáveis. A plateia vai à loucura. Dona Mei chora no celular.', 'hug'],
    ['RATÃO', 'Voltamos depois dos comerciais! Arroz Dragão Dourado: o arroz que É O PAI!'],
  ],
  balsa2: [
    ['NARRADOR', '01h12. A barca pra Niterói. De novo.'],
    ['NARRADOR', 'Três passageiros: você, Tio Kwan e o seu filho. Ninguém fala nada por onze minutos.'],
    ['JINLONG', '...Então.'],
    ['REI COBRA', 'Então.'],
    ['JINLONG', 'Você... gosta de arroz?'],
    ['REI COBRA', 'Prefiro feijão.'],
    ['JINLONG', 'Sabia.'],
    ['TIO KWAN', 'Vocês querem que eu sente em outro banco?'],
    ['OS DOIS', 'NÃO.'],
    ['JINLONG', 'Qual é o seu nome? O de verdade.'],
    ['REI COBRA', 'Xiǎo Dòu. 小豆. Feijãozinho. Foi a minha mãe que escolheu.'],
    ['JINLONG', '...É um nome bonito, filho.'],
    ['XIAO DOU', '...Valeu, pai.'],
  ],
  boss2Intro: [
    ['NARRADOR', 'Sala do trono. De volta. Ninguém sabe muito bem por que voltaram pra cá.'],
    ['XIAO DOU', 'Pai. Tem uma coisa que eu preciso te contar.'],
    ['XIAO DOU', 'Esses anos todos eu pesquisei um jeito de vencer você. Um homem normal não derrota um King Size. Ninguém derrota.'],
    ['XIAO DOU', 'Então eu criei o meu. Num laboratório em Minas Gerais. Cinco anos. Três explosões. Um vizinho processando.'],
    ['NARRADOR', 'Ele tira um grão do bolso. Escuro, mas brilhando em dourado. Um grão de FEIJÃO.', 'bean'],
    ['XIAO DOU', 'O Feijão Dourado. Artificial. Instável. Eu nunca tive coragem de usar.'],
    ['XIAO DOU', 'Mas o teste deu 99,9%, pai. Eu preciso saber se eu mereço o seu sangue.'],
    ['XIAO DOU', 'LUTA COMIGO. DE VERDADE. KING SIZE CONTRA KING SIZE.'],
    ['NARRADOR', 'Ele engole o feijão. O chão treme. Uma aura marrom e roxa explode ao redor dele.', 'fakeKS'],
    ['XIAO DOU', 'AAAAAAAAAAAAAAH!!!'],
    ['JINLONG', '...Tá bom, filho.'],
    ['NARRADOR', 'Você coloca o Grão Dourado debaixo da língua. Como naquela noite.'],
    ['NARRADOR', 'Seu sangue ferve. Ouro líquido. KING SIZE.', 'ks'],
  ],
  boss2Defeat: [
    ['NARRADOR', 'Xiǎo Dòu cai. A aura se apaga. O Feijão Dourado escapa dele e flutua no ar, girando.', 'grains'],
    ['NARRADOR', 'O seu Grão Dourado sai também, sozinho, e flutua do lado do feijão. Como se os dois já se conhecessem.'],
    ['XIAO DOU', '...Eu perdi.'],
    ['JINLONG', 'Não. Você lutou como um Huang.'],
    ['JINLONG', 'Eu não sabia que você existia, filho. Se eu soubesse...'],
    ['XIAO DOU', 'A mãe nunca contou. Quem me contou foi um velho, no enterro dela.'],
    ['JINLONG', 'Que velho?'],
    ['NARRADOR', '* clap... clap... clap... *', 'clap'],
    ['TIO KWAN', 'Eu.', 'kwan'],
    ['NARRADOR', 'Tio Kwan sai das sombras, com um hashi de prata na mão.'],
    ['TIO KWAN', 'Que cena bonita. Pai e filho. Arroz e feijão.'],
    ['TIO KWAN', 'Sessenta anos eu servi a família Huang. Contei o arroz do seu avô. Contei o arroz do seu pai. Contei o SEU arroz. Nunca o meu.'],
    ['TIO KWAN', 'Fui eu que contei pro menino quem era o pai dele. Fui eu que paguei o laboratório em Minas.'],
    ['TIO KWAN', 'E fui eu que abri o portão do Joá naquela noite.'],
    ['XIAO DOU', 'Você me disse que a casa ia estar vazia...'],
    ['TIO KWAN', 'Eu digo muita coisa. Eu liguei pro seu pai todo dia, lembra? "Conta o arroz, Zé." Eu sou ótimo no telefone.'],
    ['TIO KWAN', 'Eu precisava de dois King Size se matando. E agora sobraram dois grãos... e nenhum dono.'],
    ['NARRADOR', 'Com o hashi, Tio Kwan pega o Grão Dourado e o Feijão Dourado no ar. E engole os dois.', 'swallow'],
    ['TIO KWAN', 'ARROZ... COM... FEIJÃO. O PRATO COMPLETO!!!', 'grow'],
    ['TIO KWAN', 'EU SOU O KING SIZE SUPREMO! O PRATO FEITO! A REFEIÇÃO COMPLETA!'],
    ['XIAO DOU', 'Pai... a gente não tem mais os grãos.'],
    ['JINLONG', 'A gente nunca precisou, filho. O grão nunca foi o poder.'],
    ['JINLONG', 'O poder é a família. Arroz e feijão. Juntos.', 'glow'],
    ['XIAO DOU', '...Isso foi muito brega, pai.'],
    ['JINLONG', 'Eu sei. SOCA ELE COMIGO.'],
  ],
  launch: [
    ['NARRADOR', 'Naquela noite, o Rio de Janeiro teve um segundo Réveillon.'],
  ],
  dawn: [
    ['NARRADOR', '05h40. A primeira barca do dia.'],
    ['NARRADOR', 'Dois passageiros. E a Dona Mei, que apareceu com marmitas.'],
    ['DONA MEI', 'Arroz, feijão, ovo e farofa. Prato feito. Comam, que vocês tão magros.'],
    ['XIAO DOU', 'Pai... quantos grãos de arroz tem nesse prato?'],
    ['NARRADOR', 'Você olha pro prato. Pela primeira vez em três dias, não dá vontade de contar.'],
    ['JINLONG', 'Não sei, filho.'],
    ['JINLONG', 'E não quero saber.'],
  ],
  stinger: [
    ['NARRADOR', 'Pastelaria Dragão Feliz. SAARA. 03h00 da manhã.'],
    ['NARRADOR', 'Dona Mei abre a gaveta do caixa. Embaixo das notas de dois reais, alguma coisa brilha.'],
    ['DONA MEI', 'Arroz. Feijão. Coitados. Acharam que o prato tava completo.'],
    ['NARRADOR', 'Um grão de FAROFA. Dourado.'],
    ['DONA MEI', 'Ninguém nunca lembra da farofa.'],
  ],
};

DATA2.CREDITS = [
  ['ARROZ DOURADO', 'big'],
  ['ATO I: O FERIADÃO · ATO II: A VINGANÇA DO REI COBRA', ''],
  ['', ''],
  ['IDEIA ORIGINAL', 'h'], ['Murilo', ''],
  ['JOGO, CÓDIGO E BAIXA RESOLUÇÃO', 'h'], ['Claude', ''],
  ['', ''],
  ['ELENCO', 'h'],
  ['Huang Jinlong · KING SIZE', ''], ['Xiǎo Dòu · Rei Cobra · Feijãozinho', ''], ['Tio Kwan · o telefone', ''],
  ['Dona Mei · a farofa', ''], ['Ratão · ele mesmo', ''], ['Os Pombos da Praça XV · eles mesmos', ''],
  ['', ''],
  ['NENHUM GRÃO DE ARROZ FOI FERIDO', 'h'], ['(mentira: foram uns 22 milhões)', ''],
  ['', ''],
  ['GRAVADO NA GAMBOA, EM NITERÓI', 'h'], ['E NUMA BARCA QUE FEZ A MESMA VIAGEM 4 VEZES', ''],
  ['', ''],
  ['AGRADECIMENTOS', 'h'], ['Biscoito Globo · Mate de galão · Havaianas', ''], ['O Camelódromo da Uruguaiana', ''], ['Toda tia que já levou marmita pra alguém', ''],
  ['', ''],
  ['OBRIGADO POR JOGAR', 'big'],
];

if (typeof module !== 'undefined') module.exports = DATA2;
