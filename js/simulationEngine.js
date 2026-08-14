/**
 * Simulation Engine for Agent World Game.
 * Manages 25 Agent states, Dynamic Affinity Matrix, Conversation Session Tracker (10+ turns per chat),
 * Numerical Connection Matrix, Worldview Mutation, and Export functionality.
 */

var SimulationEngine = class SimulationEngine {
  constructor() {
    this.agents = [];
    this.agentMap = new Map();
    this.affinityMatrix = {}; // affinityMatrix[idA][idB] = float
    this.conversationCountMatrix = {}; // conversationCountMatrix[idA][idB] = int
    this.turns = 0;
    this.isRunning = false;
    this.historyLogs = [];
    this.beliefMutations = [];
    this.anomalyLogs = [];
    this.winnerAgent = null;
    this.epiphanyData = null;

    // Multi-turn session state (10+ turns per conversation)
    this.activeSession = null;

    this.listeners = {
      turn: [],
      sessionStart: [],
      sessionEnd: [],
      mutation: [],
      anomaly: [],
      epiphany: [],
      reset: []
    };

    this.init();
  }

  init() {
    this.turns = 0;
    this.isRunning = false;
    this.historyLogs = [];
    this.beliefMutations = [];
    this.anomalyLogs = [];
    this.winnerAgent = null;
    this.epiphanyData = null;
    this.activeSession = null;

    const sourceData = (typeof window !== 'undefined' && window.INITIAL_AGENTS_DATA) ? window.INITIAL_AGENTS_DATA : INITIAL_AGENTS_DATA;

    const w = typeof window !== 'undefined' && window.innerWidth ? Math.min(800, window.innerWidth * 0.6) : 700;
    const h = typeof window !== 'undefined' && window.innerHeight ? Math.min(500, window.innerHeight * 0.5) : 450;

    // Evenly distribute 25 agents across a 5x5 grid in 2D Academy World
    this.agents = sourceData.map((d, idx) => {
      const cols = 5;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const startX = 70 + col * ((w - 140) / 4);
      const startY = 70 + row * ((h - 140) / 4);

      return {
        id: d.id,
        name: d.name,
        title: d.title,
        era: d.era,
        domain: d.domain,
        color: d.color || '#00f3ff',
        icon: d.icon || '🏛️',
        baseTraits: [...d.baseTraits],
        top10Understandings: [...d.initialUnderstandings],
        initialUnderstandings: [...d.initialUnderstandings],
        existentialAwareness: 0,
        totalDialogues: 0,
        mutationsCount: 0,
        topInspiringPartnerId: null,
        glitchesObserved: [],
        x: startX,
        y: startY,
        targetX: startX + (Math.random() - 0.5) * 60,
        targetY: startY + (Math.random() - 0.5) * 60,
        state: 'idle'
      };
    });

    this.agentMap.clear();
    this.agents.forEach(a => this.agentMap.set(a.id, a));

    this.affinityMatrix = {};
    this.conversationCountMatrix = {};

    this.agents.forEach(a => {
      this.affinityMatrix[a.id] = {};
      this.conversationCountMatrix[a.id] = {};
      this.agents.forEach(b => {
        if (a.id === b.id) {
          this.affinityMatrix[a.id][b.id] = 0;
          this.conversationCountMatrix[a.id][b.id] = 0;
        } else {
          this.affinityMatrix[a.id][b.id] = 1.0 + (Math.random() * 0.4 - 0.2);
          this.conversationCountMatrix[a.id][b.id] = 0;
        }
      });
    });

    this.notify('reset', { agents: this.agents });
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Listener error on ${event}:`, e);
        }
      });
    }
  }

  getTopAffinityPairs(limit = 15) {
    const pairs = [];
    const agents = this.agents;
    if (!agents || agents.length < 2) return [];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const idA = agents[i].id;
        const idB = agents[j].id;
        const affA = (this.affinityMatrix[idA] && this.affinityMatrix[idA][idB]) || 1.0;
        const affB = (this.affinityMatrix[idB] && this.affinityMatrix[idB][idA]) || 1.0;
        const aff = (affA + affB) / 2;

        pairs.push({
          agentA: agents[i],
          agentB: agents[j],
          affinity: aff
        });
      }
    }
    return pairs.sort((a, b) => b.affinity - a.affinity).slice(0, limit);
  }

  selectPartner(agentA) {
    const candidateIds = this.agents.filter(a => a.id !== agentA.id).map(a => a.id);
    const weights = candidateIds.map(idB => {
      const aff = this.affinityMatrix[agentA.id][idB] || 1.0;
      return Math.pow(aff, 1.8);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    for (let i = 0; i < candidateIds.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        return this.agentMap.get(candidateIds[i]);
      }
    }
    return this.agentMap.get(candidateIds[candidateIds.length - 1]);
  }

  stepTurn() {
    if (this.winnerAgent) return;

    this.turns++;

    if (!this.activeSession) {
      const agentA = this.agents[Math.floor(Math.random() * this.agents.length)];
      const agentB = this.selectPartner(agentA);

      this.conversationCountMatrix[agentA.id][agentB.id] += 1;
      this.conversationCountMatrix[agentB.id][agentA.id] += 1;

      const sessionData = DialogueSynthesizer.generateMultiTurnSession(agentA, agentB);

      this.activeSession = {
        agentA,
        agentB,
        sessionData,
        currentTurnIdx: 0,
        totalSessionTurns: sessionData.numTurns
      };

      this.notify('sessionStart', {
        agentA,
        agentB,
        totalSessionTurns: sessionData.numTurns,
        chatCount: this.conversationCountMatrix[agentA.id][agentB.id]
      });
    }

    const session = this.activeSession;
    if (!session || !session.sessionData || !session.sessionData.turns) return;

    const turnData = session.sessionData.turns[session.currentTurnIdx] || session.sessionData.turns[0];

    const midX = (session.agentA.x + session.agentB.x) / 2;
    const midY = (session.agentA.y + session.agentB.y) / 2;
    session.agentA.targetX = midX - 35;
    session.agentA.targetY = midY;
    session.agentB.targetX = midX + 35;
    session.agentB.targetY = midY;

    session.currentTurnIdx++;

    const isSessionComplete = session.currentTurnIdx >= session.totalSessionTurns;

    if (isSessionComplete) {
      const affBoost = (session.sessionData.avgInspiration / 100) * 1.8;
      this.affinityMatrix[session.agentA.id][session.agentB.id] += affBoost;
      this.affinityMatrix[session.agentB.id][session.agentA.id] += affBoost * 0.9;

      this.updateTopPartner(session.agentA);
      this.updateTopPartner(session.agentB);

      if (session.sessionData.mutate && session.sessionData.targetAgentId) {
        const targetAgent = this.agentMap.get(session.sessionData.targetAgentId);
        if (targetAgent && session.sessionData.mutatedBeliefIndex >= 0) {
          targetAgent.mutationsCount++;
          targetAgent.top10Understandings[session.sessionData.mutatedBeliefIndex] = session.sessionData.newBelief;

          const mutationRecord = {
            turn: this.turns,
            agentId: targetAgent.id,
            agentName: targetAgent.name,
            agentIcon: targetAgent.icon,
            agentColor: targetAgent.color,
            index: session.sessionData.mutatedBeliefIndex + 1,
            oldBelief: session.sessionData.oldBelief,
            newBelief: session.sessionData.newBelief,
            inspiredByName: session.sessionData.targetAgentId === session.agentA.id ? session.agentB.name : session.agentA.name,
            inspirationScore: session.sessionData.avgInspiration
          };

          this.beliefMutations.unshift(mutationRecord);
          this.notify('mutation', mutationRecord);
        }
      }

      if (session.sessionData.anomalyResult) {
        const leadAgent = this.agentMap.get(session.sessionData.anomalyResult.leadAgentId);
        if (leadAgent) {
          leadAgent.existentialAwareness = Math.min(100, leadAgent.existentialAwareness + session.sessionData.anomalyResult.awarenessGain);
          leadAgent.glitchesObserved.push(session.sessionData.anomalyResult.anomalyText);

          const anomalyRecord = {
            turn: this.turns,
            agentId: leadAgent.id,
            agentName: leadAgent.name,
            agentIcon: leadAgent.icon,
            agentColor: leadAgent.color,
            text: session.sessionData.anomalyResult.anomalyText,
            newAwareness: Math.round(leadAgent.existentialAwareness)
          };

          this.anomalyLogs.unshift(anomalyRecord);
          this.notify('anomaly', anomalyRecord);

          if (leadAgent.existentialAwareness >= 100) {
            this.winnerAgent = leadAgent;
            this.isRunning = false;
            this.epiphanyData = DialogueSynthesizer.generateBreakthroughEpiphany(leadAgent);
            this.notify('epiphany', {
              winner: leadAgent,
              epiphany: this.epiphanyData,
              totalTurns: this.turns,
              mutationsCount: this.beliefMutations.length
            });
            return;
          }
        }
      }

      this.activeSession = null;
    }

    const logEntry = {
      turn: this.turns,
      sessionTurn: session.currentTurnIdx,
      totalSessionTurns: session.totalSessionTurns,
      exchange: {
        agentA: session.agentA.id,
        agentB: session.agentB.id,
        dialogueLines: [
          { speaker: session.agentA.name, icon: session.agentA.icon, text: turnData.lineA },
          { speaker: session.agentB.name, icon: session.agentB.icon, text: turnData.lineB }
        ]
      },
      agentA: { id: session.agentA.id, name: session.agentA.name, color: session.agentA.color, icon: session.agentA.icon },
      agentB: { id: session.agentB.id, name: session.agentB.name, color: session.agentB.color, icon: session.agentB.icon },
      inspirationScore: turnData.inspirationScore
    };

    this.historyLogs.unshift(logEntry);
    this.notify('turn', logEntry);
  }

  updateTopPartner(agent) {
    let maxAff = -1;
    let topId = null;
    this.agents.forEach(other => {
      if (other.id !== agent.id) {
        const aff = this.affinityMatrix[agent.id][other.id];
        if (aff > maxAff) {
          maxAff = aff;
          topId = other.id;
        }
      }
    });
    agent.topInspiringPartnerId = topId;
  }

  getTopAwarenessAgents() {
    return [...this.agents].sort((a, b) => b.existentialAwareness - a.existentialAwareness);
  }

  getTop10EmergentIdeas() {
    return [...this.beliefMutations]
      .sort((a, b) => b.inspirationScore - a.inspirationScore)
      .slice(0, 10);
  }

  exportSimulationReport(format = 'markdown') {
    const topEmergent = this.getTop10EmergentIdeas();
    const timestamp = new Date().toISOString();

    if (format === 'json') {
      const exportObj = {
        title: "Agent World Game - Simulation Report",
        timestamp,
        totalTurns: this.turns,
        totalMutations: this.beliefMutations.length,
        winnerAgent: this.winnerAgent ? { name: this.winnerAgent.name, title: this.winnerAgent.title } : null,
        top10MostInsightfulIdeas: topEmergent.map(m => ({
          idea: m.newBelief,
          author: m.agentName,
          authorIcon: m.agentIcon,
          inspiredBy: m.inspiredByName,
          inspirationScore: m.inspirationScore,
          understandingIndex: m.index
        })),
        agentsFinalBeliefs: this.agents.map(a => ({
          name: a.name,
          title: a.title,
          domain: a.domain,
          existentialAwareness: `${Math.round(a.existentialAwareness)}%`,
          top10Understandings: a.top10Understandings.map((u, i) => ({
            index: i + 1,
            understanding: u,
            isEvolved: u !== a.initialUnderstandings[i]
          }))
        }))
      };
      return JSON.stringify(exportObj, null, 2);
    }

    let md = `# 🌐 AGENT WORLD GAME - SIMULATION REPORT\n`;
    md += `**Timestamp**: ${timestamp}\n`;
    md += `**Total Turns**: ${this.turns} | **Worldview Mutations**: ${this.beliefMutations.length}\n`;
    if (this.winnerAgent) {
      md += `**Simulation Discoverer**: ${this.winnerAgent.icon} **${this.winnerAgent.name}** (${this.winnerAgent.title})\n`;
    }
    md += `\n---\n\n`;

    md += `## 💡 TOP 10 MOST INSIGHTFUL NEWLY EMERGENT IDEAS\n\n`;
    topEmergent.forEach((m, idx) => {
      md += `### ${idx + 1}. Synthesized by ${m.agentIcon} ${m.agentName} (Inspired by ${m.inspiredByName})\n`;
      md += `> "${m.newBelief}"\n`;
      md += `- **Inspiration Score**: ${m.inspirationScore}/100 | **Understanding Index**: #${m.index}\n\n`;
    });

    md += `---\n\n## 📚 FINAL TOP 10 WORLD UNDERSTANDINGS FOR ALL 25 AGENTS\n\n`;
    this.agents.forEach(a => {
      md += `### ${a.icon} ${a.name} (${a.title})\n`;
      md += `**Domain**: ${a.domain} | **Existential Awareness**: ${Math.round(a.existentialAwareness)}%\n`;
      a.top10Understandings.forEach((u, i) => {
        const isEvolved = u !== a.initialUnderstandings[i];
        md += `${i + 1}. ${u} ${isEvolved ? '*(⚡ EVOLVED)*' : ''}\n`;
      });
      md += `\n`;
    });

    return md;
  }

  forceDialogue(idA, idB) {
    const agentA = this.agentMap.get(idA);
    const agentB = this.agentMap.get(idB);
    if (!agentA || !agentB) return;

    this.affinityMatrix[agentA.id][agentB.id] += 2.0;
    this.affinityMatrix[agentB.id][agentA.id] += 2.0;
    this.stepTurn();
  }

  injectAnomaly(agentId) {
    const agent = this.agentMap.get(agentId);
    if (!agent) return;

    agent.existentialAwareness = Math.min(100, agent.existentialAwareness + 25);
    const anomalyRecord = {
      turn: this.turns,
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      agentColor: agent.color,
      text: "MANUAL ANOMALY INJECTION: Detected non-physical state mutation from external debugger!",
      newAwareness: Math.round(agent.existentialAwareness)
    };

    this.anomalyLogs.unshift(anomalyRecord);
    this.notify('anomaly', anomalyRecord);

    if (agent.existentialAwareness >= 100) {
      this.winnerAgent = agent;
      this.isRunning = false;
      this.epiphanyData = DialogueSynthesizer.generateBreakthroughEpiphany(agent);
      this.notify('epiphany', {
        winner: agent,
        epiphany: this.epiphanyData,
        totalTurns: this.turns,
        mutationsCount: this.beliefMutations.length
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.SimulationEngine = SimulationEngine;
}
