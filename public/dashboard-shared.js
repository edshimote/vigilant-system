
(function(){
  const nullProxy = new Proxy(function(){}, {
    get(target, prop){
      if (prop === Symbol.iterator) return function*(){};
      if (prop === 'style') return new Proxy({}, { get(){ return ''; }, set(){ return true; } });
      if (prop === 'classList') return { add(){}, remove(){}, toggle(){ return false; }, contains(){ return false; } };
      if (prop === 'dataset') return {};
      if (prop === 'options') return [];
      if (prop === 'children') return [];
      if (prop === 'value') return '';
      if (prop === 'checked') return false;
      if (prop === 'disabled') return false;
      if (prop === 'innerHTML' || prop === 'textContent' || prop === 'innerText') return '';
      return nullProxy;
    },
    set(){ return true; },
    apply(){ return nullProxy; }
  });

  const originalGet = document.getElementById.bind(document);
  document.getElementById = (id) => originalGet(id) || nullProxy;

  const originalQS = document.querySelector.bind(document);
  document.querySelector = (selector) => originalQS(selector) || nullProxy;
})();


    const baseModules = [
      {
        id: "presence",
        number: 1,
        title: "Fundamentos da Presença",
        short: "Primeira impressão",
        level: "essencial",
        duration: "18 min",
        summary: "Ensina a organizar energia, postura, leitura visual e primeira percepção para a pessoa parecer mais alinhada no primeiro contato.",
        why: "Este pilar organiza o básico invisível que muda como você é percebido: postura, leitura do ambiente, intenção, linguagem corporal e coerência entre presença e imagem.",
        questions: [
          "O que a sua presença comunica antes mesmo de você falar?",
          "Você entra em espaços com intenção ou só aparece neles?",
          "Seu rosto, postura e ritmo passam clareza ou ruído?"
        ],
        checklist: [
          "Ajustar postura e eixo do corpo em pé e sentado(a).",
          "Definir como você quer ser percebido(a) no primeiro contato.",
          "Escolher um gesto de presença para repetir todos os dias."
        ],
        action: "Hoje, grave 15 segundos entrando, sentando e olhando para a câmera. Observe se sua presença parece alinhada com a imagem que você quer transmitir."
      },
      {
        id: "care",
        number: 2,
        title: "Autocuidado de Alto Nível",
        short: "Imagem mais limpa",
        level: "base",
        duration: "24 min",
        summary: "Transforma autocuidado em sistema: pele, cabelo, higiene, manutenção e rotina mínima que realmente se sustenta.",
        why: "Autocuidado premium não é excesso; é consistência. O foco aqui é deixar sua imagem mais limpa, bem mantida e confiável sem criar uma rotina impossível.",
        questions: [
          "Seu autocuidado atual depende de motivação ou já virou sistema?",
          "Quais sinais de desorganização aparecem primeiro em você?",
          "O que dá para manter mesmo nos dias ruins?"
        ],
        checklist: [
          "Definir rotina curta de manhã e de noite.",
          "Listar itens que precisam de reposição ou organização.",
          "Escolher uma manutenção semanal para não deixar acumular."
        ],
        action: "Monte uma rotina mínima de 3 passos para manhã e 3 para noite. O importante é consistência, não excesso."
      },
      {
        id: "style",
        number: 3,
        title: "Estilo que Impõe Identidade",
        short: "Visual com assinatura",
        level: "estratégico",
        duration: "22 min",
        summary: "Ajuda a alinhar roupas, caimento, combinações e linguagem visual com a versão que você quer representar.",
        why: "Estilo forte não é ter muita roupa; é ter direção. Este módulo traduz identidade em escolhas visuais coerentes e fáceis de repetir.",
        questions: [
          "Sua roupa comunica intenção ou apenas cobre o corpo?",
          "Quais peças te representam de verdade?",
          "Você consegue repetir uma identidade visual sem ficar caricato(a)?"
        ],
        checklist: [
          "Separar peças que passam exatamente a imagem desejada.",
          "Montar 3 combinações fáceis para rotina real.",
          "Eliminar excessos visuais que atrapalham coerência."
        ],
        action: "Escolha uma palavra para o seu estilo: clean, forte, clássico ou leve. Depois, monte um look que respeite essa palavra."
      },
      {
        id: "confidence",
        number: 4,
        title: "Impacto e Confiança",
        short: "Presença firme",
        level: "essencial",
        duration: "20 min",
        summary: "Trabalha voz, posicionamento, firmeza, segurança emocional e a capacidade de ser lembrado(a) sem exagerar.",
        why: "Confiança visível é menos sobre parecer superior e mais sobre parecer inteiro(a). A ideia é transmitir segurança sem rigidez e presença sem atuação.",
        questions: [
          "Você reduz seu brilho para não chamar atenção?",
          "Sua fala sustenta a imagem que sua aparência comunica?",
          "Quais momentos fazem sua segurança cair?"
        ],
        checklist: [
          "Treinar resposta curta e firme para situações sociais.",
          "Melhorar contato visual e ritmo de fala.",
          "Escolher uma ação semanal que te coloque mais visível."
        ],
        action: "Repita em voz alta uma apresentação curta de si com ritmo mais calmo, frase mais limpa e final mais firme."
      },
      {
        id: "habits",
        number: 5,
        title: "Hábitos que Sustentam Evolução",
        short: "Constância real",
        level: "sustentação",
        duration: "19 min",
        summary: "Ensina disciplina sem radicalismo: rotina, repetição, organização e sistemas para a evolução não morrer em poucos dias.",
        why: "A parte mais bonita da evolução é a que continua. Este módulo transforma boas intenções em padrões que sobrevivem à preguiça, à correria e à oscilação de humor.",
        questions: [
          "Qual o exato ponto em que você costuma abandonar?",
          "Seu ambiente ajuda ou sabota sua constância?",
          "Você tem metas bonitas ou sistemas funcionais?"
        ],
        checklist: [
          "Definir rotina mínima que cabe até em dias fracos.",
          "Criar um gatilho claro para começar as ações.",
          "Usar acompanhamento visual do progresso."
        ],
        action: "Escolha um hábito mínimo de 5 minutos e fixe o mesmo horário por 7 dias seguidos."
      },
      {
        id: "details",
        number: 6,
        title: "Ajustes que Mudam o Jogo",
        short: "Detalhes de alto impacto",
        level: "upgrade",
        duration: "15 min",
        summary: "Mostra como pequenos detalhes elevam muito a leitura final: organização visual, acabamento, cheiro, acessórios, ambiente e cuidado de bastidor.",
        why: "Muita gente melhora o grande e esquece o detalhe. Só que, no dia a dia, detalhe é o que dá acabamento de pessoa realmente alinhada.",
        questions: [
          "Quais microdetalhes hoje quebram sua imagem final?",
          "Seu ambiente e seus objetos conversam com a sua presença?",
          "O que você pode ajustar rápido e colher efeito imediato?"
        ],
        checklist: [
          "Revisar itens de uso diário e o que passam visualmente.",
          "Escolher um detalhe de acabamento para elevar nesta semana.",
          "Eliminar um ruído visual recorrente."
        ],
        action: "Faça uma revisão de bolso, mochila, mesa ou quarto e retire tudo que deixa sua imagem mais improvisada."
      },
      {
        id: "evolution",
        number: 7,
        title: "Plano de Evolução",
        short: "Ordem e clareza",
        level: "direção",
        duration: "21 min",
        summary: "Mostra o que melhorar primeiro, o que vem depois e como continuar com mais clareza, sem ansiedade por resultados instantâneos.",
        why: "Sem plano, a pessoa tenta melhorar tudo ao mesmo tempo e sente que não sai do lugar. Este pilar organiza sequência, horizonte e manutenção.",
        questions: [
          "O que precisa vir primeiro para o resto render melhor?",
          "Qual resultado te daria prova concreta de avanço?",
          "Como manter direção depois da empolgação inicial?"
        ],
        checklist: [
          "Definir ordem pessoal dos pilares.",
          "Escolher métrica simples de progresso.",
          "Montar revisão semanal curta para não se perder."
        ],
        action: "Escreva a sua ordem de evolução em 3 etapas: agora, depois e consolidar."
      }
    ];

    const journeyMap = [
      { day: 1, title: "Reset visual", text: "Observe sua imagem atual com honestidade e sem dramatizar. O objetivo é clareza." },
      { day: 2, title: "Primeiro contato", text: "Trabalhe postura, energia e entrada em ambientes por poucos minutos." },
      { day: 3, title: "Rotina mínima", text: "Monte uma sequência curta de autocuidado que você aguente repetir." },
      { day: 4, title: "Assinatura visual", text: "Escolha uma direção estética e elimine o que conflita com ela." },
      { day: 5, title: "Presença verbal", text: "Treine fala mais limpa, mais calma e com final firme." },
      { day: 6, title: "Ambiente", text: "Ajuste um espaço da sua rotina para reduzir ruído visual e abandono." },
      { day: 7, title: "Domingo de revisão", text: "Veja o que já melhorou e o que ainda está te travando." },
      { day: 8, title: "Imagem consistente", text: "Repita a mesma linguagem visual em um contexto real." },
      { day: 9, title: "Detalhes invisíveis", text: "Revise acessórios, organização, acabamento e apresentação." },
      { day: 10, title: "Confiança operacional", text: "Faça uma microação que exija mais presença sem exagero." },
      { day: 11, title: "Disciplina leve", text: "Proteja o básico mesmo num dia mais fraco." },
      { day: 12, title: "Refinamento", text: "Escolha um ponto já bom e deixe mais sofisticado." },
      { day: 13, title: "Plano do próximo ciclo", text: "Defina o que continua, o que sai e o que entra." },
      { day: 14, title: "Consolidação", text: "Feche a jornada com uma visão clara do seu novo padrão." }
    ];

    const plannerBase = {
      presence: [
        "Treino rápido de postura e entrada em ambiente.",
        "Revisar expressão facial e ritmo corporal.",
        "Ação prática: entrar com mais intenção em um espaço real."
      ],
      care: [
        "Organizar rotina curta de manhã e noite.",
        "Revisar itens de autocuidado e manutenção.",
        "Ação prática: deixar tudo preparado para o dia seguinte."
      ],
      style: [
        "Separar combinação de roupa com intenção.",
        "Escolher uma palavra-guia para o visual do dia.",
        "Ação prática: repetir coerência em vez de improviso."
      ],
      confidence: [
        "Treino curto de voz, postura e resposta firme.",
        "Exercício de contato visual e frase mais limpa.",
        "Ação prática: se posicionar sem pedir desculpa por existir."
      ],
      habits: [
        "Fixar um horário mínimo e cumprir sem negociar.",
        "Reduzir atrito do ambiente e deixar o hábito mais fácil.",
        "Ação prática: marcar visualmente o que foi feito."
      ],
      details: [
        "Revisão de mochila, mesa, quarto ou objetos diários.",
        "Ajustar um detalhe de acabamento visível.",
        "Ação prática: cortar um ruído visual recorrente."
      ]
    };

    const STORAGE_KEY = "lumieDashboardStateV3";
    const LEGACY_STORAGE_KEY = "lumieDashboardStateV2";

    const appState = {
      account: {
        name: "Aluno Lumié",
        plan: "Acesso Permanente",
        status: "Liberado",
        email: "aluno@lumie.app"
      },
      diagnosis: {},
      startDate: null,
      completedModules: [],
      moduleTaskChecks: {},
      dailyChecks: {},
      journeyChecks: {},
      planner: null
    };

    let currentQuestion = 1;
    let modalModuleId = null;

    const totalQuestions = 12;

    function saveState(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }

    function normalizeState(){
      if(!Array.isArray(appState.completedModules)) appState.completedModules = [];
      if(!appState.moduleTaskChecks || typeof appState.moduleTaskChecks !== "object") appState.moduleTaskChecks = {};
      if(!appState.dailyChecks || typeof appState.dailyChecks !== "object") appState.dailyChecks = {};
      if(!appState.journeyChecks || typeof appState.journeyChecks !== "object") appState.journeyChecks = {};

      baseModules.forEach(module => {
        const existing = appState.moduleTaskChecks[module.id];
        if(Array.isArray(existing)) return;
        if(appState.completedModules.includes(module.id)){
          appState.moduleTaskChecks[module.id] = module.checklist.map(() => true);
        }else{
          appState.moduleTaskChecks[module.id] = module.checklist.map(() => false);
        }
      });

      if(!appState.startDate && appState.diagnosis && Object.keys(appState.diagnosis).length){
        appState.startDate = new Date().toISOString().slice(0,10);
      }
    }

    function loadState(){
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if(!raw) return;
      try{
        const parsed = JSON.parse(raw);
        Object.assign(appState, parsed);
        normalizeState();
      }catch(e){}
    }

    function ensureStartDate(){
      if(!appState.startDate){
        appState.startDate = new Date().toISOString().slice(0,10);
      }
    }

    function formatDateBR(dateText){
      if(!dateText) return "—";
      const date = new Date(`${dateText}T12:00:00`);
      if(Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("pt-BR");
    }

    function getDayProgress(){
      if(!appState.startDate) return 0;
      const start = new Date(`${appState.startDate}T12:00:00`);
      const today = new Date();
      today.setHours(12,0,0,0);
      const diff = Math.floor((today - start) / 86400000);
      return Math.max(1, diff + 1);
    }

    function getUnlockedModuleCount(){
      if(!appState.startDate) return 0;
      return Math.min(baseModules.length, getDayProgress());
    }

    function getModuleTaskChecks(moduleId, total){
      const current = Array.isArray(appState.moduleTaskChecks[moduleId]) ? appState.moduleTaskChecks[moduleId] : [];
      while(current.length < total){
        current.push(false);
      }
      appState.moduleTaskChecks[moduleId] = current.slice(0, total);
      return appState.moduleTaskChecks[moduleId];
    }

    function getModuleTaskProgress(module){
      const checks = getModuleTaskChecks(module.id, module.checklist.length);
      const done = checks.filter(Boolean).length;
      const total = module.checklist.length;
      return {
        done,
        total,
        percent: total ? Math.round((done / total) * 100) : 0,
        ready: total > 0 && done === total
      };
    }

    function getModuleStatus(module){
      const unlockedCount = getUnlockedModuleCount();
      const completed = appState.completedModules.includes(module.id);
      if(completed) return "completed";
      if(module.priority <= unlockedCount) return "available";
      return "locked";
    }

    function getModuleUnlockText(module){
      const todayIndex = getUnlockedModuleCount();
      if(getModuleStatus(module) === "completed") return "Concluído";
      if(getModuleStatus(module) === "available") return `Disponível no Dia ${module.priority}`;
      const daysLeft = Math.max(0, module.priority - todayIndex);
      return daysLeft <= 0 ? `Disponível no Dia ${module.priority}` : `Libera em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`;
    }

    function canCompleteModule(module){
      return getModuleStatus(module) !== "locked" && getModuleTaskProgress(module).ready;
    }

    function titleFromId(id){
      const found = baseModules.find(item => item.id === id);
      return found ? found.title : "Diagnóstico";
    }

    function labelMap(value, map){
      return map[value] || value || "—";
    }

    function getProfile(){
      const d = appState.diagnosis || {};
      const priorityOrder = buildPriorityOrder(d);
      const unlockedCount = getUnlockedModuleCount();
      const clarity = Math.round((appState.completedModules.length / baseModules.length) * 100);
      return {
        name: appState.account.name,
        email: appState.account.email,
        plan: appState.account.plan,
        status: appState.account.status,
        presenceGoal: labelMap(d.presenceGoal, {
          elegante:"Elegante",
          marcante:"Marcante",
          confiavel:"Confiável",
          leve:"Leve e agradável"
        }),
        mainGap: labelMap(d.mainGap, {
          presence:"Fundamentos da Presença",
          care:"Autocuidado de Alto Nível",
          style:"Estilo que Impõe Identidade",
          confidence:"Impacto e Confiança",
          habits:"Hábitos que Sustentam Evolução",
          details:"Ajustes que Mudam o Jogo"
        }),
        routineState: labelMap(d.routineState, {
          corrida:"Muito corrida",
          media:"Mais ou menos controlada",
          organizada:"Bem organizada",
          caotica:"Desorganizada"
        }),
        timePerDay: d.timePerDay ? `${d.timePerDay} min por dia` : "—",
        careLevel: labelMap(d.careLevel, {
          baixo:"Baixo",
          medio:"Médio",
          alto:"Alto",
          inconstante:"Inconstante"
        }),
        styleState: labelMap(d.styleState, {
          perdido:"Perdido(a)",
          basico:"Básico demais",
          bom:"Bom, sem identidade",
          forte:"Já tem uma linha"
        }),
        confidenceState: labelMap(d.confidenceState, {
          travado:"Travado(a)",
          instavel:"Instável",
          bom:"Bom",
          seguro:"Seguro(a)"
        }),
        blocker: labelMap(d.blocker, {
          "falta-tempo":"Falta de tempo",
          "falta-clareza":"Falta de clareza",
          "desanimo":"Desânimo",
          "constancia":"Constância"
        }),
        progressMode: labelMap(d.progressMode, {
          quick:"Vitórias rápidas",
          balanced:"Equilíbrio",
          deep:"Reconstrução completa",
          support:"Muito guiado"
        }),
        monthlyGoal: labelMap(d.monthlyGoal, {
          "mais-presenca":"Ser melhor percebido(a)",
          "mais-cuidado":"Sentir-se mais cuidado(a)",
          "mais-estilo":"Ganhar identidade visual",
          "mais-disciplina":"Virar alguém mais constante"
        }),
        visualDirection: labelMap(d.visualDirection, {
          clean:"Clean e refinado",
          strong:"Forte e marcante",
          classic:"Clássico e seguro",
          soft:"Leve e acolhedor"
        }),
        goalText: d.goalText || "Ainda não preenchido.",
        startingModule: titleFromId(priorityOrder[0]),
        startDate: formatDateBR(appState.startDate),
        currentDay: unlockedCount ? `Dia ${getDayProgress()}` : "Pendente",
        unlockedCount,
        clarity
      };
    }

    function buildPriorityOrder(diagnosis){
      const order = [];
      const pushUnique = (id) => {
        if(id && !order.includes(id)) order.push(id);
      };

      pushUnique(diagnosis.mainGap);

      if(diagnosis.progressMode === "quick"){
        pushUnique("details");
        pushUnique("presence");
      }
      if(diagnosis.progressMode === "deep"){
        pushUnique("habits");
        pushUnique("evolution");
      }
      if(diagnosis.progressMode === "support"){
        pushUnique("evolution");
        pushUnique("habits");
      }
      if(diagnosis.careLevel === "baixo" || diagnosis.careLevel === "inconstante") pushUnique("care");
      if(diagnosis.styleState === "perdido" || diagnosis.styleState === "basico") pushUnique("style");
      if(diagnosis.confidenceState === "travado" || diagnosis.confidenceState === "instavel") pushUnique("confidence");
      if(diagnosis.blocker === "constancia" || diagnosis.blocker === "desanimo") pushUnique("habits");
      if(diagnosis.blocker === "falta-clareza") pushUnique("evolution");
      if(diagnosis.monthlyGoal === "mais-presenca") pushUnique("presence");
      if(diagnosis.monthlyGoal === "mais-cuidado") pushUnique("care");
      if(diagnosis.monthlyGoal === "mais-estilo") pushUnique("style");
      if(diagnosis.monthlyGoal === "mais-disciplina") pushUnique("habits");
      if(diagnosis.visualDirection === "strong") pushUnique("confidence");
      if(diagnosis.visualDirection === "clean") pushUnique("care");
      if(diagnosis.visualDirection === "classic") pushUnique("style");
      if(diagnosis.visualDirection === "soft") pushUnique("presence");

      ["presence","care","style","confidence","habits","details","evolution"].forEach(pushUnique);
      return order.slice(0, 7);
    }

    function getPersonalizedModules(){
      const d = appState.diagnosis || {};
      const order = buildPriorityOrder(d);
      const profile = getProfile();

      return order.map((id, index) => {
        const module = baseModules.find(item => item.id === id);
        const completed = appState.completedModules.includes(id);
        let personalizedSummary = module.summary;

        if(id === "presence" && d.presenceGoal){
          const map = {
            elegante: "A prioridade aqui é parecer mais refinado(a), limpo(a) e bem alinhado(a) logo de início.",
            marcante: "A prioridade aqui é construir entrada forte, leitura visual clara e sensação de identidade.",
            confiavel: "A prioridade aqui é transmitir segurança, firmeza e coerência desde o primeiro contato.",
            leve: "A prioridade aqui é parecer bem cuidado(a), agradável e equilibrado(a) sem excesso."
          };
          personalizedSummary = map[d.presenceGoal];
        }
        if(id === "habits" && d.blocker){
          const map = {
            "falta-tempo":"Aqui o foco é reduzir atrito e criar uma rotina que sobreviva a dias corridos.",
            "falta-clareza":"Aqui o foco é transformar confusão em sequência prática e simples.",
            "desanimo":"Aqui o foco é criar tração pequena, visível e repetível para evitar abandono.",
            "constancia":"Aqui o foco é construir sustentação, repetição e acompanhamento visual."
          };
          personalizedSummary = map[d.blocker];
        }
        if(id === "style" && d.visualDirection){
          const map = {
            clean:"O módulo de estilo vai puxar sua imagem para uma linha mais clean, refinada e coerente.",
            strong:"O módulo de estilo vai construir uma estética mais forte, com identidade e assinatura visual.",
            classic:"O módulo de estilo vai reforçar uma presença clássica, segura e mais madura.",
            soft:"O módulo de estilo vai buscar leveza, harmonia e boa leitura visual sem pesar."
          };
          personalizedSummary = map[d.visualDirection];
        }
        if(id === "evolution"){
          personalizedSummary = `Este é o módulo que organiza sua ordem pessoal de evolução: ${profile.startingModule} primeiro, depois sustentação e por fim refinamento.`;
        }

        const priority = index + 1;
        const progress = getModuleTaskProgress(module);
        const completedState = appState.completedModules.includes(id);
        const status = completedState ? "completed" : (priority <= getUnlockedModuleCount() ? "available" : "locked");

        return {
          ...module,
          priority,
          completed: completedState,
          status,
          unlocked: status !== "locked",
          progressDone: progress.done,
          progressTotal: progress.total,
          progressPercent: progress.percent,
          readyToComplete: progress.ready,
          unlockDay: priority,
          summary: personalizedSummary
        };
      });
    }

    function buildDailyTasks(){
      const d = appState.diagnosis || {};
      const time = Number(d.timePerDay || 20);
      const morning = [
        "Arrumar postura, rosto e presença por 2 minutos antes de sair ou começar o dia.",
        "Executar sua rotina mínima de autocuidado sem negociar com o humor.",
        "Escolher conscientemente a imagem que você quer transmitir hoje."
      ];

      const night = [
        "Separar uma combinação, item ou detalhe do dia seguinte para reduzir improviso.",
        "Fazer fechamento simples de autocuidado e organização.",
        "Anotar em uma frase se hoje você viveu sua imagem ou só reagiu ao dia."
      ];

      const micro = [
        "Revisar um detalhe que te deixa com aparência mais improvisada.",
        "Treinar uma resposta firme e curta para usar em situações reais.",
        `Reservar ${time} minutos reais para a prioridade número 1 da sua rota.`
      ];

      if(d.blocker === "falta-tempo"){
        morning[0] = "Usar 3 minutos com intenção: postura, limpeza visual e decisão de imagem do dia.";
        night[1] = "Preparar o básico da manhã seguinte para não depender de vontade.";
      }
      if(d.mainGap === "style"){
        morning[2] = "Escolher uma palavra-guia para o visual do dia: clean, forte, clássico ou leve.";
        micro[0] = "Separar 3 combinações fáceis que representem sua identidade visual.";
      }
      if(d.mainGap === "confidence"){
        morning[0] = "Treinar entrada, olhar e presença por 2 minutos antes de sair.";
        micro[1] = "Fazer uma ação pequena em que você precise aparecer com mais firmeza.";
      }
      if(d.mainGap === "care"){
        night[0] = "Deixar seus itens de cuidado organizados para reduzir abandono.";
      }

      return { morning, night, micro };
    }

    function buildInsight(){
      const p = getProfile();
      if(!appState.diagnosis.mainGap){
        return {
          title: "Sem leitura ainda",
          text: "Finalize o diagnóstico para a dashboard ler o cenário do aluno e organizar a ordem dos pilares com mais inteligência."
        };
      }

      return {
        title: `${p.mainGap} aparece como o ponto mais urgente agora.`,
        text: `Hoje, sua rota pede foco em ${p.mainGap.toLowerCase()}, com ritmo ${p.progressMode.toLowerCase()} e janela diária de ${p.timePerDay}. O objetivo do mês é ${p.monthlyGoal.toLowerCase()}.`
      };
    }

    function buildRouteTexts(){
      const profile = getProfile();
      const order = getPersonalizedModules();
      if(!appState.diagnosis.mainGap){
        return {
          title: "Rota inicial: diagnóstico ainda não concluído",
          summary: "Assim que o aluno responder as perguntas, a dashboard monta a ordem ideal dos 7 pilares, ajusta o foco do painel diário e mostra a primeira ação prática."
        };
      }
      const second = order[1] ? order[1].title : "Refinamento";
      return {
        title: `Rota inicial: ${profile.startingModule}`,
        summary: `Primeiro você trabalha ${profile.startingModule.toLowerCase()}, depois consolida com ${second.toLowerCase()} e usa o restante dos pilares para sustentar sua imagem com clareza e constância.`
      };
    }

    function renderOverview(){
      const profile = getProfile();
      const modules = getPersonalizedModules();
      const completed = appState.completedModules.length;
      const percent = Math.round((completed / baseModules.length) * 100);
      const route = buildRouteTexts();
      const insight = buildInsight();

      document.getElementById("studentName").textContent = profile.name;
      document.getElementById("accountPlan").textContent = profile.plan;
      document.getElementById("sidebarPlan").textContent = profile.plan;
      document.getElementById("accountStatus").textContent = profile.status;
      document.getElementById("nextFocus").textContent = profile.mainGap !== "—" ? profile.mainGap : "Diagnóstico";
      document.getElementById("clarityScore").textContent = `${profile.clarity}%`;
      document.getElementById("routeTitle").textContent = route.title;
      document.getElementById("routeSummary").textContent = route.summary;
      document.getElementById("progressPercent").textContent = `${percent}%`;
      document.getElementById("progressLabel").textContent = completed ? `Você concluiu ${completed} pilar(es).` : "Nenhum pilar concluído ainda.";
      document.getElementById("completedCount").textContent = `${completed}/7`;
      document.getElementById("startingModule").textContent = profile.currentDay;
      document.getElementById("dailyMode").textContent = profile.timePerDay === "—" ? "Base" : profile.timePerDay.replace(" por dia", "");
      document.getElementById("heroDescription").textContent = appState.diagnosis.goalText || "Aqui o aluno não entra só para ver módulos. Ele entende onde está, o que precisa ajustar primeiro, o que pode fazer hoje e qual é a próxima etapa da própria evolução.";

      const priorityList = document.getElementById("priorityList");
      priorityList.innerHTML = "";
      modules.slice(0,4).forEach((module, index) => {
        const item = document.createElement("div");
        item.className = "priority-item";
        const tag = module.status === "completed" ? "feito" : (module.status === "available" ? "agora" : `dia ${module.unlockDay}`);
        item.innerHTML = `
          <div class="priority-num">${index + 1}</div>
          <div>
            <strong>${module.title}</strong>
            <p>${module.summary}</p>
          </div>
          <span class="priority-tag">${tag}</span>
        `;
        priorityList.appendChild(item);
      });

      const pillarsPreview = document.getElementById("pillarsPreview");
      pillarsPreview.innerHTML = "";
      modules.forEach((module, index) => {
        const score = Math.max(18, 100 - index * 12);
        const card = document.createElement("div");
        card.className = "pillar-card";
        card.innerHTML = `
          <b>${module.number}. ${module.title}</b>
          <p>${module.short}</p>
          <div class="score-bar"><span style="width:${score}%"></span></div>
        `;
        pillarsPreview.appendChild(card);
      });

      document.getElementById("profileInsightTitle").textContent = insight.title;
      document.getElementById("profileInsightText").textContent = insight.text;
    }

    function renderProfile(){
      const p = getProfile();
      const fields = [
        ["Nome", p.name],
        ["E-mail", p.email],
        ["Plano", p.plan],
        ["Status", p.status],
        ["Objetivo de presença", p.presenceGoal],
        ["Ponto mais urgente", p.mainGap],
        ["Rotina hoje", p.routineState],
        ["Tempo diário", p.timePerDay],
        ["Autocuidado", p.careLevel],
        ["Estilo atual", p.styleState],
        ["Confiança", p.confidenceState],
        ["Bloqueio central", p.blocker]
      ];
      const grid = document.getElementById("profileGrid");
      grid.innerHTML = "";
      fields.forEach(([label, value]) => {
        const article = document.createElement("article");
        article.innerHTML = `<span>${label}</span><b>${value || "—"}</b>`;
        grid.appendChild(article);
      });

      const chips = document.getElementById("profileChips");
      chips.innerHTML = "";
      [p.progressMode, p.monthlyGoal, p.visualDirection].filter(Boolean).forEach(item => {
        if(item === "—") return;
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = item;
        chips.appendChild(chip);
      });
      if(appState.diagnosis.goalText){
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = "Foco pessoal salvo";
        chips.appendChild(chip);
      }
    }

    function renderJourney(){
      const profile = getProfile();
      const modules = getPersonalizedModules();
      const tasks = buildDailyTasks();

      document.getElementById("journeyFirst").textContent = profile.startingModule;
      document.getElementById("journeyMode").textContent = profile.progressMode || "Estruturando";
      document.getElementById("journeyTime").textContent = profile.timePerDay;
      document.getElementById("journeyMonthFocus").textContent = profile.monthlyGoal;
      document.getElementById("journeyTitle").textContent = profile.mainGap === "—" ? "Seus 7 pilares, agora em ordem de execução." : `Sua rota começa por ${profile.startingModule}.`;
      document.getElementById("journeySubtitle").textContent = buildRouteTexts().summary;

      const moduleGrid = document.getElementById("moduleGrid");
      moduleGrid.innerHTML = "";
      modules.forEach(module => {
        const card = document.createElement("div");
        const statusClass = module.status === "completed" ? "done" : module.status;
        const statusLabel = module.status === "completed" ? "Concluído" : (module.status === "available" ? "Disponível" : "Bloqueado");
        const actionLabel = module.status === "completed"
          ? "Revisar módulo"
          : module.status === "available"
            ? "Abrir módulo"
            : `Disponível no Dia ${module.unlockDay}`;
        card.className = `module-card ${statusClass}`;
        card.innerHTML = `
          <div class="module-top">
            <div>
              <div class="module-meta">
                <span class="module-badge">Dia ${module.unlockDay}</span>
                <span class="module-badge">${module.duration}</span>
              </div>
              <h3>${module.title}</h3>
              <span class="module-day">${getModuleUnlockText(module)}</span>
            </div>
            <span class="module-status">${statusLabel}</span>
          </div>
          <p>${module.summary}</p>
          <div class="module-progress">
            <div class="module-progress-head">
              <span>Checklist do módulo</span>
              <strong>${module.progressDone}/${module.progressTotal}</strong>
            </div>
            <div class="module-progress-bar"><span style="width:${module.progressPercent}%"></span></div>
          </div>
          <div class="module-footer">
            <small class="module-lock-note">${module.status === "locked" ? `Faltam ${Math.max(0, module.unlockDay - getUnlockedModuleCount())} dia(s) para liberar.` : module.readyToComplete ? "Checklist completo. Já pode concluir." : "Marque todas as tarefas para concluir."}</small>
            <button class="btn ${module.status === "locked" ? "btn-ghost" : module.completed ? "btn-secondary" : "btn-primary"}" data-open-module="${module.id}" ${module.status === "locked" ? "disabled" : ""}>
              ${actionLabel}
            </button>
          </div>
        `;
        moduleGrid.appendChild(card);
      });

      renderTaskGroup("morningTasks", tasks.morning, "morning");
      renderTaskGroup("nightTasks", tasks.night, "night");
      renderTaskGroup("microTasks", tasks.micro, "micro");

      const dailySummaryTitle = document.getElementById("dailySummaryTitle");
      const dailySummaryDetail = document.getElementById("dailySummaryDetail");
      const dailySummaryText = document.getElementById("dailySummaryText");

      if(appState.diagnosis.mainGap){
        dailySummaryTitle.textContent = `Hoje o foco principal é ${profile.mainGap.toLowerCase()}.`;
        dailySummaryDetail.textContent = `Seu ritmo ideal agora é ${profile.progressMode.toLowerCase()}, com ${profile.timePerDay}. O sistema está tentando te dar clareza sem peso desnecessário.`;
        dailySummaryText.textContent = `Sua melhor estratégia é proteger o básico todos os dias e colocar sua energia principal em ${profile.startingModule.toLowerCase()}.`;
      }

      const journeyGrid = document.getElementById("journeyGrid");
      journeyGrid.innerHTML = "";
      journeyMap.forEach(item => {
        const linkedModule = item.day <= modules.length ? modules[item.day - 1] : null;
        const checked = linkedModule ? linkedModule.completed : !!appState.journeyChecks[item.day];
        const day = document.createElement("div");
        day.className = `journey-day ${checked ? "done" : ""}`;

        if(linkedModule){
          day.innerHTML = `
            <div class="journey-num">${item.day}</div>
            <div class="day-content">
              <b>${linkedModule.title}</b>
              <p>${item.text}</p>
              <div class="journey-module-note">Módulo do dia: ${linkedModule.progressDone}/${linkedModule.progressTotal} tarefas feitas · ${getModuleUnlockText(linkedModule)}.</div>
              <button class="btn ${linkedModule.status === "locked" ? "btn-ghost" : linkedModule.completed ? "btn-secondary" : "btn-primary"} journey-link-btn" data-open-module="${linkedModule.id}" ${linkedModule.status === "locked" ? "disabled" : ""}>
                ${linkedModule.status === "completed" ? "Revisar módulo" : linkedModule.status === "available" ? "Abrir módulo do dia" : `Libera no Dia ${linkedModule.unlockDay}`}
              </button>
            </div>
          `;
        }else{
          day.innerHTML = `
            <div class="journey-num">${item.day}</div>
            <div>
              <b>${item.title}</b>
              <p>${item.text}</p>
            </div>
            <label class="task-item ${checked ? "done" : ""}" style="margin-top:2px">
              <input type="checkbox" data-journey-day="${item.day}" ${checked ? "checked" : ""}>
              <span>Marcar como feito</span>
            </label>
          `;
        }
        journeyGrid.appendChild(day);
      });
    }

    function renderTaskGroup(targetId, tasks, key){
      const wrap = document.getElementById(targetId);
      wrap.innerHTML = "";
      tasks.forEach((task, index) => {
        const taskKey = `${key}-${index}`;
        const checked = !!appState.dailyChecks[taskKey];
        const label = document.createElement("label");
        label.className = `task-item ${checked ? "done" : ""}`;
        label.innerHTML = `
          <input type="checkbox" data-task-key="${taskKey}" ${checked ? "checked" : ""}>
          <span>${task}</span>
        `;
        wrap.appendChild(label);
      });
    }

    function renderDiagnosisProgress(){
      document.getElementById("diagCounter").textContent = `Pergunta ${currentQuestion} de ${totalQuestions}`;
      document.getElementById("diagProgressBar").style.width = `${(currentQuestion / totalQuestions) * 100}%`;
    }

    function showQuestion(step){
      currentQuestion = step;
      document.querySelectorAll(".question-step").forEach(item => item.classList.remove("active"));
      const target = document.querySelector(`.question-step[data-step="${step}"]`);
      if(target) target.classList.add("active");
      renderDiagnosisProgress();
    }

    function updateChoiceSelection(group, value){
      appState.diagnosis[group] = value;
      saveState();
    }

    function syncDiagnosisUI(){
      Object.entries(appState.diagnosis || {}).forEach(([key, value]) => {
        const group = document.querySelector(`[data-choice-group="${key}"]`);
        if(group){
          group.querySelectorAll(".choice-card").forEach(card => {
            card.classList.toggle("selected", card.dataset.value === value);
          });
        }
      });
      document.getElementById("goalText").value = appState.diagnosis.goalText || "";
    }

    function openPanel(panelName){
      document.querySelectorAll(".panel").forEach(panel => panel.classList.remove("active"));
      document.getElementById(`panel-${panelName}`).classList.add("active");
      document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.panelTarget === panelName);
      });
      document.getElementById("sidebar").classList.remove("open");
    }

    function renderModalChecklist(module){
      const checks = getModuleTaskChecks(module.id, module.checklist.length);
      const progress = getModuleTaskProgress(module);
      const wrap = document.getElementById("modalChecklist");
      wrap.innerHTML = "";

      module.checklist.forEach((item, index) => {
        const checked = !!checks[index];
        const label = document.createElement("label");
        label.className = `module-check-item ${checked ? "done" : ""}`;
        label.innerHTML = `
          <input type="checkbox" data-module-check="${module.id}" data-module-check-index="${index}" ${checked ? "checked" : ""} ${module.completed ? "disabled" : ""}>
          <span>${item}</span>
        `;
        wrap.appendChild(label);
      });

      document.getElementById("modalProgressText").textContent = `${progress.done} de ${progress.total} tarefas feitas`;
      document.getElementById("modalProgressBar").style.width = `${progress.percent}%`;
      document.getElementById("modalDayLabel").textContent = `Dia ${module.unlockDay}`;

      const helper = document.getElementById("modalHelperText");
      const btn = document.getElementById("completeModuleBtn");

      if(module.status === "locked"){
        helper.textContent = `Este módulo libera no Dia ${module.unlockDay}.`;
        btn.disabled = true;
        btn.textContent = `Bloqueado até o Dia ${module.unlockDay}`;
        return;
      }

      if(module.completed){
        helper.textContent = "Checklist completo e módulo concluído.";
        btn.disabled = true;
        btn.textContent = "Módulo concluído";
        return;
      }

      if(progress.ready){
        helper.textContent = "Tudo certo. Agora você já pode concluir o módulo.";
        btn.disabled = false;
        btn.textContent = "Concluir módulo";
      }else{
        helper.textContent = `Marque todas as tarefas para liberar a conclusão. Faltam ${progress.total - progress.done} item(ns).`;
        btn.disabled = true;
        btn.textContent = `Conclua ${progress.done}/${progress.total} tarefas`;
      }
    }

    function openModule(id){
      modalModuleId = id;
      const module = getPersonalizedModules().find(item => item.id === id);
      if(!module || module.status === "locked") return;
      document.getElementById("modalEyebrow").textContent = `Dia ${module.unlockDay} · Prioridade ${module.priority}`;
      document.getElementById("modalTitle").textContent = module.title;
      document.getElementById("modalIntro").textContent = module.summary;
      document.getElementById("modalWhy").textContent = module.why;
      document.getElementById("modalAction").textContent = module.action;

      const q = document.getElementById("modalQuestions");
      q.innerHTML = "";
      module.questions.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        q.appendChild(li);
      });

      renderModalChecklist(module);
      document.getElementById("moduleDialog").showModal();
    }

    function toggleModuleCompletion(id){
      const module = getPersonalizedModules().find(item => item.id === id);
      if(!module || !canCompleteModule(module) || appState.completedModules.includes(id)) return;
      appState.completedModules.push(id);
      saveState();
      renderAll();
      document.getElementById("moduleDialog").close();
    }

    function applyPlannerDefaultsFromDiagnosis(){
      const d = appState.diagnosis || {};
      if(!d.mainGap) return;

      const daysEl = document.getElementById("plannerDays");
      const intensityEl = document.getElementById("plannerIntensity");
      const momentEl = document.getElementById("plannerMoment");
      const needEl = document.getElementById("plannerNeed");

      const daysMap = {
        quick: "4",
        balanced: "5",
        deep: "6",
        support: "3"
      };
      const intensityMap = {
        quick: "leve",
        balanced: "medio",
        deep: "forte",
        support: "leve"
      };
      const momentMap = {
        organizada: "manha",
        media: "tarde",
        corrida: "noite",
        caotica: "noite"
      };

      if(daysMap[d.progressMode]) daysEl.value = daysMap[d.progressMode];
      if(intensityMap[d.progressMode]) intensityEl.value = intensityMap[d.progressMode];
      if(momentMap[d.routineState]) momentEl.value = momentMap[d.routineState];
      if(d.mainGap && [...needEl.options].some(option => option.value === d.mainGap)) needEl.value = d.mainGap;
    }

    function renderPlanner(){
      const planner = appState.planner;
      const wrap = document.getElementById("plannerWeek");
      if(!planner){
        wrap.innerHTML = `<div class="empty-state">Quando você gerar a semana, este espaço mostra um plano dia por dia com foco, ação principal e intenção estratégica.</div>`;
        return;
      }
      document.getElementById("plannerDescription").textContent = planner.description;
      wrap.innerHTML = "";
      planner.days.forEach(day => {
        const div = document.createElement("div");
        div.className = "week-day";
        div.innerHTML = `<strong>${day.title}</strong><p>${day.text}</p>`;
        wrap.appendChild(div);
      });
    }

    function generatePlanner(){
      const days = Number(document.getElementById("plannerDays").value);
      const intensity = document.getElementById("plannerIntensity").value;
      const moment = document.getElementById("plannerMoment").value;
      const need = document.getElementById("plannerNeed").value;
      const base = plannerBase[need] || plannerBase.presence;
      const intensityText = {
        leve: "leve, sustentável e fácil de repetir",
        medio: "equilibrado, com direção e constância",
        forte: "mais intencional e estratégico"
      };
      const momentText = {
        manha: "pela manhã",
        tarde: "na parte da tarde",
        noite: "no período da noite"
      };
      const labels = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

      const result = [];
      for(let i = 0; i < days; i++){
        result.push({
          title: labels[i],
          text: `${base[i % base.length]} Faça isso ${momentText[moment]} em ritmo ${intensityText[intensity]}.`
        });
      }
      while(result.length < 7){
        result.push({
          title: labels[result.length],
          text: "Dia de manutenção leve: revisar progresso, arrumar ambiente e proteger a rotina mínima."
        });
      }

      appState.planner = {
        description: `Semana montada com foco em ${titleFromId(need).toLowerCase()}, ${days} dias ativos e ritmo ${intensityText[intensity]}. Baseada no diagnóstico atual e alinhada ao ${getProfile().currentDay.toLowerCase()}.`,
        days: result
      };
      saveState();
      renderPlanner();
    }

    function finishDiagnosis(){
      const text = document.getElementById("goalText").value.trim();
      appState.diagnosis.goalText = text || "Quero evoluir com mais clareza, mais consistência e uma imagem mais alinhada.";
      appState.account.name = text ? "Aluno Lumié" : appState.account.name;
      ensureStartDate();
      applyPlannerDefaultsFromDiagnosis();
      if(!appState.planner) generatePlanner();
      saveState();
      renderAll();
      window.location.href = "dashboard.html";
    }

    function renderAll(){
      normalizeState();
      renderOverview();
      renderProfile();
      renderJourney();
      syncDiagnosisUI();
      renderDiagnosisProgress();
      applyPlannerDefaultsFromDiagnosis();
      renderPlanner();
    }

    document.addEventListener("click", (event) => {
      const nav = event.target.closest(".nav-link");
      if(nav){
        openPanel(nav.dataset.panelTarget);
      }

      const choice = event.target.closest("[data-choice-group] .choice-card");
      if(choice){
        const group = choice.parentElement.dataset.choiceGroup;
        choice.parentElement.querySelectorAll(".choice-card").forEach(card => card.classList.remove("selected"));
        choice.classList.add("selected");
        updateChoiceSelection(group, choice.dataset.value);
      }

      const nextBtn = event.target.closest("[data-next-step]");
      if(nextBtn){
        const next = Number(nextBtn.dataset.nextStep);
        showQuestion(next);
      }

      const prevBtn = event.target.closest("[data-prev-step]");
      if(prevBtn){
        const prev = Number(prevBtn.dataset.prevStep);
        showQuestion(prev);
      }

      const openModuleBtn = event.target.closest("[data-open-module]");
      if(openModuleBtn && !openModuleBtn.disabled){
        openModule(openModuleBtn.dataset.openModule);
      }

      const modalCheck = event.target.closest("[data-module-check]");
      if(modalCheck){
        const moduleId = modalCheck.dataset.moduleCheck;
        const index = Number(modalCheck.dataset.moduleCheckIndex);
        const module = baseModules.find(item => item.id === moduleId);
        const checks = getModuleTaskChecks(moduleId, module.checklist.length);
        checks[index] = modalCheck.checked;
        appState.moduleTaskChecks[moduleId] = checks;
        saveState();
        const currentModule = getPersonalizedModules().find(item => item.id === moduleId);
        renderModalChecklist(currentModule);
        renderAll();
      }

      const taskCheck = event.target.closest("[data-task-key]");
      if(taskCheck){
        const key = taskCheck.dataset.taskKey;
        appState.dailyChecks[key] = taskCheck.checked;
        saveState();
        taskCheck.closest(".task-item")?.classList.toggle("done", taskCheck.checked);
      }

      const journeyCheck = event.target.closest("[data-journey-day]");
      if(journeyCheck){
        const key = journeyCheck.dataset.journeyDay;
        appState.journeyChecks[key] = journeyCheck.checked;
        saveState();
        renderJourney();
      }

      const courseTab = event.target.closest("[data-course-tab]");
      if(courseTab){
        document.querySelectorAll(".course-tab").forEach(tab => tab.classList.remove("active"));
        courseTab.classList.add("active");
        document.querySelectorAll(".subpanel").forEach(panel => panel.classList.remove("active"));
        document.getElementById(`course-${courseTab.dataset.courseTab}`).classList.add("active");
      }
    });

    document.getElementById("finishDiagnosisBtn").addEventListener("click", finishDiagnosis);
    document.getElementById("goalText").addEventListener("input", (event) => {
      appState.diagnosis.goalText = event.target.value;
      saveState();
    });

    document.getElementById("startDiagnosisHero").addEventListener("click", () => {
      openPanel("diagnosis");
      showQuestion(1);
    });
    document.getElementById("quickDiagnosisBtn").addEventListener("click", () => {
      openPanel("diagnosis");
      showQuestion(1);
    });
    document.getElementById("redoDiagnosisBtn").addEventListener("click", () => {
      openPanel("diagnosis");
      showQuestion(1);
    });
    document.getElementById("goJourneyHero").addEventListener("click", () => openPanel("journey"));
    document.getElementById("openPlannerFromOverview").addEventListener("click", () => {
      openPanel("planner");
      applyPlannerDefaultsFromDiagnosis();
      if(!appState.planner && appState.diagnosis.mainGap){
        generatePlanner();
      }else{
        renderPlanner();
      }
    });

    document.getElementById("generatePlannerBtn").addEventListener("click", generatePlanner);
    document.getElementById("completeModuleBtn").addEventListener("click", () => toggleModuleCompletion(modalModuleId));
    document.getElementById("closeModalBtn").addEventListener("click", () => document.getElementById("moduleDialog").close());
    document.getElementById("closeModalBtn2").addEventListener("click", () => document.getElementById("moduleDialog").close());

    document.getElementById("menuToggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });

    document.getElementById("resetAllBtn").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      appState.diagnosis = {};
      appState.startDate = null;
      appState.completedModules = [];
      appState.moduleTaskChecks = {};
      appState.dailyChecks = {};
      appState.journeyChecks = {};
      appState.planner = null;
      normalizeState();
      saveState();
      showQuestion(1);
      renderAll();
      openPanel("overview");
    });


    function hydrateSessionUser(){
      try{
        const user = JSON.parse(localStorage.getItem('lm_user') || 'null');
        if(!user) return;
        appState.account.name = user.name || appState.account.name;
        appState.account.email = user.email || appState.account.email;
        appState.account.plan = user.plan || (user.permanent ? 'Acesso Permanente' : 'Chave Semanal');
        appState.account.status = user.permanent ? 'Vitalício' : 'Liberado';
        if(!appState.startDate){
          if(user.activatedAt){
            appState.startDate = new Date(user.activatedAt).toISOString().slice(0,10);
          }else if(user.expiresAt && !user.permanent){
            appState.startDate = new Date().toISOString().slice(0,10);
          }
        }
      }catch(e){}
    }

    hydrateSessionUser();
    loadState();
    normalizeState();
    showQuestion(1);
    renderAll();
  

(function(){
  const page = document.body.dataset.page;
  if(page){
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === page);
    });
  }
})();
