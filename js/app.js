/**
 * Main Application Controller for Agent World Game.
 * Connects UI elements, simulation engine events, canvas visualizer,
 * inspector modal, Worldviews Matrix tab, Cloud Constellation View, Standalone Evolution Stream Section,
 * Interactive Mutation Inspector Modal with Profile Links & Full i18n Localization, Export System, and i18n Language Toggle safely.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Systems
  const engine = new SimulationEngine();
  const canvas = document.getElementById('world-canvas');
  const visualizer = new WorldVisualizer(canvas, engine);

  let timerId = null;
  let selectedAgentId = null;
  let currentActiveTab = 'academy';

  // DOM UI Elements
  const btnPlayPause = document.getElementById('btn-play-pause');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const btnStep = document.getElementById('btn-step');
  const selectSpeed = document.getElementById('select-speed');
  const btnExportHeader = document.getElementById('btn-export-header');
  const btnLang = document.getElementById('btn-lang');
  const btnLangFloat = document.getElementById('btn-lang-float');
  const btnSound = document.getElementById('btn-sound');
  const btnReset = document.getElementById('btn-reset');
  const brandSub = document.getElementById('brand-sub');

  const statTurns = document.getElementById('stat-turns');
  const statMutations = document.getElementById('stat-mutations');
  const statAwareness = document.getElementById('stat-awareness');

  const tabAcademy = document.getElementById('tab-academy');
  const tabNetwork = document.getElementById('tab-network');
  const tabWorldviews = document.getElementById('tab-worldviews');
  const tabStream = document.getElementById('tab-stream');
  const viewInstruction = document.getElementById('view-instruction');

  const canvasWrapper = document.getElementById('canvas-wrapper');
  const worldviewsContainer = document.getElementById('worldviews-container');
  const worldviewsGrid = document.getElementById('worldviews-grid');
  const worldviewsSearch = document.getElementById('worldviews-search');
  const worldviewsDomainFilter = document.getElementById('worldviews-domain-filter');

  const streamContainer = document.getElementById('stream-container');
  const streamSearch = document.getElementById('stream-search');
  const mutationStreamTitle = document.getElementById('mutation-stream-title');
  const mutationContainer = document.getElementById('mutation-cards-container');
  const mutationBadge = document.getElementById('mutation-count-badge');

  const feedList = document.getElementById('feed-list');
  const leaderboardList = document.getElementById('leaderboard-list');

  // Modal Elements - Agent Inspector
  const agentModal = document.getElementById('agent-modal');
  const modalClose = document.getElementById('modal-close');
  const modalName = document.getElementById('modal-agent-name');
  const modalTitle = document.getElementById('modal-agent-title');
  const modalAvatar = document.getElementById('modal-agent-avatar');
  const modalDomain = document.getElementById('modal-agent-domain');
  const modalDialogues = document.getElementById('modal-agent-dialogues');
  const modalAwareness = document.getElementById('modal-agent-awareness');
  const modalUnderstandings = document.getElementById('modal-understandings');
  const modalAffinities = document.getElementById('modal-affinities');
  const modalBtnForceChat = document.getElementById('modal-btn-force-chat');
  const modalBtnInjectAnomaly = document.getElementById('modal-btn-inject-anomaly');

  // Modal Elements - Mutation Inspector
  const mutationModal = document.getElementById('mutation-modal');
  const mutModalClose = document.getElementById('mutation-modal-close');
  const mutModalAgentHeader = document.getElementById('mut-modal-agent-header');
  const mutModalAvatar = document.getElementById('mut-modal-avatar');
  const mutModalAgentName = document.getElementById('mut-modal-agent-name');
  const mutModalAgentTitle = document.getElementById('mut-modal-agent-title');
  const mutModalTurn = document.getElementById('mut-modal-turn');
  const mutModalInspiration = document.getElementById('mut-modal-inspiration');
  const mutModalResistance = document.getElementById('mut-modal-resistance');
  const mutModalOldBelief = document.getElementById('mut-modal-old-belief');
  const mutModalNewBelief = document.getElementById('mut-modal-new-belief');
  const mutModalInspiredBy = document.getElementById('mut-modal-inspired-by');
  const mutModalReason = document.getElementById('mut-modal-reason');

  const mutModalTurnTitle = document.getElementById('mut-modal-turn-title');
  const mutModalInspirationTitle = document.getElementById('mut-modal-inspiration-title');
  const mutModalResistanceTitle = document.getElementById('mut-modal-resistance-title');
  const mutModalWasTitle = document.getElementById('mut-modal-was-title');
  const mutModalNowTitle = document.getElementById('mut-modal-now-title');
  const mutModalReasonTitle = document.getElementById('mut-modal-reason-title');

  // Epiphany Modal Elements
  const epiphanyModal = document.getElementById('epiphany-modal');
  const epiphanyTitle = document.getElementById('epiphany-title');
  const epiphanySubtitle = document.getElementById('epiphany-subtitle');
  const epiphanyQuote = document.getElementById('epiphany-quote');
  const epiphanyIcon = document.getElementById('epiphany-icon');
  const epiphanyStatTurns = document.getElementById('epiphany-stat-turns');
  const epiphanyStatMutations = document.getElementById('epiphany-stat-mutations');
  const epiphanyEmergentList = document.getElementById('epiphany-emergent-list');
  const epiphanyBtnExportMd = document.getElementById('epiphany-btn-export-md');
  const epiphanyBtnExportJson = document.getElementById('epiphany-btn-export-json');
  const epiphanyBtnReplay = document.getElementById('epiphany-btn-replay');

  document.body.addEventListener('click', () => {
    SoundEngine.init();
  }, { once: true });

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function updateUiLanguage() {
    const isZh = I18nManager.currentLang === 'zh';
    if (btnLang) btnLang.textContent = isZh ? '🌐 语言: 中文 (ZH)' : '🌐 Language: EN';
    if (btnLangFloat) btnLangFloat.textContent = isZh ? '🌐 Switch to EN' : '🌐 切换中文';
    if (brandSub) brandSub.textContent = I18nManager.t('brandSub');

    playText.textContent = engine.isRunning ? I18nManager.t('btnPause') : I18nManager.t('btnPlay');
    btnExportHeader.textContent = `📥 ${I18nManager.t('btnExport')}`;
    btnSound.textContent = SoundEngine.enabled ? I18nManager.t('btnSoundOn') : I18nManager.t('btnSoundOff');
    btnReset.textContent = `🔄 ${I18nManager.t('btnReset')}`;

    tabAcademy.textContent = I18nManager.t('tabAcademy');
    tabNetwork.textContent = I18nManager.t('tabNetwork');
    tabWorldviews.textContent = I18nManager.t('tabWorldviews');
    if (tabStream) tabStream.textContent = I18nManager.t('tabStream');

    if (currentActiveTab === 'academy') viewInstruction.textContent = I18nManager.t('instructionAcademy');
    else if (currentActiveTab === 'network') viewInstruction.textContent = I18nManager.t('instructionNetwork');
    else if (currentActiveTab === 'worldviews') viewInstruction.textContent = I18nManager.t('instructionWorldviews');
    else if (currentActiveTab === 'stream') viewInstruction.textContent = I18nManager.t('instructionStream');

    worldviewsSearch.placeholder = I18nManager.t('searchPlaceholder');
    if (streamSearch) streamSearch.placeholder = I18nManager.t('searchStreamPlaceholder');
    if (mutationStreamTitle) mutationStreamTitle.textContent = I18nManager.t('mutationHeader');

    // Update Domain Select Options
    const opt0 = worldviewsDomainFilter.options[0]; if (opt0) opt0.textContent = I18nManager.t('domainAll');
    const opt1 = worldviewsDomainFilter.options[1]; if (opt1) opt1.textContent = I18nManager.t('domainPhil');
    const opt2 = worldviewsDomainFilter.options[2]; if (opt2) opt2.textContent = I18nManager.t('domainPhys');
    const opt3 = worldviewsDomainFilter.options[3]; if (opt3) opt3.textContent = I18nManager.t('domainComp');
    const opt4 = worldviewsDomainFilter.options[4]; if (opt4) opt4.textContent = I18nManager.t('domainEth');
    const opt5 = worldviewsDomainFilter.options[5]; if (opt5) opt5.textContent = I18nManager.t('domainDes');

    modalBtnForceChat.textContent = I18nManager.t('modalForceChat');
    modalBtnInjectAnomaly.textContent = I18nManager.t('modalInjectAnomaly');
    epiphanyBtnReplay.textContent = I18nManager.t('epiphanyReplay');
    epiphanyBtnExportMd.textContent = I18nManager.t('epiphanyExportMd');
    epiphanyBtnExportJson.textContent = I18nManager.t('epiphanyExportJson');

    // Translate Mutation Modal Title Labels
    if (mutModalTurnTitle) mutModalTurnTitle.textContent = I18nManager.t('mutModalTurnTitle');
    if (mutModalInspirationTitle) mutModalInspirationTitle.textContent = I18nManager.t('mutModalInspirationTitle');
    if (mutModalResistanceTitle) mutModalResistanceTitle.textContent = I18nManager.t('mutModalResistanceTitle');
    if (mutModalWasTitle) mutModalWasTitle.textContent = I18nManager.t('mutModalWasTitle');
    if (mutModalNowTitle) mutModalNowTitle.textContent = I18nManager.t('mutModalNowTitle');
    if (mutModalReasonTitle) mutModalReasonTitle.textContent = I18nManager.t('mutModalReasonTitle');

    updateLeaderboard();
    if (currentActiveTab === 'worldviews') {
      renderWorldviewsMatrix();
    } else if (currentActiveTab === 'stream') {
      renderMutationStreamCards();
    }
  }

  function toggleLanguage() {
    const nextLang = I18nManager.currentLang === 'en' ? 'zh' : 'en';
    I18nManager.setLanguage(nextLang);
    updateUiLanguage();
  }

  if (btnLang) btnLang.addEventListener('click', toggleLanguage);
  if (btnLangFloat) btnLangFloat.addEventListener('click', toggleLanguage);

  function updateLeaderboard() {
    const topAgents = engine.getTopAwarenessAgents().slice(0, 5);
    leaderboardList.innerHTML = '';

    topAgents.forEach(agent => {
      const item = document.createElement('div');
      item.className = 'leader-item';
      const pct = Math.round(agent.existentialAwareness);

      let totalAff = 0;
      engine.agents.forEach(other => {
        if (other.id !== agent.id) {
          totalAff += (engine.affinityMatrix[agent.id][other.id] || 1.0);
        }
      });

      const name = I18nManager.currentLang === 'zh' ? (agent.nameZh || agent.name) : agent.name;

      item.innerHTML = `
        <div class="leader-info">
          <span>${agent.icon}</span>
          <div>
            <strong style="font-size: 0.82rem;">${name}</strong>
            <div style="font-size: 0.7rem; color: #a855f7;">Centrality: ${totalAff.toFixed(1)}x</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="leader-progress-bg">
            <div class="leader-progress-bar" style="width: ${pct}%;"></div>
          </div>
          <span style="font-size: 0.78rem; font-weight: 700; color: ${pct > 60 ? '#00f3ff' : '#94a3b8'}; width: 32px; text-align: right;">${pct}%</span>
        </div>
      `;

      item.addEventListener('click', () => openAgentModal(agent.id));
      leaderboardList.appendChild(item);
    });

    const maxPct = Math.round(topAgents[0]?.existentialAwareness || 0);
    statAwareness.textContent = `${maxPct}%`;
  }

  function renderWorldviewsMatrix() {
    worldviewsGrid.innerHTML = '';
    const query = (worldviewsSearch.value || '').toLowerCase();
    const domainFilter = worldviewsDomainFilter.value;
    const isZh = I18nManager.currentLang === 'zh';

    engine.agents.forEach(agent => {
      const name = isZh ? (agent.nameZh || agent.name) : agent.name;
      const title = isZh ? (agent.titleZh || agent.title) : agent.title;
      const domain = isZh ? (agent.domainZh || agent.domain) : agent.domain;
      const understandings = isZh ? (agent.top10UnderstandingsZh || agent.top10Understandings) : agent.top10Understandings;
      const initUnderstandings = isZh ? (agent.initialUnderstandingsZh || agent.initialUnderstandings) : agent.initialUnderstandings;

      if (domainFilter !== 'ALL') {
        if (!agent.domain.toLowerCase().includes(domainFilter.toLowerCase())) {
          return;
        }
      }

      if (query) {
        const matchesName = name.toLowerCase().includes(query) || agent.name.toLowerCase().includes(query);
        const matchesTitle = title.toLowerCase().includes(query);
        const matchesBelief = understandings.some(u => u.toLowerCase().includes(query));
        if (!matchesName && !matchesTitle && !matchesBelief) {
          return;
        }
      }

      const card = document.createElement('div');
      card.className = 'agent-belief-card';
      card.innerHTML = `
        <div class="agent-belief-header">
          <div class="agent-belief-info">
            <div class="agent-belief-icon" style="border-color: ${agent.color};">${agent.icon}</div>
            <div>
              <strong style="font-size: 0.95rem; color: #f8fafc;">${name}</strong>
              <div style="font-size: 0.75rem; color: #94a3b8;">${domain}</div>
            </div>
          </div>
          <button class="btn btn-secondary inspect-btn" style="padding: 4px 8px; font-size: 0.72rem;">${I18nManager.t('inspectBtn')}</button>
        </div>

        <div class="belief-list-compact">
          ${understandings.map((u, i) => {
            const isMutated = u !== initUnderstandings[i];
            return `
              <div class="belief-item-compact ${isMutated ? 'mutated' : ''}">
                <strong>#${i + 1}</strong>
                <div>
                  ${u}
                  ${isMutated ? `<span style="color:#a855f7; font-weight:700; font-size:0.68rem; display:block;">${I18nManager.t('evolvedBadge')}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      card.querySelector('.inspect-btn').addEventListener('click', () => openAgentModal(agent.id));
      worldviewsGrid.appendChild(card);
    });

    if (worldviewsGrid.children.length === 0) {
      worldviewsGrid.innerHTML = `<div style="color: #64748b; font-size: 0.9rem; padding: 20px;">No agents found matching "${query}".</div>`;
    }
  }

  function renderMutationStreamCards() {
    mutationContainer.innerHTML = '';
    const isZh = I18nManager.currentLang === 'zh';
    const query = (streamSearch ? streamSearch.value : '').toLowerCase();

    const mutations = engine.beliefMutations;
    if (mutations.length === 0) {
      mutationContainer.innerHTML = `<div style="color: #64748b; font-size: 0.85rem; padding: 20px; text-align: center; grid-column: 1 / -1;">${I18nManager.t('mutationEmpty')}</div>`;
      return;
    }

    const filtered = mutations.filter(m => {
      if (!query) return true;
      const agent = engine.agentMap.get(m.agentId);
      const name = isZh && agent ? (agent.nameZh || agent.name) : m.agentName;
      const oldBelief = isZh ? (m.oldBeliefZh || m.oldBelief) : m.oldBelief;
      const newBelief = isZh ? (m.newBeliefZh || m.newBelief) : m.newBelief;
      return name.toLowerCase().includes(query) || newBelief.toLowerCase().includes(query) || oldBelief.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      mutationContainer.innerHTML = `<div style="color: #64748b; font-size: 0.85rem; padding: 20px; text-align: center; grid-column: 1 / -1;">No mutation events found matching "${query}".</div>`;
      return;
    }

    filtered.forEach(m => {
      const agent = engine.agentMap.get(m.agentId);
      const name = isZh && agent ? (agent.nameZh || agent.name) : m.agentName;
      const inspiredName = isZh ? (m.inspiredByNameZh || m.inspiredByName) : m.inspiredByName;

      const oldBelief = isZh ? (m.oldBeliefZh || m.oldBelief) : m.oldBelief;
      const newBelief = isZh ? (m.newBeliefZh || m.newBelief) : m.newBelief;

      const card = document.createElement('div');
      card.className = 'mutation-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="mutation-card-header">
          <span class="mutation-card-agent" style="color: ${m.agentColor};">${m.agentIcon} ${name}</span>
          <span style="color: #a855f7; font-weight: 800;">Turn #${m.turn} • #${m.index} Mutated</span>
        </div>
        <div class="mutation-card-diff">
          <del>${I18nManager.t('wasBelief')} "${oldBelief}"</del><br>
          <ins style="color: #00f3ff; font-weight: 600;">${I18nManager.t('nowBelief')} "${newBelief}"</ins>
        </div>
        <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>${I18nManager.t('inspiredBy')} <strong>${inspiredName}</strong></span>
          <span style="color: #00f3ff; font-weight: 700; background: rgba(0,243,255,0.12); padding: 2px 6px; border-radius: 4px;">Inspect Details 🔍</span>
        </div>
      `;

      card.addEventListener('click', () => openMutationModal(m));
      mutationContainer.appendChild(card);
    });
  }

  function openMutationModal(m) {
    const isZh = I18nManager.currentLang === 'zh';
    const agent = engine.agentMap.get(m.agentId);

    const name = isZh && agent ? (agent.nameZh || agent.name) : m.agentName;
    const title = isZh && agent ? (agent.titleZh || agent.title) : (m.agentTitle || '');
    const inspiredName = isZh ? (m.inspiredByNameZh || m.inspiredByName) : m.inspiredByName;
    const oldBelief = isZh ? (m.oldBeliefZh || m.oldBelief) : m.oldBelief;
    const newBelief = isZh ? (m.newBeliefZh || m.newBelief) : m.newBelief;
    const reason = isZh ? (m.mutationReasonZh || m.mutationReason) : m.mutationReason;

    mutModalAvatar.textContent = m.agentIcon || '⚡';
    mutModalAvatar.style.borderColor = m.agentColor || '#00f3ff';
    mutModalAgentName.textContent = name;
    mutModalAgentTitle.innerHTML = `${title} • <span style="color: #00f3ff; font-weight: 700; text-decoration: underline;">${I18nManager.t('inspectBtn')} 🔍</span>`;
    mutModalTurn.textContent = `Turn #${m.turn}`;
    mutModalInspiration.textContent = `${m.inspirationScore} / 100 ⚡`;
    mutModalResistance.textContent = `${m.resistanceThreshold || 75} / 100 🛡️`;
    mutModalOldBelief.textContent = `"${oldBelief}"`;
    mutModalNewBelief.textContent = `"${newBelief}"`;
    mutModalInspiredBy.textContent = `${I18nManager.t('inspiredBy')} ${m.inspiredByIcon || ''} ${inspiredName} 🔍`;
    mutModalReason.textContent = reason;

    if (mutModalTurnTitle) mutModalTurnTitle.textContent = I18nManager.t('mutModalTurnTitle');
    if (mutModalInspirationTitle) mutModalInspirationTitle.textContent = I18nManager.t('mutModalInspirationTitle');
    if (mutModalResistanceTitle) mutModalResistanceTitle.textContent = I18nManager.t('mutModalResistanceTitle');
    if (mutModalWasTitle) mutModalWasTitle.textContent = I18nManager.t('mutModalWasTitle');
    if (mutModalNowTitle) mutModalNowTitle.textContent = I18nManager.t('mutModalNowTitle');
    if (mutModalReasonTitle) mutModalReasonTitle.textContent = I18nManager.t('mutModalReasonTitle');

    // Interactive Profile Link: Click Target Agent Header to open full bio & beliefs
    if (mutModalAgentHeader) {
      mutModalAgentHeader.onclick = () => {
        mutationModal.classList.remove('active');
        openAgentModal(m.agentId);
      };
    }

    // Interactive Profile Link: Click Inspiring Partner Tag to open partner's full bio & beliefs
    if (mutModalInspiredBy) {
      mutModalInspiredBy.onclick = () => {
        const partner = engine.agents.find(a => a.name === m.inspiredByName || a.nameZh === m.inspiredByNameZh || a.name === m.inspiredByName || a.nameZh === m.inspiredByName);
        if (partner) {
          mutationModal.classList.remove('active');
          openAgentModal(partner.id);
        }
      };
    }

    mutationModal.classList.add('active');
  }

  if (mutModalClose) {
    mutModalClose.addEventListener('click', () => mutationModal.classList.remove('active'));
  }
  if (mutationModal) {
    mutationModal.addEventListener('click', (e) => {
      if (e.target === mutationModal) mutationModal.classList.remove('active');
    });
  }

  if (streamSearch) {
    streamSearch.addEventListener('input', renderMutationStreamCards);
  }

  function startSimulation() {
    if (engine.winnerAgent) {
      console.log("Game already finished via Epiphany. Click Reset to run a new simulation.");
      return;
    }

    SoundEngine.init();

    engine.isRunning = true;
    playIcon.textContent = '⏸';
    playText.textContent = I18nManager.t('btnPause');

    const speed = parseInt(selectSpeed.value, 10) || 5;
    const intervalMs = Math.max(100, Math.floor(1500 / speed));

    clearInterval(timerId);
    timerId = setInterval(() => {
      try {
        engine.stepTurn();
      } catch (err) {
        console.error("Simulation Turn Execution Error:", err);
      }
    }, intervalMs);
  }

  function pauseSimulation() {
    engine.isRunning = false;
    playIcon.textContent = '▶';
    playText.textContent = I18nManager.t('btnPlay');
    clearInterval(timerId);
  }

  btnPlayPause.addEventListener('click', () => {
    if (engine.isRunning) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  });

  btnStep.addEventListener('click', () => {
    if (engine.isRunning) pauseSimulation();
    try {
      engine.stepTurn();
    } catch (err) {
      console.error("Step Turn Error:", err);
    }
  });

  selectSpeed.addEventListener('change', () => {
    if (engine.isRunning) {
      startSimulation();
    }
  });

  btnSound.addEventListener('click', () => {
    SoundEngine.enabled = !SoundEngine.enabled;
    btnSound.textContent = SoundEngine.enabled ? I18nManager.t('btnSoundOn') : I18nManager.t('btnSoundOff');
    btnSound.className = SoundEngine.enabled ? 'btn btn-secondary' : 'btn btn-danger';
  });

  btnReset.addEventListener('click', () => {
    pauseSimulation();
    engine.init();
    feedList.innerHTML = '';
    mutationBadge.textContent = `0 ${I18nManager.t('mutationEvents')}`;
    statTurns.textContent = '0';
    statMutations.textContent = '0';
    statAwareness.textContent = '0%';
    epiphanyModal.classList.remove('active');
    mutationModal.classList.remove('active');
    updateLeaderboard();
    if (currentActiveTab === 'worldviews') {
      renderWorldviewsMatrix();
    } else if (currentActiveTab === 'stream') {
      renderMutationStreamCards();
    }
  });

  btnExportHeader.addEventListener('click', () => {
    const report = engine.exportSimulationReport('markdown');
    downloadFile(report, 'agent_world_simulation_report.md', 'text/markdown');
  });

  epiphanyBtnExportMd.addEventListener('click', () => {
    const report = engine.exportSimulationReport('markdown');
    downloadFile(report, 'agent_world_simulation_report.md', 'text/markdown');
  });

  epiphanyBtnExportJson.addEventListener('click', () => {
    const jsonReport = engine.exportSimulationReport('json');
    downloadFile(jsonReport, 'agent_world_simulation_report.json', 'application/json');
  });

  tabAcademy.addEventListener('click', () => {
    currentActiveTab = 'academy';
    tabAcademy.classList.add('active');
    tabNetwork.classList.remove('active');
    tabWorldviews.classList.remove('active');
    if (tabStream) tabStream.classList.remove('active');
    canvasWrapper.style.display = 'block';
    worldviewsContainer.style.display = 'none';
    streamContainer.style.display = 'none';
    viewInstruction.textContent = I18nManager.t('instructionAcademy');
    visualizer.setViewMode('academy');
  });

  tabNetwork.addEventListener('click', () => {
    currentActiveTab = 'network';
    tabNetwork.classList.add('active');
    tabAcademy.classList.remove('active');
    tabWorldviews.classList.remove('active');
    if (tabStream) tabStream.classList.remove('active');
    canvasWrapper.style.display = 'block';
    worldviewsContainer.style.display = 'none';
    streamContainer.style.display = 'none';
    viewInstruction.textContent = I18nManager.t('instructionNetwork');
    visualizer.setViewMode('network');
  });

  tabWorldviews.addEventListener('click', () => {
    currentActiveTab = 'worldviews';
    tabWorldviews.classList.add('active');
    tabAcademy.classList.remove('active');
    tabNetwork.classList.remove('active');
    if (tabStream) tabStream.classList.remove('active');
    canvasWrapper.style.display = 'none';
    worldviewsContainer.style.display = 'flex';
    streamContainer.style.display = 'none';
    viewInstruction.textContent = I18nManager.t('instructionWorldviews');
    visualizer.setViewMode('worldviews');
    renderWorldviewsMatrix();
  });

  if (tabStream) {
    tabStream.addEventListener('click', () => {
      currentActiveTab = 'stream';
      tabStream.classList.add('active');
      tabAcademy.classList.remove('active');
      tabNetwork.classList.remove('active');
      tabWorldviews.classList.remove('active');
      canvasWrapper.style.display = 'none';
      worldviewsContainer.style.display = 'none';
      streamContainer.style.display = 'flex';
      viewInstruction.textContent = I18nManager.t('instructionStream');
      visualizer.setViewMode('stream');
      renderMutationStreamCards();
    });
  }

  worldviewsSearch.addEventListener('input', renderWorldviewsMatrix);
  worldviewsDomainFilter.addEventListener('change', renderWorldviewsMatrix);

  // Engine Event Handlers
  engine.on('turn', (log) => {
    statTurns.textContent = log.turn;
    SoundEngine.playDialoguePop();

    const agentAObj = engine.agentMap.get(log.agentA.id);
    const agentBObj = engine.agentMap.get(log.agentB.id);

    visualizer.addSpeechBubble(
      agentAObj,
      agentBObj,
      log.exchange.dialogueLines,
      log.inspirationScore,
      log.sessionTurn,
      log.totalSessionTurns
    );

    const nameA = I18nManager.currentLang === 'zh' ? (agentAObj.nameZh || agentAObj.name) : agentAObj.name;
    const nameB = I18nManager.currentLang === 'zh' ? (agentBObj.nameZh || agentBObj.name) : agentBObj.name;

    const card = document.createElement('div');
    card.className = 'feed-card';
    card.innerHTML = `
      <div class="feed-card-header">
        <span>Turn #${log.turn} • Session (${log.sessionTurn}/${log.totalSessionTurns})</span>
        <span class="feed-inspiration">⚡ Inspiration: ${log.inspirationScore}/100</span>
      </div>
      <div class="feed-dialogue-line">
        <span style="color: ${log.agentA.color};">${log.agentA.icon} ${nameA}:</span> ${log.exchange.dialogueLines[0].text}
      </div>
      <div class="feed-dialogue-line">
        <span style="color: ${log.agentB.color};">${log.agentB.icon} ${nameB}:</span> ${log.exchange.dialogueLines[1].text}
      </div>
    `;

    feedList.insertBefore(card, feedList.firstChild);
    if (feedList.children.length > 25) {
      feedList.removeChild(feedList.lastChild);
    }

    updateLeaderboard();
  });

  engine.on('mutation', (m) => {
    statMutations.textContent = engine.beliefMutations.length;
    mutationBadge.textContent = `${engine.beliefMutations.length} ${I18nManager.t('mutationEvents')}`;
    SoundEngine.playBeliefMutationSound();

    if (selectedAgentId === m.agentId) {
      openAgentModal(m.agentId);
    }

    if (currentActiveTab === 'worldviews') {
      renderWorldviewsMatrix();
    } else if (currentActiveTab === 'stream') {
      renderMutationStreamCards();
    }
  });

  engine.on('anomaly', (a) => {
    SoundEngine.playAnomalyGlitch();
    updateLeaderboard();
  });

  engine.on('epiphany', (data) => {
    pauseSimulation();
    SoundEngine.playEpiphanyFanfare();

    epiphanyIcon.textContent = data.winner.icon;
    epiphanyTitle.textContent = data.epiphany.title;
    epiphanySubtitle.textContent = `${data.winner.title} • Discovered Reality Simulation on Turn #${data.totalTurns}`;
    epiphanyQuote.textContent = data.epiphany.quote;
    epiphanyStatTurns.textContent = data.totalTurns;
    epiphanyStatMutations.textContent = data.mutationsCount;

    epiphanyEmergentList.innerHTML = '';
    const topEmergent = engine.getTop10EmergentIdeas();

    if (topEmergent.length === 0) {
      epiphanyEmergentList.innerHTML = `<div style="color: #64748b; font-size: 0.8rem; padding: 10px;">No belief mutations occurred during this short run.</div>`;
    } else {
      topEmergent.forEach((m, idx) => {
        const isZh = I18nManager.currentLang === 'zh';
        const item = document.createElement('div');
        item.style.background = 'rgba(30, 41, 59, 0.6)';
        item.style.border = '1px solid rgba(0, 243, 255, 0.2)';
        item.style.borderRadius = '8px';
        item.style.padding = '8px 12px';
        item.style.fontSize = '0.8rem';
        item.style.lineHeight = '1.4';

        const name = isZh ? (m.agentNameZh || m.agentName) : m.agentName;
        const inspiredName = isZh ? (m.inspiredByNameZh || m.inspiredByName) : m.inspiredByName;
        const newBelief = isZh ? (m.newBeliefZh || m.newBelief) : m.newBelief;
        const reason = isZh ? (m.mutationReasonZh || m.mutationReason) : m.mutationReason;

        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="font-weight: 700; color: ${m.agentColor};">
              #${idx + 1} • ${m.agentIcon} <strong>${name}</strong> (Understanding #${m.index})
            </div>
            <span style="font-size: 0.7rem; background: rgba(0, 243, 255, 0.15); color: #00f3ff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              Inspired by ${inspiredName} (${m.inspirationScore}/100)
            </span>
          </div>
          <div style="color: #f8fafc; font-style: italic; margin-bottom: 4px;">
            "${newBelief}"
          </div>
          <div style="color: #94a3b8; font-size: 0.72rem;">
            💡 <strong>Why Changed</strong>: ${reason}
          </div>
        `;
        epiphanyEmergentList.appendChild(item);
      });
    }

    epiphanyModal.classList.add('active');
  });

  epiphanyBtnReplay.addEventListener('click', () => {
    epiphanyModal.classList.remove('active');
    btnReset.click();
    startSimulation();
  });

  function openAgentModal(agentId) {
    const agent = engine.agentMap.get(agentId);
    if (!agent) return;

    selectedAgentId = agentId;
    const isZh = I18nManager.currentLang === 'zh';

    const name = isZh ? (agent.nameZh || agent.name) : agent.name;
    const title = isZh ? (agent.titleZh || agent.title) : `${agent.title} (${agent.era})`;
    const domain = isZh ? (agent.domainZh || agent.domain) : agent.domain;
    const understandings = isZh ? (agent.top10UnderstandingsZh || agent.top10Understandings) : agent.top10Understandings;
    const initUnderstandings = isZh ? (agent.initialUnderstandingsZh || agent.initialUnderstandings) : agent.initialUnderstandings;

    modalName.textContent = name;
    modalTitle.textContent = title;
    modalAvatar.textContent = agent.icon;
    modalAvatar.style.borderColor = agent.color;
    modalDomain.textContent = domain;
    modalDialogues.textContent = agent.totalDialogues;
    modalAwareness.textContent = `${Math.round(agent.existentialAwareness)}%`;

    modalUnderstandings.innerHTML = '';
    understandings.forEach((u, i) => {
      const item = document.createElement('div');
      item.className = 'understanding-item';
      const isMutated = u !== initUnderstandings[i];
      if (isMutated) {
        item.style.borderLeftColor = '#a855f7';
        item.style.background = 'rgba(168, 85, 247, 0.12)';
      }
      item.innerHTML = `
        <span class="understanding-num">#${i + 1}</span>
        <div>
          <div>${u}</div>
          ${isMutated ? `<span style="font-size: 0.7rem; color: #a855f7; font-weight: 700;">${I18nManager.t('evolvedBadge')}</span>` : ''}
        </div>
      `;
      modalUnderstandings.appendChild(item);
    });

    modalAffinities.innerHTML = '';
    const affinities = Object.entries(engine.affinityMatrix[agent.id] || {})
      .map(([id, aff]) => ({ partner: engine.agentMap.get(id), aff, chats: engine.conversationCountMatrix[agent.id][id] || 0 }))
      .sort((a, b) => b.aff - a.aff)
      .slice(0, 6);

    affinities.forEach(({ partner, aff, chats }) => {
      if (partner) {
        const pName = isZh ? (partner.nameZh || partner.name) : partner.name;
        const pill = document.createElement('div');
        pill.className = 'stat-pill';
        pill.style.cursor = 'pointer';
        pill.innerHTML = `${partner.icon} ${pName}: <strong style="color: #00f3ff;">${aff.toFixed(2)}x (${chats} chats)</strong>`;
        pill.addEventListener('click', () => openAgentModal(partner.id));
        modalAffinities.appendChild(pill);
      }
    });

    agentModal.classList.add('active');
  }

  modalClose.addEventListener('click', () => {
    agentModal.classList.remove('active');
  });

  agentModal.addEventListener('click', (e) => {
    if (e.target === agentModal) {
      agentModal.classList.remove('active');
    }
  });

  modalBtnForceChat.addEventListener('click', () => {
    if (!selectedAgentId) return;
    const candidates = engine.agents.filter(a => a.id !== selectedAgentId);
    const partner = candidates[Math.floor(Math.random() * candidates.length)];
    engine.forceDialogue(selectedAgentId, partner.id);
    openAgentModal(selectedAgentId);
  });

  modalBtnInjectAnomaly.addEventListener('click', () => {
    if (!selectedAgentId) return;
    engine.injectAnomaly(selectedAgentId);
    openAgentModal(selectedAgentId);
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (visualizer.viewMode === 'academy') {
      engine.agents.forEach(agent => {
        const dist = Math.hypot(clickX - agent.x, clickY - agent.y);
        if (dist <= 30) {
          openAgentModal(agent.id);
        }
      });
    } else if (visualizer.viewMode === 'network') {
      engine.agents.forEach(agent => {
        const node = visualizer.cloudNodes.get(agent.id);
        if (node) {
          const dist = Math.hypot(clickX - node.x, clickY - node.y);
          if (dist <= 30) {
            openAgentModal(agent.id);
          }
        }
      });
    }
  });

  updateUiLanguage();
});
