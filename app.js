/* ==========================================================================
   FRENCH LANGUAGE COACH - CLIENT CONTROLLER & SIMULATION ENGINE (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE MANAGEMENT ---
  const state = {
    xp: 0,
    cefrLevel: 'A1', // A1, A2, B1
    progress: 15, // 0 to 100
    isTtsEnabled: true,
    isSlowSpeech: false,
    currentAccent: 'fr-FR', // 'fr-FR' or 'fr-CA'
    activeScenario: null, // null, 'cafe', 'directions', 'technical', 'debate'
    scenarioGoals: [], // list of goal objects { id, text, regex, done }
    chatHistory: [],
    speechVoice: null,
    routineState: { Lundi: false, Mercredi: false, Vendredi: false, Dimanche: false }
  };

  // --- COMMON FRENCH GRAMMAR ERRORS DATABASE ---
  const grammarCorrections = [
    {
      regex: /\b(j'ai\s+all[é|e]s?)\b/gi,
      wrong: "j'ai allé",
      correct: "je suis allé(e)",
      reason: "Conjugating 'aller' (to go) in the passé composé requires the auxiliary verb 'être', not 'avoir'. (e.g., 'Je suis allé à Paris')."
    },
    {
      regex: /\b(je\s+suis\s+mang[é|e]s?)\b/gi,
      wrong: "je suis mangé",
      correct: "j'ai mangé",
      reason: "Conjugating 'manger' (to eat) requires the auxiliary verb 'avoir', not 'être' in active voice."
    },
    {
      regex: /\b(je\s+suis\s+parl[é|e]s?)\b/gi,
      wrong: "je suis parlé",
      correct: "j'ai parlé",
      reason: "Conjugating 'parler' (to speak) requires the auxiliary verb 'avoir' in the passé composé."
    },
    {
      regex: /\b(parl[é|e]\s+avec\s+il)\b/gi,
      wrong: "parlé avec il",
      correct: "parlé avec lui",
      reason: "Use the disjunctive pronoun 'lui' (him) instead of the subject pronoun 'il' (he) after prepositions like 'avec'."
    },
    {
      regex: /\b(beaucoup\s+des)\b/gi,
      wrong: "beaucoup des",
      correct: "beaucoup de",
      reason: "After adverbs of quantity like 'beaucoup', use 'de' (or 'd'') instead of the plural partitive article 'des'."
    },
    {
      regex: /\b(vais?\s+([àa]\s+le))\b/gi,
      wrong: "vais à le",
      correct: "vais au",
      reason: "The preposition 'à' contracts with the masculine definite article 'le' to form 'au'."
    },
    {
      regex: /\b(vais?\s+([àa]\s+les))\b/gi,
      wrong: "vais à les",
      correct: "vais aux",
      reason: "The preposition 'à' contracts with the plural definite article 'les' to form 'aux'."
    },
    {
      regex: /\b(je\s+va)\b/gi,
      wrong: "je va",
      correct: "je vais",
      reason: "The first-person singular present tense conjugation of 'aller' (to go) is 'je vais'."
    },
    {
      regex: /\b(plus\s+bon)\b/gi,
      wrong: "plus bon",
      correct: "meilleur",
      reason: "In French, the comparative of 'bon' (good) is irregular and becomes 'meilleur' (better), not 'plus bon'."
    },
    {
      regex: /\b(je\s+suis\s+(\d+)\s+ans)\b/gi,
      wrong: "je suis [âge] ans",
      correct: "j'ai [âge] ans",
      reason: "In French, age is expressed using the verb 'avoir' (to have), not 'être' (to be)."
    },
    {
      regex: /\b(tr[èe]s\s+beaucoup)\b/gi,
      wrong: "très beaucoup",
      correct: "beaucoup / énormément",
      reason: "'Très' cannot modify 'beaucoup'. Simply use 'beaucoup' or intensive adverbs like 'énormément'."
    }
  ];

  // --- THEMATIC VOCABULARY & GRAMMAR DATABASE ---
  const vocabularyData = [
    // Transport Local (A1-A2)
    { word: "le métro", translation: "subway / underground", category: "transport", example: "Le métro parisien est très rapide et pratique.", notes: "Masculine noun." },
    { word: "le billet", translation: "ticket", category: "transport", example: "Il faut acheter un billet avant de monter dans le train.", notes: "Can also mean a paper bank note." },
    { word: "la gare", translation: "station (train)", category: "transport", example: "Le train part de la gare de Lyon à midi.", notes: "Feminine noun. For bus, use 'gare routière'." },
    { word: "la correspondance", translation: "connection / transfer", category: "transport", example: "J'ai dix minutes pour faire la correspondance.", notes: "Feminine noun." },
    { word: "composter", translation: "to validate a ticket", category: "transport", example: "N'oubliez pas de composter votre billet avant l'accès.", notes: "Regular -er verb." },

    // Lieu de Travail (A2-B1)
    { word: "la réunion", translation: "meeting", category: "workplace", example: "La réunion budgétaire commencera à neuf heures.", notes: "Feminine noun." },
    { word: "le collègue", translation: "colleague", category: "workplace", example: "Mes collègues sont très accueillants et professionnels.", notes: "Gendered as 'le collègue' or 'la collègue'." },
    { word: "l'échéance", translation: "deadline / due date", category: "workplace", example: "Nous devons respecter l'échéance du projet.", notes: "Feminine noun." },
    { word: "télétravailler", translation: "to telecommute / work home", category: "workplace", example: "Je vais télétravailler deux jours par semaine.", notes: "Very common modern term." },
    { word: "le bureau", translation: "office / desk", category: "workplace", example: "Mon bureau se trouve au troisième étage de l'immeuble.", notes: "Plural form is 'les bureaux'." },

    // Réparations Maison (B1)
    { word: "le robinet", translation: "faucet / tap", category: "home repairs", example: "Le robinet de la cuisine fuit depuis hier soir.", notes: "Masculine noun." },
    { word: "la fuite", translation: "leak", category: "home repairs", example: "Il y a une fuite d'eau importante sous la douche.", notes: "Feminine noun." },
    { word: "le chauffage", translation: "heating", category: "home repairs", example: "Le chauffage ne fonctionne pas, il fait froid ici.", notes: "Masculine noun." },
    { word: "le plombier", translation: "plumber", category: "home repairs", example: "J'ai appelé le plombier pour réparer les canalisations.", notes: "Masculine noun." },
    { word: "réparer", translation: "to fix / repair", category: "home repairs", example: "Le propriétaire doit réparer la chaudière en panne.", notes: "Regular -er verb." },

    // B1: Monde du Travail & l'Entreprise
    { word: "la gestion de projets", translation: "project management", category: "workplace (B1)", example: "La gestion de projets demande beaucoup de rigueur et d'organisation.", notes: "Feminine noun phrase." },
    { word: "l'incident technique", translation: "technical incident / issue", category: "workplace (B1)", example: "Le technicien a résolu l'incident technique en moins d'une heure.", notes: "Masculine noun phrase." },
    { word: "la ressource humaine", translation: "human resource", category: "workplace (B1)", example: "Le département des ressources humaines gère les contrats.", notes: "Feminine noun." },
    { word: "le télétravail", translation: "telecommuting / remote work", category: "workplace (B1)", example: "Le télétravail favorise une meilleure conciliation vie pro et perso.", notes: "Masculine noun." },
    { word: "la vie de bureau", translation: "office life", category: "workplace (B1)", example: "Partager un café fait partie intégrante de la vie de bureau.", notes: "Feminine noun phrase." },

    // B1: L'Environnement & les Transports (Mobilité douce)
    { word: "le cyclisme urbain", translation: "urban cycling", category: "mobility (B1)", example: "Le cyclisme urbain se développe rapidement grâce aux pistes cyclables.", notes: "Masculine noun." },
    { word: "le développement durable", translation: "sustainable development", category: "mobility (B1)", example: "Le développement durable préserve les ressources de notre planète.", notes: "Masculine noun." },
    { word: "la piste cyclable", translation: "bike lane / path", category: "mobility (B1)", example: "Il est beaucoup plus sûr de rouler sur la piste cyclable.", notes: "Feminine noun." },
    { word: "l'itinéraire", translation: "route / itinerary", category: "mobility (B1)", example: "Nous avons tracé un bel itinéraire pour notre voyage à vélo.", notes: "Masculine noun." },
    { word: "l'écologie", translation: "ecology / environmentalism", category: "mobility (B1)", example: "L'écologie doit être au cœur des décisions politiques.", notes: "Feminine noun." },

    // B1: Les Médias, la Technologie & l'IA
    { word: "l'intelligence artificielle", translation: "artificial intelligence", category: "technology (B1)", example: "L'intelligence artificielle offre des solutions innovantes.", notes: "Feminine noun." },
    { word: "l'automatisation", translation: "automation", category: "technology (B1)", example: "L'automatisation permet de libérer du temps pour les tâches créatives.", notes: "Feminine noun." },
    { word: "la visualisation de données", translation: "data visualization", category: "technology (B1)", example: "La visualisation de données facilite la compréhension des métriques.", notes: "Feminine noun phrase." },
    { word: "le réseau social", translation: "social network / media", category: "technology (B1)", example: "Chaque réseau social a ses propres codes et publics cibles.", notes: "Plural: les réseaux sociaux." },
    { word: "l'actualité", translation: "news / current affairs", category: "technology (B1)", example: "Je consulte les journaux chaque matin pour suivre l'actualité.", notes: "Feminine noun (usually singular)." },

    // B1: Les Loisirs & la Vie Quotidienne
    { word: "le cricket", translation: "cricket (sport)", category: "leisure (B1)", example: "Le cricket est un sport d'équipe passionnant très populaire.", notes: "Masculine noun." },
    { word: "le cyclotourisme", translation: "bicycle touring / cycle tourism", category: "leisure (B1)", example: "Le cyclotourisme combine activité physique et découverte du paysage.", notes: "Masculine noun." },
    { word: "la sortie culturelle", translation: "cultural outing", category: "leisure (B1)", example: "Une sortie culturelle au musée d'art moderne est prévue ce samedi.", notes: "Feminine noun." },
    { word: "les finances personnelles", translation: "personal finances", category: "leisure (B1)", example: "Gérer ses finances personnelles permet d'anticiper l'avenir.", notes: "Feminine plural noun." },
    { word: "le budget", translation: "budget", category: "leisure (B1)", example: "Nous avons établi un budget mensuel strict pour nos loisirs.", notes: "Masculine noun." }
  ];

  const grammarLessonsData = [
    { title: "Passé Composé vs Imparfait", translation: "Completed action vs background details", category: "grammar", example: "Hier, je suis allé (PC) dehors parce qu'il faisait (Imparfait) beau.", notes: "Use Passé Composé for specific events, Imparfait for ongoing states." },
    { title: "Pronoms Disjonctifs", translation: "moi, toi, lui, elle, nous, vous, eux, elles", category: "grammar", example: "Viens chez moi ce soir avec lui !", notes: "Used after prepositions (pour, avec, sans) or for emphasis." },
    { title: "Connecteurs Logiques", translation: "pourtant, donc, alors que, d'ailleurs", category: "grammar", example: "Il pleut, donc je prends mon parapluie ; pourtant, il fait chaud.", notes: "Essential connectors to sound fluent and structure B1 arguments." },
    { title: "Le Mode Subjonctif (Présent)", translation: "Expressing necessity, doubt, emotion, or will", category: "grammar (B1)", example: "Il faut que je sache gérer mon temps de travail.", notes: "Que + radical de la 3e pers. pluriel + e, es, e, ions, iez, ent" },
    { title: "Pronoms Relatifs Composés", translation: "lequel, laquelle, auxquels, pour lesquels, etc.", category: "grammar (B1)", example: "C'est l'entreprise pour laquelle je travaille.", notes: "Used after prepositions to avoid repeating a noun" },
    { title: "Expression de la Condition", translation: "Si + présent = futur / Si + imparfait = conditionnel", category: "grammar (B1)", example: "Si j'étudie chaque jour, j'obtiendrai mon DELF B1.", notes: "Formulating hypotheses for real or imaginary scenarios" }
  ];

  // --- SCENARIO DATASETS ---
  const scenarios = {
    cafe: {
      name: "Au Café Parisien (A1-A2)",
      desc: "Order food and drinks at a local French café.",
      avatar: "☕",
      initialPrompt: "Bonjour ! Bienvenue au Café des Deux Moulins. Que désirez-vous commander aujourd'hui ? 🥐☕",
      status: "Commandez votre repas au garçon de café",
      goals: [
        { id: "hello", text: "Saluer poliment (Bonjour / Salut)", regex: /(bonjour|salut|bonsoir)/i, done: false },
        { id: "order", text: "Commander une boisson ou nourriture (Je voudrais / S'il vous plaît)", regex: /(voudrais|aimerais|commande|caf[eé]|croissant|s'il\s+vous\s+pla[iî]t)/i, done: false },
        { id: "price", text: "Demander le prix ou l'addition (L'addition / C'est combien)", regex: /(addition|combien|payer|prix|co[uû]te)/i, done: false },
        { id: "thanks", text: "Exprimer de la gratitude (Merci / Bonne journée)", regex: /(merci|bonne\s+journ[eé]e|au\s+revoir)/i, done: false }
      ],
      aiResponses: {
        intro: "Bonjour ! Je suis Antoinette, votre serveuse. Que puis-je vous servir ?",
        hello: "Bonjour ! Enchanté. Qu'est-ce que je vous sers aujourd'hui ? Nous avons d'excellents croissants chauds et du café frais.",
        order: "Très bon choix ! Je vous apporte cela dans un instant. Désirez-vous autre chose avec votre commande ?",
        price: "Bien sûr ! Voici l'addition. Cela fait 4 euros 50 au total. Vous réglez par carte ou en espèces ?",
        thanks: "Merci beaucoup à vous ! Passez une excellente fin de journée et au revoir !",
        fallback: "Ah, c'est noté. D'accord. Avez-vous besoin de l'addition ou d'autre chose ?"
      }
    },
    directions: {
      name: "Demander son Chemin (A1-A2)",
      desc: "Ask a local passerby for directions to the train station or Louvre museum.",
      avatar: "🗺️",
      initialPrompt: "Excusez-moi ? Vous avez l'air perdu... Est-ce que je peux vous aider à trouver votre chemin ? 🗺️🗼",
      status: "Trouvez votre itinéraire dans la ville",
      goals: [
        { id: "excuse", text: "S'excuser poliment (Pardon / Excusez-moi)", regex: /(excusez-moi|pardon|s'il\s+vous\s+pla[iî]t)/i, done: false },
        { id: "ask", text: "Demander une direction (Où est / Comment aller)", regex: /(o[uù]\s+est|comment\s+aller|gare|mus[eé]e|louvre|chemin|station)/i, done: false },
        { id: "movement", text: "Utiliser un verbe de mouvement (Aller / Tourner / Continuer)", regex: /(aller|tourner|continuer|prendre|marcher)/i, done: false },
        { id: "thanks", text: "Remercier le passant (Merci beaucoup)", regex: /(merci|sympa|bonne\s+journ[eé]e)/i, done: false }
      ],
      aiResponses: {
        intro: "Bonjour ! Vous cherchez votre chemin ? La ville peut être confuse !",
        excuse: "Pas de souci ! Je vous en prie. Comment puis-je vous guider ?",
        ask: "Ah, la gare centrale ! C'est tout près d'ici. Il faut marcher tout droit pendant 200 mètres.",
        movement: "Exactement ! Vous devez tourner à droite au feu, puis continuer tout droit vers le grand bâtiment en verre.",
        thanks: "De rien ! C'est un plaisir de vous aider. Profitez bien de votre visite et bonne journée !",
        fallback: "Désolé, je n'ai pas tout compris. Cherchez-vous le musée du Louvre ou la gare de train ?"
      }
    },
    technical: {
      name: "Problème de Logement (B1)",
      desc: "Report a heating failure and plumbing leak to your landlord Antoinette.",
      avatar: "🔧",
      initialPrompt: "Allô ? Oui, bonjour ! C'est Antoinette, votre propriétaire. Je vous écoute, il y a un problème dans l'appartement ? 📞❄️",
      status: "Signalez la panne de chauffage à la propriétaire",
      goals: [
        { id: "explain", text: "Expliquer le problème technique (chauffage / fuite)", regex: /(chauffage|fuite|robinet|eau|panne|ne\s+marche\s+pas|fonctionne)/i, done: false },
        { id: "impact", text: "Décrire l'impact (froid / pas de douche)", regex: /(froid|geler|douche|impossible|doucher|inondation|probl[èe]me)/i, done: false },
        { id: "help", text: "Demander de l'aide ou un plombier (Réparer / Plombier)", regex: /(plombier|r[eé]parer|envoyer|intervenir|venir)/i, done: false },
        { id: "connectors", text: "Utiliser un connecteur logique (Donc / Pourtant / Alors)", regex: /(donc|pourtant|alors|car|parce\s+que)/i, done: false }
      ],
      aiResponses: {
        intro: "Allô ? Oui, c'est Antoinette. Y a-t-il un problème de plomberie ou d'électricité ?",
        explain: "Oh non ! Une fuite d'eau et une panne de chauffage ? C'est terrible !",
        impact: "C'est inacceptable en plein hiver ! Vous devez avoir tellement froid. Je suis désolée.",
        help: "Je vais appeler un plombier tout de suite. Il peut être chez vous cet après-midi vers 14h. Est-ce que cela vous convient ?",
        connectors: "Vous avez tout à fait raison d'insister, donc je vais faire intervenir le réparateur en urgence absolue.",
        thanks: "Parfait, c'est noté. Restez au chaud, le plombier arrive vite. Au revoir !",
        fallback: "Ah bon ? Pouvez-vous me décrire plus précisément si c'est le robinet qui fuit ou le radiateur ?"
      }
    },
    debate: {
      name: "Débat : Réseaux Sociaux (B1)",
      desc: "Defend your views on whether social media is beneficial or harmful in a friendly chat.",
      avatar: "💬",
      initialPrompt: "Salut mon ami ! Dis-moi, je lisais un article sur les réseaux sociaux... Je trouve qu'ils détruisent nos relations réelles. Qu'en penses-tu ? 📱🤔",
      status: "Exprimez vos opinions dans le débat amical",
      goals: [
        { id: "opinion", text: "Donner son opinion (Je pense que / À mon avis)", regex: /(pense|trouve|crois|avis|opinion)/i, done: false },
        { id: "argue", text: "Exprimer l'accord/désaccord (D'accord / Pas d'accord)", regex: /(d'accord|pas\s+d'accord|partage|contre|pour)/i, done: false },
        { id: "connectors", text: "Utiliser un connecteur complexe (Pourtant / Alors que)", regex: /(pourtant|alors\s+que|d'ailleurs|cependant|néanmoins|neanmoins)/i, done: false },
        { id: "reason", text: "Justifier son argument (Parce que / Car)", regex: /(parce\s+que|car|puisque|effet)/i, done: false }
      ],
      aiResponses: {
        intro: "Alors, es-tu d'accord avec l'idée que les écrans nous isolent du monde réel ?",
        opinion: "Je comprends tout à fait ton point de vue. C'est vrai qu'il y a des aspects positifs comme rester en contact.",
        argue: "Ah ! Je vois que nous ne sommes pas tout à fait d'accord, c'est super d'avoir ce débat amical !",
        connectors: "C'est exact ! D'ailleurs, de nombreuses études prouvent que cela dépend vraiment de la durée d'utilisation journalière.",
        reason: "Absolument, car l'accès à la culture mondiale est immédiat grâce à ces plateformes.",
        thanks: "C'était vraiment enrichissant de discuter avec toi de ce sujet ! Ton niveau de français est excellent. Bravo !",
        fallback: "Intéressant ! Peux-tu préciser pourquoi tu penses cela en utilisant des arguments ?"
      }
    }
  };

  // --- HTML DOM ELEMENT REFERENCES ---
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatForm = document.getElementById('chat-form');
  const messageTextInput = document.getElementById('message-text-input');
  const xpCounter = document.getElementById('xp-counter');
  const cefrLevelText = document.getElementById('cefr-level-text');
  const cefrIndicatorBadge = document.getElementById('cefr-indicator-badge');
  const globalProgressFill = document.getElementById('global-progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const speechSpeedBtn = document.getElementById('speech-speed-btn');
  const speechSpeedIcon = document.getElementById('speech-speed-icon');
  const accentToggleBtn = document.getElementById('accent-toggle-btn');
  const accentLabel = document.getElementById('accent-label');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const voiceInputBtn = document.getElementById('voice-input-btn');
  
  // Scenarios Panels
  const activeScenarioBanner = document.getElementById('active-scenario-banner');
  const activeScenarioName = document.getElementById('active-scenario-name');
  const exitScenarioBtn = document.getElementById('exit-scenario-btn');
  const scenarioGoalsCard = document.getElementById('scenario-goals-card');
  const scenarioGoalsList = document.getElementById('scenario-goals-list');
  const coachStatusSubtext = document.getElementById('coach-status-subtext');
  
  // Right Panels Tabs & Cards
  const vocabTabTrigger = document.getElementById('vocab-tab-trigger');
  const grammarTabTrigger = document.getElementById('grammar-tab-trigger');
  const delfTabTrigger = document.getElementById('delf-tab-trigger');
  const routineTabTrigger = document.getElementById('routine-tab-trigger');

  const vocabGrammarTabContent = document.getElementById('vocab-grammar-tab-content');
  const delfTabContent = document.getElementById('delf-tab-content');
  const routineTabContent = document.getElementById('routine-tab-content');

  const vocabSearchInput = document.getElementById('vocab-search-input');
  const vocabularyCardsList = document.getElementById('vocabulary-cards-list');
  const toastContainer = document.getElementById('achievement-toast-container');

  // DELF Challenge Form references
  const delfEssayInput = document.getElementById('delf-essay-input');
  const essayWordCount = document.getElementById('essay-word-count');
  const essayStatusLabel = document.getElementById('essay-status-label');
  const delfEssaySubmitBtn = document.getElementById('delf-essay-submit-btn');

  // DELF Oral references
  const oralTimerText = document.getElementById('oral-timer-text');
  const oralTimerToggleBtn = document.getElementById('oral-timer-toggle-btn');
  const oralTimerResetBtn = document.getElementById('oral-timer-reset-btn');
  const oralTranscriptDisplay = document.getElementById('oral-transcript-display');
  const delfOralSubmitBtn = document.getElementById('delf-oral-submit-btn');

  // Routine Checklist references
  const routineProgressPercent = document.getElementById('routine-progress-percent');
  const routineProgressFill = document.getElementById('routine-progress-fill');
  const routineResetBtn = document.getElementById('routine-reset-btn');
  const routineItems = document.querySelectorAll('.routine-item');

  // Skill Tree Nodes
  const nodeA1 = document.getElementById('node-a1');
  const nodeA2 = document.getElementById('node-a2');
  const nodeB1 = document.getElementById('node-b1');

  // --- INITIALIZATION ---
  loadStateFromLocalStorage();
  initializeSpeech();
  renderVocabulary('vocab');
  renderSkillTreeNodes();
  sendInitialGreeting();

  // --- EVENT LISTENERS ---
  
  // Submit new Chat Message
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageTextInput.value.trim();
    if (!text) return;
    handleUserMessage(text);
    messageTextInput.value = '';
  });

  // Sidebar Skill Node Clicks
  nodeA1.addEventListener('click', () => changeCEFRLevel('A1'));
  nodeA2.addEventListener('click', () => {
    if (state.xp >= 100) {
      changeCEFRLevel('A2');
    } else {
      triggerToast("Niveau Verrouillé", "Gagnez 100 XP au total pour débloquer le niveau A2 !", "fa-solid fa-lock");
    }
  });
  nodeB1.addEventListener('click', () => {
    if (state.xp >= 250) {
      changeCEFRLevel('B1');
    } else {
      triggerToast("Niveau Verrouillé", "Gagnez 250 XP au total pour débloquer le niveau B1 !", "fa-solid fa-lock");
    }
  });

  // Sound Synth and Voice Recognition toggle
  audioToggleBtn.addEventListener('click', () => {
    state.isTtsEnabled = !state.isTtsEnabled;
    audioToggleBtn.classList.toggle('active', state.isTtsEnabled);
    triggerToast(state.isTtsEnabled ? "Audio Activé" : "Audio Désactivé", state.isTtsEnabled ? "Antoinette parlera en français." : "Antoinette restera silencieuse.", state.isTtsEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark");
    saveStateToLocalStorage();
  });

  speechSpeedBtn.addEventListener('click', () => {
    state.isSlowSpeech = !state.isSlowSpeech;
    speechSpeedBtn.classList.toggle('active', state.isSlowSpeech);
    if (state.isSlowSpeech) {
      speechSpeedIcon.className = "fa-solid fa-gauge-simple";
      triggerToast("Vitesse Lente", "L'élocution vocale sera ralentie pour faciliter l'apprentissage.", "fa-solid fa-gauge-simple");
    } else {
      speechSpeedIcon.className = "fa-solid fa-gauge-high";
      triggerToast("Vitesse Normale", "L'élocution vocale utilisera le débit naturel de conversation.", "fa-solid fa-gauge-high");
    }
    saveStateToLocalStorage();
  });

  accentToggleBtn.addEventListener('click', () => {
    if (state.currentAccent === 'fr-FR') {
      state.currentAccent = 'fr-CA';
      accentLabel.textContent = "FR (CA)";
      triggerToast("Accent Québécois", "Antoinette parlera désormais avec l'accent canadien-français.", "fa-solid fa-earth-americas");
    } else {
      state.currentAccent = 'fr-FR';
      accentLabel.textContent = "FR (FR)";
      triggerToast("Accent Parisien", "Antoinette parlera désormais avec l'accent standard français.", "fa-solid fa-earth-europe");
    }
    initializeSpeechVoice();
    saveStateToLocalStorage();
  });

  // Command tags links clicks
  document.querySelectorAll('.cmd-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const command = badge.getAttribute('data-cmd');
      messageTextInput.value = command;
      messageTextInput.focus();
    });
  });

  // Clear Chat History
  clearChatBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous effacer l'historique des discussions ?")) {
      chatMessagesContainer.innerHTML = '';
      state.chatHistory = [];
      sendInitialGreeting();
      saveStateToLocalStorage();
    }
  });

  // Scenarios quick link clicks
  document.querySelectorAll('.scenario-link').forEach(link => {
    link.addEventListener('click', () => {
      const scenarioKey = link.getAttribute('data-scenario');
      startScenarioMode(scenarioKey);
    });
  });

  // Exit Scenario Mode button
  exitScenarioBtn.addEventListener('click', () => {
    exitScenarioMode();
  });

  // --- TABS CONTROLLER ---
  vocabTabTrigger.addEventListener('click', () => {
    switchTab('vocab');
  });

  grammarTabTrigger.addEventListener('click', () => {
    switchTab('grammar');
  });

  delfTabTrigger.addEventListener('click', () => {
    switchTab('delf');
  });

  routineTabTrigger.addEventListener('click', () => {
    switchTab('routine');
  });

  function switchTab(tabName) {
    vocabTabTrigger.classList.remove('active');
    grammarTabTrigger.classList.remove('active');
    delfTabTrigger.classList.remove('active');
    routineTabTrigger.classList.remove('active');

    vocabGrammarTabContent.style.display = 'none';
    delfTabContent.style.display = 'none';
    routineTabContent.style.display = 'none';

    // Restore search input visibility by default when switching tabs
    vocabSearchInput.style.display = 'block';

    if (tabName === 'vocab') {
      vocabTabTrigger.classList.add('active');
      vocabGrammarTabContent.style.display = 'flex';
      renderVocabulary('vocab');
    } else if (tabName === 'grammar') {
      grammarTabTrigger.classList.add('active');
      vocabGrammarTabContent.style.display = 'flex';
      renderVocabulary('grammar');
    } else if (tabName === 'delf') {
      delfTabTrigger.classList.add('active');
      delfTabContent.style.display = 'flex';
      checkEssayCriteria();
      checkOralCriteria();
    } else if (tabName === 'routine') {
      routineTabTrigger.classList.add('active');
      routineTabContent.style.display = 'flex';
      renderRoutineList();
    }
  }

  // Vocab search filter
  vocabSearchInput.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase().trim();
    const activeTab = vocabTabTrigger.classList.contains('active') ? 'vocab' : 'grammar';
    renderVocabulary(activeTab, text);
  });

  // --- DELF PRODUCTION ÉCRITE (ESSAI ARGUMENTÉ) ---
  function checkEssayCriteria() {
    const text = delfEssayInput.value.trim();
    const words = text === '' ? [] : text.split(/\s+/);
    const count = words.length;
    essayWordCount.textContent = count;

    const connectors = ["cependant", "de plus", "pourtant", "par conséquent", "d'ailleurs"];
    let usedCount = 0;

    connectors.forEach(conn => {
      const badge = document.querySelector(`.connector-badge[data-connector="${conn}"]`);
      let isPresent = false;
      if (conn === "par conséquent") {
        const regex = /\bpar\s+cons[eé]quent\b/i;
        isPresent = regex.test(text);
      } else {
        const regex = new RegExp(`\\b${conn}\\b`, 'i');
        isPresent = regex.test(text);
      }

      if (isPresent) {
        badge.classList.add('active');
        usedCount++;
      } else {
        badge.classList.remove('active');
      }
    });

    const isWordCountOk = count >= 160;
    const hasEnoughConnectors = usedCount >= 3; // Pedagogically flexible but rigorous B1 requirement

    if (isWordCountOk && hasEnoughConnectors) {
      delfEssaySubmitBtn.removeAttribute('disabled');
      delfEssaySubmitBtn.style.background = 'var(--gradient-brand)';
      delfEssaySubmitBtn.style.color = 'white';
      delfEssaySubmitBtn.style.cursor = 'pointer';
      essayStatusLabel.textContent = "Prêt !";
      essayStatusLabel.style.color = "var(--color-success)";
    } else {
      delfEssaySubmitBtn.setAttribute('disabled', 'true');
      delfEssaySubmitBtn.style.background = 'var(--border-glass)';
      delfEssaySubmitBtn.style.color = 'var(--text-muted)';
      delfEssaySubmitBtn.style.cursor = 'not-allowed';

      if (!isWordCountOk && !hasEnoughConnectors) {
        essayStatusLabel.textContent = "Incomplet (mots & connecteurs)";
      } else if (!isWordCountOk) {
        essayStatusLabel.textContent = "Incomplet (mots)";
      } else {
        essayStatusLabel.textContent = "Incomplet (connecteurs)";
      }
      essayStatusLabel.style.color = "var(--color-accent)";
    }
  }

  delfEssayInput.addEventListener('input', checkEssayCriteria);

  delfEssaySubmitBtn.addEventListener('click', () => {
    awardXP(50);
    triggerToast("ÉPREUVE ÉCRITE RÉUSSIE !", "Votre essai DELF B1 a été validé ! (+50 XP)", "fa-solid fa-trophy");
    
    // Reset essay text field and criteria UI
    delfEssayInput.value = '';
    checkEssayCriteria();

    // Auto-check Vendredi: Écriture task in the weekly routine!
    state.routineState.Vendredi = true;
    saveStateToLocalStorage();
    renderRoutineList();
  });

  // --- DELF PRODUCTION ORALE (CHRONO & SIMULATION) ---
  let oralTimerInterval = null;
  let oralTimerSeconds = 0;

  function checkOralCriteria() {
    const text = oralTranscriptDisplay.value.trim();
    const wordCount = text === '' ? 0 : text.split(/\s+/).length;

    // Must speak for at least 1 minute and transcript has to be >= 30 words
    if (oralTimerSeconds >= 60 && wordCount >= 30) {
      delfOralSubmitBtn.removeAttribute('disabled');
      delfOralSubmitBtn.style.background = 'var(--gradient-brand)';
      delfOralSubmitBtn.style.color = 'white';
      delfOralSubmitBtn.style.cursor = 'pointer';
    } else {
      delfOralSubmitBtn.setAttribute('disabled', 'true');
      delfOralSubmitBtn.style.background = 'var(--border-glass)';
      delfOralSubmitBtn.style.color = 'var(--text-muted)';
      delfOralSubmitBtn.style.cursor = 'not-allowed';
    }
  }

  oralTimerToggleBtn.addEventListener('click', () => {
    if (oralTimerInterval) {
      stopOralPractice();
    } else {
      startOralPractice();
    }
  });

  oralTimerResetBtn.addEventListener('click', () => {
    stopOralPractice();
    oralTimerSeconds = 0;
    oralTimerText.textContent = "00:00";
    oralTimerText.classList.remove('oral-timer-active');
    oralTranscriptDisplay.value = '';
    checkOralCriteria();
  });

  function startOralPractice() {
    state.isOralPracticeActive = true;
    oralTimerText.classList.add('oral-timer-active');
    oralTimerToggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

    oralTimerInterval = setInterval(() => {
      oralTimerSeconds++;
      const mins = String(Math.floor(oralTimerSeconds / 60)).padStart(2, '0');
      const secs = String(oralTimerSeconds % 60).padStart(2, '0');
      oralTimerText.textContent = `${mins}:${secs}`;
      checkOralCriteria();
    }, 1000);

    if (speechRecognition) {
      try {
        speechRecognition.start();
      } catch (err) {
        console.warn("Speech Recognition already active or error:", err);
      }
    }
    triggerToast("Chrono Oral Lancé", "Parlez pour dicter votre monologue en direct !", "fa-solid fa-microphone");
  }

  function stopOralPractice() {
    state.isOralPracticeActive = false;
    oralTimerText.classList.remove('oral-timer-active');
    oralTimerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Démarrer';

    if (oralTimerInterval) {
      clearInterval(oralTimerInterval);
      oralTimerInterval = null;
    }

    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (err) {}
    }
  }

  delfOralSubmitBtn.addEventListener('click', () => {
    stopOralPractice();
    awardXP(30);
    triggerToast("EXPRESSION ORALE RÉUSSIE !", "Votre monologue de pratique DELF B1 a été validé ! (+30 XP)", "fa-solid fa-trophy");

    oralTimerSeconds = 0;
    oralTimerText.textContent = "00:00";
    oralTranscriptDisplay.value = '';
    checkOralCriteria();

    // Auto-check Mercredi: Écoute Active / Expression task in the weekly routine!
    state.routineState.Mercredi = true;
    saveStateToLocalStorage();
    renderRoutineList();
  });

  // --- ROUTINE HEBDOMADAIRE B1 CHECKLIST ---
  function renderRoutineList() {
    let completedCount = 0;
    const totalCount = 4;

    routineItems.forEach(item => {
      const day = item.getAttribute('data-day');
      const isCompleted = state.routineState[day];
      const checkbox = item.querySelector('.goal-checkbox');

      if (isCompleted) {
        item.classList.add('completed');
        checkbox.style.color = 'white';
        completedCount++;
      } else {
        item.classList.remove('completed');
        checkbox.style.color = 'transparent';
      }
    });

    const percent = Math.round((completedCount / totalCount) * 100);
    routineProgressPercent.textContent = `${percent}%`;
    routineProgressFill.style.width = `${percent}%`;

    // Award +50 XP bonus for completing the routine
    if (percent === 100 && !state.routineBonusClaimed) {
      state.routineBonusClaimed = true;
      awardXP(50);
      triggerToast("ROUTINE HEBDO VALIDE !", "Vous avez complété toute votre routine d'étude B1 ! (+50 XP)", "fa-solid fa-award");
      saveStateToLocalStorage();
    }
  }

  routineItems.forEach(item => {
    item.addEventListener('click', () => {
      const day = item.getAttribute('data-day');
      state.routineState[day] = !state.routineState[day];

      if (!state.routineState[day]) {
        state.routineBonusClaimed = false;
      }

      saveStateToLocalStorage();
      renderRoutineList();

      triggerToast(state.routineState[day] ? "Tâche validée !" : "Tâche décochée", `${day} mis à jour.`, state.routineState[day] ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark");
    });
  });

  routineResetBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous réinitialiser votre progression hebdomadaire pour une nouvelle semaine ?")) {
      state.routineState = { Lundi: false, Mercredi: false, Vendredi: false, Dimanche: false };
      state.routineBonusClaimed = false;
      saveStateToLocalStorage();
      renderRoutineList();
      triggerToast("Routine Réinitialisée", "Bonne chance pour votre nouvelle semaine d'étude !", "fa-solid fa-calendar-days");
    }
  });

  // Speech Recognition (Speech-to-Text) handler
  let speechRecognition = null;
  function initializeSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.lang = 'fr-FR';
      speechRecognition.interimResults = false;
      speechRecognition.maxAlternatives = 1;

      speechRecognition.onstart = () => {
        voiceInputBtn.classList.add('recording');
        if (!state.isOralPracticeActive) {
          triggerToast("Écoute Active", "Parlez en français maintenant...", "fa-solid fa-microphone");
        }
      };

      speechRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (state.isOralPracticeActive) {
          oralTranscriptDisplay.value += (oralTranscriptDisplay.value ? " " : "") + text;
          checkOralCriteria();
        } else {
          messageTextInput.value = text;
          messageTextInput.focus();
        }
      };

      speechRecognition.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        voiceInputBtn.classList.remove('recording');
        if (!state.isOralPracticeActive) {
          triggerToast("Erreur d'écoute", "Impossible de capter votre voix. Réessayez.", "fa-solid fa-triangle-exclamation");
        }
      };

      speechRecognition.onend = () => {
        voiceInputBtn.classList.remove('recording');
        if (state.isOralPracticeActive) {
          // Restart speech recognition automatically for continuous monologue tracking
          try {
            speechRecognition.start();
          } catch (err) {}
        }
      };
    } else {
      voiceInputBtn.style.display = 'none'; // Hide button if Speech Recognition is not supported
    }
  }

  voiceInputBtn.addEventListener('click', () => {
    if (!speechRecognition) return;
    if (voiceInputBtn.classList.contains('recording')) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  });

  // --- AUDIO SYNTHESIS (TEXT-TO-SPEECH) ---
  function initializeSpeechVoice() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices(); // Populate voices cache
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      // Match French voices based on selected accent preference
      const filtered = voices.filter(v => v.lang.startsWith(state.currentAccent) || v.lang.startsWith('fr'));
      if (filtered.length > 0) {
        // Try to match the exact accent, fallback to any french
        state.speechVoice = filtered.find(v => v.lang.includes(state.currentAccent)) || filtered[0];
      }
    }, 200);
  }

  // Reload voices when loaded from browser
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = initializeSpeechVoice;
  }

  function speakFrenchText(text) {
    if (!state.isTtsEnabled || !window.speechSynthesis) return;
    
    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    // Clean text from emojis for smoother TTS narration
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (state.speechVoice) {
      utterance.voice = state.speechVoice;
    }
    utterance.lang = state.currentAccent;
    utterance.rate = state.isSlowSpeech ? 0.7 : 0.95; // CEFR adaptive pacing
    utterance.pitch = 1.05; // Friendly tutor tone

    window.speechSynthesis.speak(utterance);
  }

  // --- CORE CHAT LOGIC ---

  function handleUserMessage(text) {
    // 1. Render User Message
    appendMessage(text, 'user');

    // 2. Add to Local History
    state.chatHistory.push({ role: 'user', content: text });

    // 3. Command Parsing
    if (text.startsWith('cmd:')) {
      parseCommands(text);
      return;
    }

    // 4. Grammar and Error Correction Checking
    const errorsMatched = detectCorrections(text);
    
    // 5. Trigger Typing Simulator
    showTypingIndicator(true);

    setTimeout(() => {
      showTypingIndicator(false);

      // Determine AI Response based on state / active scenario
      let responseText = "";
      if (state.activeScenario) {
        responseText = generateScenarioResponse(text);
      } else {
        responseText = generateGeneralResponse(text);
      }

      // Append Antoinette's speech bubble and speak
      appendMessage(responseText, 'coach', errorsMatched);
      speakFrenchText(responseText);

      // Save to chat history
      state.chatHistory.push({ role: 'coach', content: responseText });

      // Award XP for the conversational practice turn
      awardXP(5);
      
      saveStateToLocalStorage();
    }, 1200);
  }

  // Append a message bubble to the chat container
  function appendMessage(text, sender, corrections = []) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let correctionHTML = "";
    if (corrections && corrections.length > 0) {
      corrections.forEach(err => {
        correctionHTML += `
          <div class="correction-card">
            <div class="correction-header">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Correction Inline : "${err.wrong}"
            </div>
            <div class="correction-details">
              <div><span class="correction-wrong">Incorrect :</span> "${err.wrong}"</div>
              <div><span class="correction-correct">Correct :</span> "${err.correct}"</div>
              <div class="correction-reason">${err.reason}</div>
            </div>
          </div>
        `;
      });
    }

    let speechIconHTML = "";
    if (sender === 'coach') {
      speechIconHTML = `
        <button class="speech-bubble-speaker" title="Écouter la prononciation">
          <i class="fa-solid fa-volume-high"></i> Écouter
        </button>
      `;
    }

    bubble.innerHTML = `
      <div class="msg-text-wrapper">
        <div class="msg-content">
          ${text}
        </div>
        ${correctionHTML}
        ${speechIconHTML}
        <div class="msg-meta">${sender === 'coach' ? 'Antoinette' : 'Vous'} • ${timeString}</div>
      </div>
    `;

    // Listen to click on speak button inside individual bubble
    const speakerBtn = bubble.querySelector('.speech-bubble-speaker');
    if (speakerBtn) {
      speakerBtn.addEventListener('click', () => {
        speakFrenchText(text);
      });
    }

    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function showTypingIndicator(show) {
    let indicator = document.getElementById('typing-indicator-node');
    if (show && !indicator) {
      indicator = document.createElement('div');
      indicator.id = 'typing-indicator-node';
      indicator.className = 'typing-indicator';
      indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      chatMessagesContainer.appendChild(indicator);
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    } else if (!show && indicator) {
      indicator.remove();
    }
  }

  // Send default greeting when chat is initialized
  function sendInitialGreeting() {
    if (state.chatHistory.length > 0) {
      // Reload previous conversation from state logs
      state.chatHistory.forEach(msg => {
        appendMessage(msg.content, msg.role);
      });
    } else {
      const welcome = "Bonjour ! Enchantée de faire votre connaissance. Je suis Antoinette, votre coach de français personnelle 🇫🇷. Ensemble, nous allons booster votre niveau pratique et votre vocabulaire ! Écrivez-moi ou essayez de taper <code style='background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;'>cmd:vocab</code> pour explorer les fiches de vocabulaire, ou lancez un scénario avec <code style='background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;'>cmd:scenario cafe</code> ! Comment s'est passée votre journée ?";
      appendMessage(welcome, 'coach');
      state.chatHistory.push({ role: 'coach', content: welcome });
    }
  }

  // --- GRAMMAR CORRECTION PARSER ---
  function detectCorrections(text) {
    const matches = [];
    grammarCorrections.forEach(rule => {
      // Test regex pattern match on input text
      const match = text.match(rule.regex);
      if (match) {
        // For ages, dynamically capture the specific matching string
        let wrongText = rule.wrong;
        let correctText = rule.correct;

        if (rule.wrong === "je suis [âge] ans") {
          const ageNum = match[0].match(/\d+/);
          if (ageNum) {
            wrongText = `je suis ${ageNum[0]} ans`;
            correctText = `j'ai ${ageNum[0]} ans`;
          }
        }
        
        matches.push({
          wrong: match[0],
          correct: correctText,
          reason: rule.reason
        });
      }
    });
    return matches;
  }

  // --- COMMAND PARSER MODULE ---
  function parseCommands(cmdText) {
    const cleanCmd = cmdText.substring(4).trim().toLowerCase();
    
    if (cleanCmd.startsWith('vocab')) {
      vocabTabTrigger.click();
      appendMessage("📚 *Antoinette a ouvert l'onglet vocabulaire sur votre droite ! N'hésitez pas à cliquer sur les cartes pour les écouter ou les retourner !*", 'coach');
      speakFrenchText("J'ai ouvert les fiches de vocabulaire.");
    } 
    else if (cleanCmd.startsWith('scenario')) {
      const topic = cleanCmd.replace('scenario', '').trim();
      if (topic === 'cafe' || topic === 'café') {
        startScenarioMode('cafe');
      } else if (topic === 'directions') {
        startScenarioMode('directions');
      } else if (topic === 'technical' || topic === 'technique') {
        startScenarioMode('technical');
      } else if (topic === 'debate' || topic === 'débat') {
        startScenarioMode('debate');
      } else {
        appendMessage("❌ Scénario inconnu. Essayez : `cmd:scenario cafe`, `cmd:scenario directions`, `cmd:scenario technical`, ou `cmd:scenario debate`.", 'coach');
      }
    } 
    else {
      appendMessage("❌ Commande invalide. Entrez : `cmd:vocab` ou `cmd:scenario [topic]`.", 'coach');
    }
  }

  // --- ACTIVE SCENARIOS CONTROLLER ---

  function startScenarioMode(key) {
    const sc = scenarios[key];
    if (!sc) return;

    // Verify unlocked capability for intermediate (B1)
    if ((key === 'technical' || key === 'debate') && state.xp < 100) {
      triggerToast("Niveau requis", "Gagnez d'abord 100 XP (Niveau A2 requis) pour relever ces scénarios !", "fa-solid fa-lock");
      return;
    }

    state.activeScenario = key;
    // Clone goals structure
    state.scenarioGoals = sc.goals.map(g => ({ ...g, done: false }));
    
    // Toggle layout banners
    activeScenarioBanner.style.display = 'flex';
    activeScenarioName.textContent = sc.name;
    scenarioGoalsCard.style.display = 'flex';
    coachStatusSubtext.textContent = `Mode Scénario : ${sc.status}`;

    // Render objectives checklist
    renderScenarioGoals();

    // Reset Chat to start fresh roleplay
    chatMessagesContainer.innerHTML = '';
    appendMessage(sc.initialPrompt, 'coach');
    speakFrenchText(sc.initialPrompt);

    triggerToast("Scénario démarré !", `Nouveau jeu de rôle : ${sc.name}`, "fa-solid fa-flag-checkered");
    saveStateToLocalStorage();
  }

  function exitScenarioMode() {
    if (!state.activeScenario) return;
    
    state.activeScenario = null;
    state.scenarioGoals = [];
    
    activeScenarioBanner.style.display = 'none';
    scenarioGoalsCard.style.display = 'none';
    coachStatusSubtext.textContent = "Votre coach de français personnelle";

    chatMessagesContainer.innerHTML = '';
    sendInitialGreeting();
    
    triggerToast("Scénario quitté", "Retour au salon de conversation standard.", "fa-solid fa-door-open");
    saveStateToLocalStorage();
  }

  function renderScenarioGoals() {
    scenarioGoalsList.innerHTML = '';
    state.scenarioGoals.forEach(goal => {
      const div = document.createElement('div');
      div.className = `goal-item ${goal.done ? 'done' : ''}`;
      div.innerHTML = `
        <div class="goal-checkbox">
          <i class="fa-solid fa-check"></i>
        </div>
        <span>${goal.text}</span>
      `;
      scenarioGoalsList.appendChild(div);
    });
  }

  function generateScenarioResponse(userText) {
    const sc = scenarios[state.activeScenario];
    if (!sc) return "";

    let response = "";
    let goalCompleted = false;
    let matchedGoalId = null;

    // Check goals criteria against user input and update completed items
    state.scenarioGoals.forEach(goal => {
      if (goal.regex.test(userText)) {
        if (!goal.done) {
          goal.done = true;
          goalCompleted = true;
          awardXP(15); // Bonus points for hitting goals!
          triggerToast("Objectif Atteint !", `Débloqué : ${goal.text} (+15 XP)`, "fa-solid fa-circle-check");
        }
        matchedGoalId = goal.id; // Remember this matched goal to respond to it!
      }
    });

    if (goalCompleted) {
      renderScenarioGoals();
    }

    // Check if ALL goals are cleared successfully
    const allCleared = state.scenarioGoals.every(g => g.done);
    if (allCleared) {
      setTimeout(() => {
        triggerScenarioVictory();
      }, 1500);
    }

    // Determine conversational matching response from the matched goal ID
    if (matchedGoalId && sc.aiResponses[matchedGoalId]) {
      response = sc.aiResponses[matchedGoalId];
    } else {
      response = sc.aiResponses.fallback;
    }

    return response;
  }

  function triggerScenarioVictory() {
    awardXP(50); // Massive scenario victory points!
    const key = state.activeScenario;
    const sc = scenarios[key];

    // Pop up a beautiful celebration modal/toast
    triggerToast("🏆 SCÉNARIO COMPLÉTÉ !", `Vous avez brillamment réussi "${sc.name}" ! (+50 XP)`, "fa-solid fa-trophy");
    
    // Switch active state node colors on left sidebar
    if (key === 'cafe' || key === 'directions') {
      state.progress = Math.max(state.progress, 50);
      nodeA2.classList.add('completed');
    } else if (key === 'technical' || key === 'debate') {
      state.progress = Math.max(state.progress, 100);
      nodeB1.classList.add('completed');
    }

    updateGlobalProgressTracker();
    exitScenarioMode();
  }

  // --- GENERAL RESPONSES SIMULATOR ---
  function generateGeneralResponse(userText) {
    const text = userText.toLowerCase().trim();

    // 80/20 Rule: Pivot to brief english on structural questions, else speak French
    if (text.includes("why") || text.includes("explain") || text.includes("comment dire") || text.includes("what is")) {
      return "Ah! I can help you clarify that rule. In French, we always align gender and number for adjectives, and some verbs (especially reflexive or movement ones like 'aller') conjugate with 'être'. C'est logique, n'est-ce pas ? Maintenant, réessayons ensemble en français ! Que préférez-vous faire ce week-end ?";
    }

    if (text.includes("bonjour") || text.includes("salut") || text.includes("coucou")) {
      return "Bonjour ! Comment allez-vous aujourd'hui ? J'espère que vous passez une excellente journée. Avez-vous appris de nouveaux mots de français aujourd'hui ?";
    }

    if (text.includes("merci") || text.includes("s'il vous plaît")) {
      return "Je vous en prie ! C'est tout à fait naturel de s'entraider. Avez-vous des projets passionnants prévus ce week-end ?";
    }

    if (text.includes("week-end") || text.includes("samedi") || text.includes("dimanche")) {
      return "Le week-end est le moment idéal pour se reposer, mais aussi pour lire un petit paragraphe en français ! D'ailleurs, quel est votre plat français préféré ? 🥖🍷";
    }

    // Default Conversational fallbacks
    return "C'est très intéressant ce que vous racontez ! J'apprécie beaucoup notre conversation. Dites-m'en plus sur ce sujet, ou alors posez-moi une question sur le vocabulaire !";
  }

  // --- B1 GRAMMAR QUIZ SYSTEM ---
  const quizQuestions = [
    {
      question: "Complétez la phrase : Il faut absolument que nous _________ les échéances de notre projet.",
      options: [
        "respectons",
        "respections",
        "respecterons",
        "avons respecté"
      ],
      correctIndex: 1,
      explanation: "Après la locution impersonnelle 'Il faut que', on doit utiliser le subjonctif présent. Pour 'nous', la terminaison régulière est '-ions' (respections)."
    },
    {
      question: "Soudain, pendant que je __________ dans le salon, un incident technique __________ la réunion de travail.",
      options: [
        "travaillais / a interrompu",
        "ai travaillé / interrompait",
        "travaillerais / interrompt",
        "travaillais / interrompait"
      ],
      correctIndex: 0,
      explanation: "L'imparfait (travaillais) décrit une action continue en arrière-plan (décor), tandis que le passé composé (a interrompu) exprime un événement soudain et délimité dans le temps."
    },
    {
      question: "Choisissez le pronom relatif composé correct : C'est le dossier de gestion pour __________ j'ai passé des heures de recherche.",
      options: [
        "auquel",
        "lequel",
        "dont",
        "laquelle"
      ],
      correctIndex: 1,
      explanation: "'Dossier' est masculin singulier. Après la préposition 'pour', on emploie le pronom relatif composé masculin singulier 'lequel'."
    },
    {
      question: "Complétez : Mes collègues de bureau sont partis déjeuner sans __________ car je devais terminer un rapport urgent.",
      options: [
        "me",
        "je",
        "moi",
        "mon"
      ],
      correctIndex: 2,
      explanation: "Après une préposition comme 'sans', 'avec', 'pour', 'chez', on utilise obligatoirement un pronom disjonctif (moi, toi, lui, elle, nous, vous, eux, elles)."
    },
    {
      question: "Complétez l'hypothèse imaginaire : Si le gouvernement __________ davantage le cyclisme urbain, les citoyens __________ moins leur voiture.",
      options: [
        "encourage / utiliseraient",
        "encourageait / utiliseraient",
        "encouragerait / utiliseraient",
        "encourageait / utiliseront"
      ],
      correctIndex: 1,
      explanation: "Pour exprimer une hypothèse potentielle ou imaginaire au présent, on utilise la structure : Si + Imparfait (encourageait) ➔ Conditionnel Présent (utiliseraient)."
    },
    {
      question: "Complétez la double subjonctive : Bien que l'intelligence artificielle __________ très utile, il faut que nous __________ vigilants.",
      options: [
        "est / soyons",
        "soit / soyons",
        "soit / sommes",
        "sera / serons"
      ],
      correctIndex: 1,
      explanation: "La conjonction de concession 'Bien que' et l'obligation 'Il faut que' régissent toutes deux le subjonctif présent : 'soit' (être, 3e pers. sing.) et 'soyons' (être, 1e pers. plur.)."
    }
  ];

  function startGrammarQuiz() {
    vocabSearchInput.style.display = 'none';
    const quizState = {
      index: 0,
      score: 0,
      questions: [...quizQuestions]
    };
    renderQuizQuestion(quizState);
  }

  function renderQuizQuestion(quizState) {
    vocabularyCardsList.innerHTML = '';
    const currentQ = quizState.questions[quizState.index];
    
    const quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-container';

    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
      <span>Question ${quizState.index + 1} sur ${quizState.questions.length}</span>
      <span>Score: ${quizState.score * 10} XP</span>
    `;
    quizContainer.appendChild(quizHeader);

    const quizQuestion = document.createElement('div');
    quizQuestion.className = 'quiz-question';
    quizQuestion.textContent = currentQ.question;
    quizContainer.appendChild(quizQuestion);

    const quizOptions = document.createElement('div');
    quizOptions.className = 'quiz-options';

    currentQ.options.forEach((opt, idx) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'quiz-option-btn';
      optionBtn.textContent = opt;
      optionBtn.addEventListener('click', () => {
        handleQuizAnswer(quizState, idx, optionBtn, quizOptions);
      });
      quizOptions.appendChild(optionBtn);
    });

    quizContainer.appendChild(quizOptions);
    vocabularyCardsList.appendChild(quizContainer);
  }

  function handleQuizAnswer(quizState, selectedIdx, clickedBtn, optionsContainer) {
    const currentQ = quizState.questions[quizState.index];
    const allBtns = optionsContainer.querySelectorAll('.quiz-option-btn');
    
    allBtns.forEach(btn => btn.setAttribute('disabled', 'true'));

    const isCorrect = selectedIdx === currentQ.correctIndex;
    
    if (isCorrect) {
      clickedBtn.classList.add('correct');
      quizState.score++;
      awardXP(10);
      triggerToast("Bonne Réponse !", "+10 XP !", "fa-solid fa-circle-check");
    } else {
      clickedBtn.classList.add('wrong');
      allBtns[currentQ.correctIndex].classList.add('correct');
      triggerToast("Mauvaise Réponse", "Voyez l'explication ci-dessous.", "fa-solid fa-circle-xmark");
    }

    const container = clickedBtn.closest('.quiz-container');
    
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'quiz-explanation';
    explanationDiv.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px; color: ${isCorrect ? 'var(--color-success)' : 'var(--color-accent)'};">
        <i class="${isCorrect ? 'fa-solid fa-check' : 'fa-solid fa-xmark'}"></i> ${isCorrect ? 'Correct !' : 'Incorrect'}
      </div>
      <div>${currentQ.explanation}</div>
    `;
    container.appendChild(explanationDiv);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'vocab-search';
    nextBtn.style = 'margin-top: 12px; background: var(--gradient-brand); color: white; border: none; font-weight: 700; cursor: pointer; padding: 10px; transition: all var(--transition-fast); width: 100%;';
    
    const isLast = quizState.index === quizState.questions.length - 1;
    nextBtn.textContent = isLast ? "Voir les résultats" : "Question suivante";
    
    nextBtn.addEventListener('click', () => {
      if (isLast) {
        renderQuizResults(quizState);
      } else {
        quizState.index++;
        renderQuizQuestion(quizState);
      }
    });

    container.appendChild(nextBtn);
  }

  function renderQuizResults(quizState) {
    vocabularyCardsList.innerHTML = '';
    vocabSearchInput.style.display = 'block';

    const totalQuestions = quizState.questions.length;
    const finalScore = quizState.score;
    const finalPercent = Math.round((finalScore / totalQuestions) * 100);
    const xpGained = finalScore * 10;

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'quiz-container';
    resultsContainer.style = 'text-align: center; padding: 24px 16px; gap: 16px;';

    let titleText = "Entraînement Terminé !";
    let message = "Excellent travail ! Vous renforcez vos bases B1.";
    let icon = "fa-solid fa-graduation-cap";

    if (finalPercent === 100) {
      titleText = "Sans Faute ! Magnifique !";
      message = "Un score parfait ! Vous maîtrisez la grammaire B1 à la perfection.";
      icon = "fa-solid fa-crown";
    } else if (finalPercent >= 70) {
      titleText = "Très bien joué !";
      message = "Excellente performance. Vos structures complexes de grammaire s'améliorent.";
      icon = "fa-solid fa-star";
    }

    resultsContainer.innerHTML = `
      <div style="font-size: 40px; color: var(--color-warning); margin-bottom: 6px;">
        <i class="${icon}"></i>
      </div>
      <div style="font-size: 16px; font-weight: 800; color: white;">${titleText}</div>
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${message}</div>
      
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 12px; margin: 8px 0; display: flex; justify-content: space-around; align-items: center;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Score</span>
          <span style="font-size: 20px; font-weight: 800; color: white;">${finalScore} / ${totalQuestions}</span>
        </div>
        <div style="display: flex; flex-direction: column; border-left: 1px solid var(--border-glass); padding-left: 20px;">
          <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">XP Gagnés</span>
          <span style="font-size: 20px; font-weight: 800; color: var(--color-primary);">+${xpGained} XP</span>
        </div>
      </div>

      <button id="finish-quiz-btn" class="vocab-search" style="background: var(--gradient-brand); color: white; border: none; font-weight: 700; cursor: pointer; padding: 12px; transition: all var(--transition-fast); width: 100%;">Retour aux Leçons</button>
    `;

    vocabularyCardsList.appendChild(resultsContainer);

    document.getElementById('finish-quiz-btn').addEventListener('click', () => {
      renderVocabulary('grammar');
    });

    state.routineState.Lundi = true;
    saveStateToLocalStorage();
    renderRoutineList();
  }

  // --- FLASHCARDS TAB SYSTEMS ---

  function renderVocabulary(tabName, filterText = "") {
    vocabularyCardsList.innerHTML = '';
    const activeData = tabName === 'vocab' ? vocabularyData : grammarLessonsData;

    // Prepends Grammar Quiz CTA in the grammar tab when not searching
    if (tabName === 'grammar' && !filterText) {
      const quizCtaCard = document.createElement('div');
      quizCtaCard.className = 'quiz-cta-container';
      quizCtaCard.style = 'background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%); border: 1px solid var(--border-glass-focus); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; text-align: center; box-shadow: var(--shadow-sm);';
      quizCtaCard.innerHTML = `
        <span style="font-size: 13px; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fa-solid fa-circle-question" style="color: var(--color-primary);"></i> Défi de Grammaire B1</span>
        <span style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">Prêt à vous tester sur le subjonctif, l'imparfait, les pronoms relatifs et les hypothèses ?</span>
        <button id="start-grammar-quiz-btn" class="vocab-search" style="margin-top: 4px; background: var(--gradient-brand); color: white; border: none; font-weight: 700; cursor: pointer; transition: all var(--transition-fast); padding: 8px; width: 100%;">Lancer le Quiz (+10 XP / Q)</button>
      `;
      vocabularyCardsList.appendChild(quizCtaCard);

      // Hook up start button
      setTimeout(() => {
        const startQuizBtn = document.getElementById('start-grammar-quiz-btn');
        if (startQuizBtn) {
          startQuizBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startGrammarQuiz();
          });
        }
      }, 0);
    }

    activeData.forEach(item => {
      const wordVal = (item.word || item.title).toLowerCase();
      const translVal = item.translation.toLowerCase();
      if (filterText && !wordVal.includes(filterText) && !translVal.includes(filterText)) {
        return;
      }

      const card = document.createElement('div');
      card.className = 'vocab-card';

      if (tabName === 'vocab') {
        card.innerHTML = `
          <div class="vocab-card-inner">
            <div class="vocab-card-front">
              <button class="vocab-pronounce-btn" title="Écouter le mot">
                <i class="fa-solid fa-volume-high"></i>
              </button>
              <span class="vocab-word">${item.word}</span>
              <span class="vocab-category">${item.category}</span>
              <span class="card-hint">Cliquer pour traduire</span>
            </div>
            <div class="vocab-card-back">
              <span class="vocab-translation">${item.translation}</span>
              <span class="vocab-example">Ex: "${item.example}"</span>
              <span class="vocab-desc" style="font-size: 9px; margin-top: 4px; color: var(--color-primary); font-weight: 600;">${item.notes}</span>
              <span class="card-hint">Cliquer pour retourner</span>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="vocab-card-inner">
            <div class="vocab-card-front">
              <span class="vocab-word" style="font-size: 14px;">${item.title}</span>
              <span class="vocab-category">Règle de Grammaire</span>
              <span class="card-hint">Cliquer pour en savoir plus</span>
            </div>
            <div class="vocab-card-back" style="padding: 10px;">
              <span class="vocab-translation" style="font-size: 12px; color: var(--color-primary);">${item.translation}</span>
              <span class="vocab-example">Structure: "${item.notes}"</span>
              <span class="vocab-example" style="margin-top: 4px; font-weight: 600; color: white;">Ex: "${item.example}"</span>
            </div>
          </div>
        `;
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.vocab-pronounce-btn')) return;
        card.classList.toggle('flipped');
      });

      const pronounceBtn = card.querySelector('.vocab-pronounce-btn');
      if (pronounceBtn) {
        pronounceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          speakFrenchText(item.word);
        });
      }

      vocabularyCardsList.appendChild(card);
    });

    if (vocabularyCardsList.children.length === 0) {
      vocabularyCardsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 20px;">Aucun résultat trouvé...</div>`;
    }
  }

  // --- XP & CEFR LEVEL PROGRESSION ---

  function awardXP(amount) {
    state.xp += amount;
    xpCounter.textContent = state.xp;
    
    // Evaluate if leveling up CEFR thresholds
    checkLevelUp();
    updateGlobalProgressTracker();
    saveStateToLocalStorage();
  }

  function checkLevelUp() {
    let nextLevel = 'A1';
    let progressPercentVal = 15;

    if (state.xp >= 250) {
      nextLevel = 'B1';
      progressPercentVal = 100;
    } else if (state.xp >= 100) {
      nextLevel = 'A2';
      progressPercentVal = 55;
    }

    if (nextLevel !== state.cefrLevel) {
      state.cefrLevel = nextLevel;
      state.progress = progressPercentVal;
      
      // Perform graphical level up updates
      changeCEFRLevel(nextLevel);
      triggerToast("NIVEAU DE BLOQUÉ !", `Félicitations, vous avez atteint le niveau ${nextLevel} !`, "fa-solid fa-medal");
    }
  }

  function changeCEFRLevel(level) {
    state.cefrLevel = level;
    
    // Update badge details
    if (level === 'A1') {
      cefrLevelText.textContent = "A1 Débutant";
      cefrIndicatorBadge.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.35)";
      
      nodeA1.classList.add('active-node');
      nodeA2.classList.remove('active-node');
      nodeB1.classList.remove('active-node');
    } 
    else if (level === 'A2') {
      cefrLevelText.textContent = "A2 Intermédiaire";
      cefrIndicatorBadge.style.boxShadow = "0 4px 12px rgba(168, 85, 247, 0.35)";
      
      nodeA2.classList.remove('locked');
      nodeA2.classList.add('active-node');
      nodeA1.classList.remove('active-node');
      nodeB1.classList.remove('active-node');
      
      // Unlock A2 nodes icon
      nodeA2.querySelector('.skill-icon').innerHTML = "A2";
    } 
    else if (level === 'B1') {
      cefrLevelText.textContent = "B1 Autonome";
      cefrIndicatorBadge.style.boxShadow = "0 4px 12px rgba(244, 63, 94, 0.35)";
      
      nodeB1.classList.remove('locked');
      nodeB1.classList.add('active-node');
      nodeA1.classList.remove('active-node');
      nodeA2.classList.remove('active-node');
      
      // Unlock B1 nodes icon
      nodeB1.querySelector('.skill-icon').innerHTML = "B1";
    }

    renderSkillTreeNodes();
    saveStateToLocalStorage();
  }

  function renderSkillTreeNodes() {
    // A1
    nodeA1.className = `skill-node ${state.cefrLevel === 'A1' ? 'active-node' : ''} completed`;
    
    // A2
    if (state.xp >= 100) {
      nodeA2.classList.remove('locked');
      nodeA2.querySelector('.skill-icon').innerHTML = "A2";
      nodeA2.className = `skill-node ${state.cefrLevel === 'A2' ? 'active-node' : ''} completed`;
    } else {
      nodeA2.classList.add('locked');
      nodeA2.querySelector('.skill-icon').innerHTML = "<i class='fa-solid fa-lock'></i>";
    }

    // B1
    if (state.xp >= 250) {
      nodeB1.classList.remove('locked');
      nodeB1.querySelector('.skill-icon').innerHTML = "B1";
      nodeB1.className = `skill-node ${state.cefrLevel === 'B1' ? 'active-node' : ''} completed`;
    } else {
      nodeB1.classList.add('locked');
      nodeB1.querySelector('.skill-icon').innerHTML = "<i class='fa-solid fa-lock'></i>";
    }
  }

  function updateGlobalProgressTracker() {
    globalProgressFill.style.width = `${state.progress}%`;
    progressPercent.textContent = `${state.progress}%`;
  }

  // --- POPUP TOAST NOTIFIER SYSTEM ---
  function triggerToast(title, message, iconClass) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="achievement-text">
        <span class="achievement-title">${title}</span>
        <span class="achievement-desc">${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Remove toast from DOM after complete CSS animation keyframes
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // --- LOCALSTORAGE CACHE STORAGE ---
  function saveStateToLocalStorage() {
    localStorage.setItem('french_coach_app_state', JSON.stringify(state));
  }

  function loadStateFromLocalStorage() {
    const raw = localStorage.getItem('french_coach_app_state');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state.xp = parsed.xp || 0;
        state.cefrLevel = parsed.cefrLevel || 'A1';
        state.progress = parsed.progress || 15;
        state.isTtsEnabled = parsed.isTtsEnabled !== undefined ? parsed.isTtsEnabled : true;
        state.isSlowSpeech = parsed.isSlowSpeech !== undefined ? parsed.isSlowSpeech : false;
        state.currentAccent = parsed.currentAccent || 'fr-FR';
        state.chatHistory = parsed.chatHistory || [];
        state.routineState = parsed.routineState || { Lundi: false, Mercredi: false, Vendredi: false, Dimanche: false };
        state.routineBonusClaimed = parsed.routineBonusClaimed !== undefined ? parsed.routineBonusClaimed : false;
        
        // Update view UI based on cached settings
        xpCounter.textContent = state.xp;
        changeCEFRLevel(state.cefrLevel);
        updateGlobalProgressTracker();
        
        audioToggleBtn.classList.toggle('active', state.isTtsEnabled);
        speechSpeedBtn.classList.toggle('active', state.isSlowSpeech);
        if (state.isSlowSpeech) {
          speechSpeedIcon.className = "fa-solid fa-gauge-simple";
        }
        accentLabel.textContent = state.currentAccent === 'fr-FR' ? "FR (FR)" : "FR (CA)";
      } catch (err) {
        console.error("Local Storage Parsing Error:", err);
      }
    }
    // Synchronize weekly routine checklist view with state on startup
    renderRoutineList();
  }

});
