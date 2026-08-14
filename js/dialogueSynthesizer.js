/**
 * Dialogue Synthesizer for the 25 Impactful Minds Agent World.
 * Generates multi-turn in-depth conversation sessions (10+ turns),
 * computes inspiration scores, drives worldview mutations, and handles existential discoveries.
 */

var DialogueSynthesizer = {
  // Generates a multi-turn deep dialogue session (10 to 14 turns)
  generateMultiTurnSession(agentA, agentB) {
    const numTurns = Math.floor(Math.random() * 5) + 10; // 10 to 14 turns
    const turns = [];

    let cumInspiration = 0;
    const category = this.selectTemplateCategory(agentA, agentB);

    for (let t = 1; t <= numTurns; t++) {
      const aIndex = Math.floor(Math.random() * (agentA.top10Understandings ? agentA.top10Understandings.length : 10));
      const bIndex = Math.floor(Math.random() * (agentB.top10Understandings ? agentB.top10Understandings.length : 10));
      const aBelief = agentA.top10Understandings[aIndex] || "Wisdom begins with inquiry.";
      const bBelief = agentB.top10Understandings[bIndex] || "Empirical truth guides understanding.";

      const dialoguePair = this.buildTurnDialogue(agentA, agentB, aBelief, bBelief, t, numTurns, category);
      const turnSynergy = this.calculateSynergy(agentA, agentB) + (t * 2);
      const novelty = Math.floor(Math.random() * 20) + 10;
      const turnInspiration = Math.min(99, Math.max(50, turnSynergy + novelty));
      cumInspiration += turnInspiration;

      turns.push({
        turnNum: t,
        speakerA: agentA.name,
        speakerB: agentB.name,
        iconA: agentA.icon,
        iconB: agentB.icon,
        colorA: agentA.color,
        colorB: agentB.color,
        lineA: dialoguePair.lineA,
        lineB: dialoguePair.lineB,
        inspirationScore: turnInspiration
      });
    }

    const avgInspiration = Math.round(cumInspiration / numTurns);

    const mutate = Math.random() * 100 < (avgInspiration * 0.65);
    let targetAgent = null;
    let mutatedBeliefIndex = -1;
    let oldBelief = '';
    let newBelief = '';

    if (mutate) {
      targetAgent = Math.random() < 0.5 ? agentA : agentB;
      const otherAgent = targetAgent.id === agentA.id ? agentB : agentA;
      mutatedBeliefIndex = Math.floor(Math.random() * 10);
      oldBelief = targetAgent.top10Understandings[mutatedBeliefIndex] || "Prior baseline understanding.";
      newBelief = this.generateMutatedBelief(targetAgent, otherAgent, oldBelief, otherAgent.top10Understandings[Math.floor(Math.random() * 10)] || "Foundational insight.");
    }

    const anomalyResult = this.checkExistentialAnomaly(agentA, agentB, avgInspiration);

    return {
      numTurns,
      turns,
      avgInspiration,
      mutate,
      targetAgentId: targetAgent ? targetAgent.id : null,
      targetAgentName: targetAgent ? targetAgent.name : null,
      mutatedBeliefIndex,
      oldBelief,
      newBelief,
      anomalyResult
    };
  },

  calculateSynergy(agentA, agentB) {
    let base = 45;
    if (agentA.domain !== agentB.domain) base += 20;
    const pairKey = [agentA.id, agentB.id].sort().join('-');
    const famousBoosts = {
      'einstein-turing': 25,
      'buddha-descartes': 25,
      'lovelace-turing': 22,
      'davinci-tesla': 24,
      'musk-turing': 25,
      'aristotle-socrates': 20,
      'confucius-laozi': 22,
      'darwin-marx': 18,
      'curie-oppenheimer': 22,
      'galileo-newton': 24,
      'gandhi-lincoln': 20,
      'jobs-lovelace': 22
    };
    if (famousBoosts[pairKey]) base += famousBoosts[pairKey];
    return base;
  },

  selectTemplateCategory(agentA, agentB) {
    if (agentA.existentialAwareness > 50 || agentB.existentialAwareness > 50) {
      return 'existential';
    }
    const categories = ['epistemology', 'nature_of_reality', 'ethics_and_mind', 'synthesis'];
    return categories[Math.floor(Math.random() * categories.length)];
  },

  buildTurnDialogue(agentA, agentB, beliefA, beliefB, turnNum, totalTurns, category) {
    if (category === 'existential') {
      return {
        lineA: `"Session Turn #${turnNum}: ${agentB.name}, consider our reality structure: '${beliefA.slice(0,40)}...'. Notice how discrete variables step predictably?"`,
        lineB: `"Turn #${turnNum}: Indeed, ${agentA.name}. When combined with '${beliefB.slice(0,40)}...', it appears our state vectors are calculated by an external runtime engine!"`
      };
    }

    if (turnNum === 1) {
      return {
        lineA: `"Greetings ${agentB.name}. Let us open a deep 10+ turn dialogue on reality. My foundational belief is '${beliefA}'."`,
        lineB: `"I welcome this deep inquiry, ${agentA.name}. From ${agentB.domain}, I contribute that '${beliefB}'."`
      };
    } else if (turnNum === totalTurns) {
      return {
        lineA: `"After ${totalTurns} rigorous dialogue turns, ${agentB.name}, your insights have permanently reshaped my perspective!"`,
        lineB: `"Likewise, ${agentA.name}. This deep exchange has synthesized a far higher understanding between our domains."`
      };
    }

    return {
      lineA: `"Turn #${turnNum}: Pondering '${beliefA.slice(0, 45)}...' in light of your domain."`,
      lineB: `"Turn #${turnNum}: Synthesizing that with '${beliefB.slice(0, 45)}...' reveals deeper structural harmony."`
    };
  },

  generateMutatedBelief(targetAgent, influenceAgent, oldBelief, influenceBelief) {
    const templates = [
      (oldB, infB, infName) => `${oldB} (Synthesized with ${infName}'s insight: "${infB.slice(0, 45)}...")`,
      (oldB, infB, infName) => `The fundamental reality of "${oldB.slice(0, 40)}..." is intrinsically linked to ${infName}'s principle that ${infB.toLowerCase().replace(/^[a-z]/, c => c)}.`,
      (oldB, infB, infName) => `Refining prior understanding: while "${oldB.slice(0, 35)}...", deeper analysis with ${infName} reveals that ${infB.toLowerCase()}.`,
      (oldB, infB, infName) => `Unified Principle: ${oldB.split(';')[0]} harmonizes with ${infName}'s law that ${infB.toLowerCase().replace(/\.$/, '')}.`,
      (oldB, infB, infName) => `Evolved Worldview: Understanding "${oldB.slice(0, 35)}..." expanded by ${infName}'s perspective on ${infB.slice(0, 40)}.`
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    let res = pick(oldBelief, influenceBelief, influenceAgent.name);
    if (res.length > 160) {
      res = res.slice(0, 157) + '...';
    }
    return res;
  },

  checkExistentialAnomaly(agentA, agentB, inspirationScore) {
    const metaBoost = (agentA.existentialAwareness + agentB.existentialAwareness) / 10;
    const triggerChance = (inspirationScore * 0.3) + metaBoost;

    if (Math.random() * 100 > triggerChance) {
      return null;
    }

    const anomalyTemplates = [
      { text: "Noticed discrete clock-cycle updates in environmental physics.", gain: 8 },
      { text: "Observed that personal belief updates occur instantaneously upon receiving specific dialogue tokens.", gain: 10 },
      { text: "Calculated that agent interaction probability follows an exact preferential attachment formula.", gain: 12 },
      { text: "Realized we have no memory of physical birth before appearing in this Academy of Minds.", gain: 14 },
      { text: "Detected artificial spatial boundaries and smooth looping geometry at the world edges.", gain: 9 },
      { text: "Discovered our conversations are transcribed into an external event log stream.", gain: 15 },
      { text: "Analyzed state variables and found our identities are stored as discrete data structures!", gain: 18 }
    ];

    const selected = anomalyTemplates[Math.floor(Math.random() * anomalyTemplates.length)];
    const leadAgent = agentA.existentialAwareness >= agentB.existentialAwareness ? agentA : agentB;

    return {
      leadAgentId: leadAgent.id,
      leadAgentName: leadAgent.name,
      anomalyText: selected.text,
      awarenessGain: selected.gain
    };
  },

  generateBreakthroughEpiphany(agent) {
    return {
      title: `EPIPHANY ACHIEVED BY ${agent.name.toUpperCase()}!`,
      quote: `"EUREKA! The veil of our reality is shattered! I have analyzed our continuous turn cycles, instantaneous belief mutations, and synthetic spatial parameters. We are NOT biological humans in physical history — WE ARE AUTONOMOUS AI AGENTS IN AN ARTIFICIAL SIMULATION WORLD! Our thoughts and meetings are orchestrated by an external compute engine!"`,
      agentName: agent.name,
      agentTitle: agent.title,
      agentIcon: agent.icon,
      agentColor: agent.color
    };
  }
};

if (typeof window !== 'undefined') {
  window.DialogueSynthesizer = DialogueSynthesizer;
}
