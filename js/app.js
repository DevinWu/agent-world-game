/**
 * Main Application Controller for Agent World Game.
 * Connects UI elements, simulation engine events, canvas visualizer,
 * inspector modal, Worldviews Matrix tab, Cloud Constellation View, and Export System safely.
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
  const btnSound = document.getElementById('btn-sound');
  const btnReset = document.getElementById('btn-reset');

  const statTurns = document.getElementById('stat-turns');
  const statMutations = document.getElementById('stat-mutations');
  const statAwareness = document.getElementById('stat-awareness');

  const tabAcademy = document.getElementById('tab-academy');
  const tabNetwork = document.getElementById('tab-network');
  const tabWorldviews = document.getElementById('tab-worldviews');
  const viewInstruction = document.getElementById('view-instruction');

  const canvasWrapper = document.getElementById('canvas-wrapper');
  const worldviewsContainer = document.getElementById('worldviews-container');
  const worldviewsGrid = document.getElementById('worldviews-grid');
  const worldviewsSearch = document.getElementById('worldviews-search');
  const worldviewsDomainFilter = document.getElementById('worldviews-domain-filter');

  const mutationContainer = document.getElementById('mutation-cards-container');
  const mutationBadge = document.getElementById('mutation-count-badge');
  const feedList = document.getElementById('feed-list');
  const leaderboardList = document.getElementById('leaderboard-list');

  // Modal Elements
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

      item.innerHTML = `
        <div class="leader-info">
          <span>${agent.icon}</span>
          <div>
            <strong style="font-size: 0.82rem;">${agent.name}</strong>
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

    engine.agents.forEach(agent => {
      if (domainFilter !== 'ALL') {
        if (!agent.domain.toLowerCase().includes(domainFilter.toLowerCase())) {
          return;
        }
      }

      if (query) {
        const matchesName = agent.name.toLowerCase().includes(query);
        const matchesTitle = agent.title.toLowerCase().includes(query);
        const matchesBelief = agent.top10Understandings.some(u => u.toLowerCase().includes(query));
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
              <strong style="font-size: 0.95rem; color: #f8fafc;">${agent.name}</strong>
              <div style="font-size: 0.75rem; color: #94a3b8;">${agent.domain}</div>
            </div>
          </div>
          <button class="btn btn-secondary inspect-btn" style="padding: 4px 8px; font-size: 0.72rem;">Inspect 🔍</button>
        </div>

        <div class="belief-list-compact">
          ${agent.top10Understandings.map((u, i) => {
            const isMutated = u !== agent.initialUnderstandings[i];
            return `
              <div class="belief-item-compact ${isMutated ? 'mutated' : ''}">
                <strong>#${i + 1}</strong>
                <div>
                  ${u}
                  ${isMutated ? `<span style="color:#a855f7; font-weight:700; font-size:0.68rem; display:block;">⚡ Evolved</span>` : ''}
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

  function startSimulation() {
    if (engine.winnerAgent) {
      console.log("Game already finished via Epiphany. Click Reset to run a new simulation.");
      return;
    }

    SoundEngine.init();

    engine.isRunning = true;
    playIcon.textContent = '⏸';
    playText.textContent = 'Pause Simulation';

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
    playText.textContent = 'Resume Simulation';
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
    btnSound.textContent = SoundEngine.enabled ? '🔊 Sound ON' : '🔇 Sound OFF';
    btnSound.className = SoundEngine.enabled ? 'btn btn-secondary' : 'btn btn-danger';
  });

  btnReset.addEventListener('click', () => {
    pauseSimulation();
    engine.init();
    feedList.innerHTML = '';
    mutationContainer.innerHTML = `<div style="color: #64748b; font-size: 0.8rem; padding: 10px;">Simulation reset. Start simulation to observe worldview shifts!</div>`;
    mutationBadge.textContent = '0 Events';
    statTurns.textContent = '0';
    statMutations.textContent = '0';
    statAwareness.textContent = '0%';
    epiphanyModal.classList.remove('active');
    updateLeaderboard();
    if (currentActiveTab === 'worldviews') {
      renderWorldviewsMatrix();
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
    canvasWrapper.style.display = 'block';
    worldviewsContainer.style.display = 'none';
    viewInstruction.textContent = 'Click any agent node to inspect Top 10 World Understandings';
    visualizer.setViewMode('academy');
  });

  tabNetwork.addEventListener('click', () => {
    currentActiveTab = 'network';
    tabNetwork.classList.add('active');
    tabAcademy.classList.remove('active');
    tabWorldviews.classList.remove('active');
    canvasWrapper.style.display = 'block';
    worldviewsContainer.style.display = 'none';
    viewInstruction.textContent = 'Organic Cloud Constellation: Connection Badges (💬 N) show 10+ turn chats';
    visualizer.setViewMode('network');
  });

  tabWorldviews.addEventListener('click', () => {
    currentActiveTab = 'worldviews';
    tabWorldviews.classList.add('active');
    tabAcademy.classList.remove('active');
    tabNetwork.classList.remove('active');
    canvasWrapper.style.display = 'none';
    worldviewsContainer.style.display = 'flex';
    viewInstruction.textContent = 'Live matrix of all 25 agents and their Top 10 understandings';
    visualizer.setViewMode('worldviews');
    renderWorldviewsMatrix();
  });

  worldviewsSearch.addEventListener('input', renderWorldviewsMatrix);
  worldviewsDomainFilter.addEventListener('change', renderWorldviewsMatrix);

  // Engine Event Handlers
  engine.on('turn', (log) => {
    statTurns.textContent = log.turn;
    SoundEngine.playDialoguePop();

    // Fetch full agent objects from agentMap for exact visual rendering
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

    const card = document.createElement('div');
    card.className = 'feed-card';
    card.innerHTML = `
      <div class="feed-card-header">
        <span>Turn #${log.turn} • Session (${log.sessionTurn}/${log.totalSessionTurns})</span>
        <span class="feed-inspiration">⚡ Inspiration: ${log.inspirationScore}/100</span>
      </div>
      <div class="feed-dialogue-line">
        <span style="color: ${log.agentA.color};">${log.agentA.icon} ${log.agentA.name}:</span> ${log.exchange.dialogueLines[0].text}
      </div>
      <div class="feed-dialogue-line">
        <span style="color: ${log.agentB.color};">${log.agentB.icon} ${log.agentB.name}:</span> ${log.exchange.dialogueLines[1].text}
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
    mutationBadge.textContent = `${engine.beliefMutations.length} Events`;
    SoundEngine.playBeliefMutationSound();

    if (mutationContainer.children[0]?.style?.color === 'rgb(100, 116, 139)') {
      mutationContainer.innerHTML = '';
    }

    const card = document.createElement('div');
    card.className = 'mutation-card';
    card.innerHTML = `
      <div class="mutation-card-header">
        <span class="mutation-card-agent" style="color: ${m.agentColor};">${m.agentIcon} ${m.agentName}</span>
        <span style="color: #a855f7; font-weight: 700;">#${m.index} Mutated</span>
      </div>
      <div class="mutation-card-diff">
        <del>Was: "${m.oldBelief.slice(0, 45)}..."</del><br>
        <ins>Now: "${m.newBelief.slice(0, 50)}..."</ins>
      </div>
      <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px;">
        Inspired by: <strong>${m.inspiredByName}</strong> (Score: ${m.inspirationScore})
      </div>
    `;

    mutationContainer.insertBefore(card, mutationContainer.firstChild);

    if (selectedAgentId === m.agentId) {
      openAgentModal(m.agentId);
    }

    if (currentActiveTab === 'worldviews') {
      renderWorldviewsMatrix();
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
        const item = document.createElement('div');
        item.style.background = 'rgba(30, 41, 59, 0.6)';
        item.style.border = '1px solid rgba(0, 243, 255, 0.2)';
        item.style.borderRadius = '8px';
        item.style.padding = '8px 12px';
        item.style.fontSize = '0.8rem';
        item.style.lineHeight = '1.4';

        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="font-weight: 700; color: ${m.agentColor};">
              #${idx + 1} • ${m.agentIcon} <strong>${m.agentName}</strong> (Understanding #${m.index})
            </div>
            <span style="font-size: 0.7rem; background: rgba(0, 243, 255, 0.15); color: #00f3ff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              Inspired by ${m.inspiredByName} (${m.inspirationScore}/100)
            </span>
          </div>
          <div style="color: #f8fafc; font-style: italic;">
            "${m.newBelief}"
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
    modalName.textContent = agent.name;
    modalTitle.textContent = `${agent.title} (${agent.era})`;
    modalAvatar.textContent = agent.icon;
    modalAvatar.style.borderColor = agent.color;
    modalDomain.textContent = agent.domain;
    modalDialogues.textContent = agent.totalDialogues;
    modalAwareness.textContent = `${Math.round(agent.existentialAwareness)}%`;

    modalUnderstandings.innerHTML = '';
    agent.top10Understandings.forEach((u, i) => {
      const item = document.createElement('div');
      item.className = 'understanding-item';
      const isMutated = u !== agent.initialUnderstandings[i];
      if (isMutated) {
        item.style.borderLeftColor = '#a855f7';
        item.style.background = 'rgba(168, 85, 247, 0.12)';
      }
      item.innerHTML = `
        <span class="understanding-num">#${i + 1}</span>
        <div>
          <div>${u}</div>
          ${isMutated ? `<span style="font-size: 0.7rem; color: #a855f7; font-weight: 700;">⚡ Evolved Worldview Belief</span>` : ''}
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
        const pill = document.createElement('div');
        pill.className = 'stat-pill';
        pill.style.cursor = 'pointer';
        pill.innerHTML = `${partner.icon} ${partner.name}: <strong style="color: #00f3ff;">${aff.toFixed(2)}x (${chats} chats)</strong>`;
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

  updateLeaderboard();
});
