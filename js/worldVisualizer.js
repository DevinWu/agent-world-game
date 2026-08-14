/**
 * World Visualizer for Agent World Game.
 * Renders 2D Canvas Roaming Academy World with high-visibility Active Dialogue HUDs,
 * dynamic anchored speech bubbles, active speaker spotlights, cross-platform vector node avatars,
 * and Concentric Radial Social Network Cloud View (Centering the top-connected mind).
 */

// Canvas 2D roundRect polyfill for maximum browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    if (!Array.isArray(r)) r = [0, 0, 0, 0];
    const tl = r[0] || 0;
    const tr = r[1] || r[0] || 0;
    const br = r[2] || r[0] || 0;
    const bl = r[3] || r[1] || r[0] || 0;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    return this;
  };
}

var WorldVisualizer = class WorldVisualizer {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.engine = engine;
    this.viewMode = 'academy'; // 'academy', 'network', 'worldviews'
    this.activeSpeechBubbles = [];
    this.particles = [];
    this.currentDialogueSession = null;
    this.animFrameId = null;

    this.cloudNodes = new Map();
    this.centralHubId = null;

    this.resizeCanvas();
    this.initCloudNodes();

    window.addEventListener('resize', () => this.resizeCanvas());

    this.startAnimationLoop();
  }

  initCloudNodes() {
    this.cloudNodes.clear();
    const w = this.canvas && this.canvas.width ? this.canvas.width : 800;
    const h = this.canvas && this.canvas.height ? this.canvas.height : 550;

    if (this.engine && this.engine.agents) {
      this.engine.agents.forEach(agent => {
        this.cloudNodes.set(agent.id, {
          x: w / 2 + (Math.random() - 0.5) * (w * 0.6),
          y: h / 2 + (Math.random() - 0.5) * (h * 0.6),
          vx: 0,
          vy: 0,
          radius: 22,
          tier: 1
        });
      });
    }
  }

  resizeCanvas() {
    const parent = this.canvas ? this.canvas.parentElement : null;
    let w = parent && parent.clientWidth > 100 ? parent.clientWidth : 800;
    let h = parent && parent.clientHeight > 100 ? parent.clientHeight : 550;

    if (w < 300) w = 800;
    if (h < 300) h = 550;

    if (this.canvas) {
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.resizeCanvas();
    if (mode === 'network' && this.cloudNodes.size === 0) {
      this.initCloudNodes();
    }
  }

  getAgentShortBadge(agent) {
    if (!agent || !agent.name) return 'AG';
    const nameMap = {
      'Socrates': 'SOC',
      'Albert Einstein': 'EIN',
      'Alan Turing': 'TUR',
      'Ada Lovelace': 'ADA',
      'Siddhartha Gautama (Buddha)': 'BUD',
      'Nikola Tesla': 'TES',
      'René Descartes': 'DES',
      'Elon Musk': 'MUSK',
      'Isaac Newton': 'NEW',
      'Confucius': 'CONF',
      'Leonardo da Vinci': 'LEO',
      'Steve Jobs': 'JOBS',
      'Marie Curie': 'CUR',
      'Charles Darwin': 'DAR',
      'Friedrich Nietzsche': 'NIE',
      'Galileo Galilei': 'GAL',
      'Abraham Lincoln': 'LINC',
      'Mahatma Gandhi': 'GAN',
      'Laozi': 'LAO',
      'Karl Marx': 'MARX',
      'J. Robert Oppenheimer': 'OPP',
      'William Shakespeare': 'WILL',
      'Hypatia of Alexandria': 'HYP'
    };
    return nameMap[agent.name] || agent.name.slice(0, 3).toUpperCase();
  }

  getTopAffinityPairs(limit = 15) {
    if (this.engine && typeof this.engine.getTopAffinityPairs === 'function') {
      try {
        return this.engine.getTopAffinityPairs(limit);
      } catch (e) {}
    }

    const pairs = [];
    const agents = this.engine ? this.engine.agents : [];
    if (!agents || agents.length < 2) return [];

    const matrix = (this.engine && this.engine.affinityMatrix) || {};

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const idA = agents[i].id;
        const idB = agents[j].id;
        const affA = (matrix[idA] && matrix[idA][idB]) || 1.0;
        const affB = (matrix[idB] && matrix[idB][idA]) || 1.0;
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

  addSpeechBubble(agentA, agentB, lines, inspirationScore, sessionTurn = 1, totalSessionTurns = 12) {
    if (!agentA || !agentB || !lines || lines.length < 2) return;

    this.currentDialogueSession = {
      agentA,
      agentB,
      lineA: lines[0].text,
      lineB: lines[1].text,
      inspirationScore,
      sessionTurn,
      totalSessionTurns,
      createdAt: Date.now(),
      duration: 5000
    };

    this.activeSpeechBubbles = [
      {
        agent: agentA,
        text: lines[0].text,
        color: agentA.color,
        createdAt: Date.now(),
        duration: 5000
      },
      {
        agent: agentB,
        text: lines[1].text,
        color: agentB.color,
        createdAt: Date.now() + 300,
        duration: 5000
      }
    ];

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: agentA.x,
        y: agentA.y,
        vx: (agentB.x - agentA.x) * 0.025 + (Math.random() - 0.5) * 2,
        vy: (agentB.y - agentA.y) * 0.025 + (Math.random() - 0.5) * 2,
        color: inspirationScore > 75 ? '#00f3ff' : '#a855f7',
        life: 1.0,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }

  startAnimationLoop() {
    const render = () => {
      try {
        if (this.viewMode !== 'worldviews') {
          this.resizeCanvas();

          if (this.viewMode === 'network') {
            this.updateCloudPhysics();
          } else {
            this.updatePositions();
          }
          this.updateParticles();
          this.draw();
        }
      } catch (err) {
        console.error("Render loop error:", err);
      }
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  updatePositions() {
    const width = (this.canvas && this.canvas.width) || 800;
    const height = (this.canvas && this.canvas.height) || 550;

    const paddingX = 65;
    const paddingY = 65;
    const usableW = Math.max(200, width - paddingX * 2);
    const usableH = Math.max(200, height - paddingY * 2);

    if (!this.engine || !this.engine.agents) return;

    this.engine.agents.forEach((agent, idx) => {
      const cols = 5;
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const baseGridX = paddingX + col * (usableW / 4);
      const baseGridY = paddingY + row * (usableH / 4);

      if (!agent.gridBaseX) {
        agent.gridBaseX = baseGridX;
        agent.gridBaseY = baseGridY;
        agent.x = baseGridX;
        agent.y = baseGridY;
        agent.targetX = baseGridX;
        agent.targetY = baseGridY;
      } else {
        agent.gridBaseX = baseGridX;
        agent.gridBaseY = baseGridY;
      }

      if (agent.targetX && agent.targetY) {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        agent.x += dx * 0.08;
        agent.y += dy * 0.08;

        if (Math.hypot(dx, dy) < 8 && agent.state === 'idle') {
          agent.targetX = Math.max(paddingX, Math.min(width - paddingX, agent.gridBaseX + (Math.random() - 0.5) * 45));
          agent.targetY = Math.max(paddingY, Math.min(height - paddingY, agent.gridBaseY + (Math.random() - 0.5) * 45));
        }
      }
    });
  }

  // Concentric Radial Social Network Physics (Centering top-connected node)
  updateCloudPhysics() {
    const w = (this.canvas && this.canvas.width) || 800;
    const h = (this.canvas && this.canvas.height) || 550;
    const centerX = w / 2;
    const centerY = h / 2;

    if (!this.engine || !this.engine.agents) return;
    const agents = this.engine.agents;

    const countMatrix = this.engine.conversationCountMatrix || {};
    const affMatrix = this.engine.affinityMatrix || {};

    // 1. Calculate Social Network Importance (Chats + Connections + Affinity)
    let maxSocialScore = -1;
    let topCentralId = agents[0].id;

    agents.forEach(a => {
      let totalChats = 0;
      let totalDegree = 0;
      let totalAff = 0;

      agents.forEach(b => {
        if (a.id !== b.id) {
          const chats = (countMatrix[a.id] && countMatrix[a.id][b.id]) || 0;
          const aff = (affMatrix[a.id] && affMatrix[a.id][b.id]) || 1.0;
          if (chats > 0) {
            totalChats += chats;
            totalDegree++;
          }
          totalAff += aff;
        }
      });

      const socialScore = (totalChats * 10) + (totalDegree * 5) + totalAff;
      if (socialScore > maxSocialScore) {
        maxSocialScore = socialScore;
        topCentralId = a.id;
      }
    });

    this.centralHubId = topCentralId;

    // 2. Classify Nodes into Radial Hierarchy Tiers from Central Hub
    const tiers = new Map(); // id -> tier (0: Center, 1: Direct Partner, 2: Extended Friend, 3: Outer)
    const directPartners = new Set();

    agents.forEach(a => {
      if (a.id === topCentralId) {
        tiers.set(a.id, 0);
      } else {
        const chatsWithCenter = (countMatrix[topCentralId] && countMatrix[topCentralId][a.id]) || 0;
        if (chatsWithCenter > 0) {
          tiers.set(a.id, 1);
          directPartners.add(a.id);
        } else {
          tiers.set(a.id, 2);
        }
      }
    });

    // Check tier 2 vs tier 3 based on connections to tier 1
    agents.forEach(a => {
      if (tiers.get(a.id) === 2) {
        let isConnectedToTier1 = false;
        directPartners.forEach(pId => {
          if ((countMatrix[a.id] && countMatrix[a.id][pId]) > 0) {
            isConnectedToTier1 = true;
          }
        });
        if (!isConnectedToTier1) {
          tiers.set(a.id, 3);
        }
      }
    });

    // 3. Apply Concentric Radial Forces
    agents.forEach(a => {
      if (!this.cloudNodes.has(a.id)) {
        this.cloudNodes.set(a.id, {
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0
        });
      }
    });

    // Tier 0 (Central Hub Node): Anchor directly to center of viewport
    const centerNode = this.cloudNodes.get(topCentralId);
    if (centerNode) {
      centerNode.vx += (centerX - centerNode.x) * 0.15;
      centerNode.vy += (centerY - centerNode.y) * 0.15;
    }

    // Tier 1 Nodes (Direct Friends): Constrain to Radial Orbit Ring 1 (r ≈ 150-180px)
    // Tier 2 Nodes (Extended): Constrain to Radial Orbit Ring 2 (r ≈ 260-300px)
    // Tier 3 Nodes (Outer): Constrain to Radial Orbit Ring 3 (r ≈ 360-400px)
    agents.forEach((a, idx) => {
      const node = this.cloudNodes.get(a.id);
      if (!node || a.id === topCentralId) return;

      const tier = tiers.get(a.id) || 2;
      const targetRadius = tier === 1 ? 165 : (tier === 2 ? 275 : 375);

      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const currentDist = Math.hypot(dx, dy) || 1;

      // Radial ring spring force
      const radialForce = (currentDist - targetRadius) * 0.03;
      node.vx -= (dx / currentDist) * radialForce;
      node.vy -= (dy / currentDist) * radialForce;
    });

    // Repulsion between adjacent nodes in radial view
    for (let i = 0; i < agents.length; i++) {
      const nodeA = this.cloudNodes.get(agents[i].id);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const nodeB = this.cloudNodes.get(agents[j].id);
        if (!nodeB) continue;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.hypot(dx, dy) || 1;
        const minSpace = 65;

        if (dist < minSpace) {
          const force = (minSpace - dist) * 0.12;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }

    // Link spring attraction for conversing partners
    for (let i = 0; i < agents.length; i++) {
      const idA = agents[i].id;
      const nodeA = this.cloudNodes.get(idA);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const idB = agents[j].id;
        const nodeB = this.cloudNodes.get(idB);
        if (!nodeB) continue;

        const chats = (countMatrix[idA] && countMatrix[idA][idB]) || 0;
        if (chats > 0) {
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = Math.max(70, 240 - chats * 15);
          const springForce = (dist - targetDist) * 0.008;

          nodeA.vx += (dx / dist) * springForce;
          nodeA.vy += (dy / dist) * springForce;
          nodeB.vx -= (dx / dist) * springForce;
          nodeB.vy -= (dy / dist) * springForce;
        }
      }
    }

    // Velocity Damping & Bounds
    agents.forEach(a => {
      const node = this.cloudNodes.get(a.id);
      if (!node) return;

      node.vx *= 0.82;
      node.vy *= 0.82;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(50, Math.min(w - 50, node.x));
      node.y = Math.max(50, Math.min(h - 50, node.y));
    });
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 550;

    // Deep space academy background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.viewMode === 'academy') {
      this.drawAcademyView(ctx, w, h);
    } else if (this.viewMode === 'network') {
      this.drawCloudNetworkView(ctx, w, h);
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Speech Bubbles anchored to agents
    const now = Date.now();
    this.activeSpeechBubbles = this.activeSpeechBubbles.filter(b => now - b.createdAt < b.duration);
    this.activeSpeechBubbles.forEach(b => {
      const age = now - b.createdAt;
      if (age > 0 && b.agent) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, 1 - (age / b.duration) * 0.15));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = b.color || '#00f3ff';
        ctx.lineWidth = 2;

        const maxBoxW = 260;
        const textStr = `${b.agent.icon} ${b.text}`;
        const shortText = textStr.length > 45 ? textStr.slice(0, 42) + '...' : textStr;
        const textWidth = Math.min(maxBoxW, ctx.measureText(shortText).width + 24);

        const boxX = b.agent.x - textWidth / 2;
        const boxY = b.agent.y - 52;

        ctx.shadowColor = b.color || '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(boxX, boxY, textWidth, 34, 8);
        else ctx.rect(boxX, boxY, textWidth, 34);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(shortText, b.agent.x, boxY + 21);
        ctx.restore();
      }
    });

    // Draw On-Canvas Active Dialogue Banner HUD
    if (this.currentDialogueSession) {
      const session = this.currentDialogueSession;
      const age = now - session.createdAt;
      if (age < session.duration) {
        this.drawDialogueBannerHUD(ctx, w, h, session, age);
      }
    }

    // Idle Simulation Watermark Prompt
    if (this.engine && !this.engine.isRunning && this.engine.turns === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 243, 255, 0.85)';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Click "Start Simulation" in top header bar to start 25 Minds conversations!', w / 2, h - 25);
      ctx.restore();
    }
  }

  drawAcademyView(ctx, w, h) {
    // Safely get top affinity pairs
    const pairs = this.getTopAffinityPairs(15);

    pairs.forEach(p => {
      if (p.affinity > 1.2 && p.agentA && p.agentB) {
        ctx.save();
        ctx.strokeStyle = p.agentA.color || '#00f3ff';
        ctx.lineWidth = Math.min(3, Math.max(0.5, (p.affinity - 1) * 1.8));
        ctx.globalAlpha = Math.min(0.4, (p.affinity - 1) * 0.25);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.agentA.x, p.agentA.y);
        ctx.lineTo(p.agentB.x, p.agentB.y);
        ctx.stroke();
        ctx.restore();
      }
    });

    // ACTIVE CONVERSING PAIR
    let activeAgentA = null;
    let activeAgentB = null;

    if (this.engine && this.engine.activeSession) {
      activeAgentA = this.engine.activeSession.agentA;
      activeAgentB = this.engine.activeSession.agentB;
    } else if (this.currentDialogueSession && (Date.now() - this.currentDialogueSession.createdAt < 4500)) {
      activeAgentA = this.currentDialogueSession.agentA;
      activeAgentB = this.currentDialogueSession.agentB;
    }

    if (activeAgentA && activeAgentB) {
      ctx.save();

      // Dual Radial Spotlights
      [activeAgentA, activeAgentB].forEach(agent => {
        const grad = ctx.createRadialGradient(agent.x, agent.y, 5, agent.x, agent.y, 65);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
        grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 65, 0, Math.PI * 2);
        ctx.fill();
      });

      // Laser Beam between conversational partners
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(activeAgentA.x, activeAgentA.y);
      ctx.lineTo(activeAgentB.x, activeAgentB.y);
      ctx.stroke();

      // CHATTING Pills above active nodes
      [activeAgentA, activeAgentB].forEach(agent => {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.95)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(agent.x - 36, agent.y - 44, 72, 20, 10);
        else ctx.rect(agent.x - 36, agent.y - 44, 72, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💬 CHATTING', agent.x, agent.y - 30);
      });

      ctx.restore();
    }

    // Draw Agent Nodes (All 25 Agents)
    if (!this.engine || !this.engine.agents) return;

    this.engine.agents.forEach(agent => {
      const isConversing = (activeAgentA && activeAgentA.id === agent.id) || (activeAgentB && activeAgentB.id === agent.id);
      const color = agent.color || '#00f3ff';
      const badge = this.getAgentShortBadge(agent);

      ctx.save();
      ctx.shadowColor = isConversing ? '#00f3ff' : color;
      ctx.shadowBlur = isConversing ? 24 : agent.existentialAwareness > 50 ? 15 : 10;

      // Circle Fill with Dark Gradient
      const radius = isConversing ? 25 : 22;
      const grad = ctx.createRadialGradient(agent.x - 5, agent.y - 5, 2, agent.x, agent.y, radius);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.strokeStyle = isConversing ? '#00f3ff' : color;
      ctx.lineWidth = isConversing ? 3.5 : 2.5;

      ctx.beginPath();
      ctx.arc(agent.x, agent.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Existential Awareness Progress Outer Ring
      if (agent.existentialAwareness > 0) {
        ctx.strokeStyle = agent.existentialAwareness > 70 ? '#ff00ff' : '#00f3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * (agent.existentialAwareness / 100));
        ctx.arc(agent.x, agent.y, radius + 3, startAngle, endAngle);
        ctx.stroke();
      }

      // HIGH-CONTRAST INITIALS BADGE TEXT
      ctx.shadowBlur = 0;
      ctx.fillStyle = isConversing ? '#00f3ff' : '#ffffff';
      ctx.font = isConversing ? 'bold 11px Inter, sans-serif' : 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, agent.x, agent.y);

      // Name Label Below Node
      ctx.font = isConversing ? 'bold 11px Inter, sans-serif' : 'bold 10px Inter, sans-serif';
      ctx.fillStyle = isConversing ? '#00f3ff' : '#e2e8f0';
      ctx.fillText(agent.name, agent.x, agent.y + 36);

      // Domain Badge
      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      const domainShort = (agent.domain || '').split('&')[0];
      ctx.fillText(domainShort, agent.x, agent.y + 48);

      ctx.restore();
    });
  }

  drawDialogueBannerHUD(ctx, w, h, session, age) {
    const fade = Math.min(1, Math.max(0, 1 - (age / session.duration) * 0.1));

    ctx.save();
    ctx.globalAlpha = fade;

    const bannerW = Math.min(680, w - 24);
    const bannerH = 92;
    const bannerX = (w - bannerW) / 2;
    const bannerY = 14;

    ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Header Title Bar
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💬 ACTIVE DIALOGUE: ${session.agentA.icon} ${session.agentA.name} ↔ ${session.agentB.icon} ${session.agentB.name}`, bannerX + 16, bannerY + 22);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Session Turn ${session.sessionTurn}/${session.totalSessionTurns} • Inspiration: ${session.inspirationScore}/100 ⚡`, bannerX + bannerW - 16, bannerY + 22);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bannerX + 16, bannerY + 30);
    ctx.lineTo(bannerX + bannerW - 16, bannerY + 30);
    ctx.stroke();

    // Line A
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = session.agentA.color || '#00f3ff';
    const nameA = `${session.agentA.icon} ${session.agentA.name}:`;
    ctx.fillText(nameA, bannerX + 16, bannerY + 48);

    const offsetA = Math.max(160, ctx.measureText(nameA).width + 24);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    const shortLineA = session.lineA.length > 70 ? session.lineA.slice(0, 67) + '...' : session.lineA;
    ctx.fillText(shortLineA, bannerX + offsetA, bannerY + 48);

    // Line B
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = session.agentB.color || '#a855f7';
    const nameB = `${session.agentB.icon} ${session.agentB.name}:`;
    ctx.fillText(nameB, bannerX + 16, bannerY + 72);

    const offsetB = Math.max(160, ctx.measureText(nameB).width + 24);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const shortLineB = session.lineB.length > 70 ? session.lineB.slice(0, 67) + '...' : session.lineB;
    ctx.fillText(shortLineB, bannerX + offsetB, bannerY + 72);

    ctx.restore();
  }

  // Radial Concentric Social Network View (Centralized Hub Node + Orbits)
  drawCloudNetworkView(ctx, w, h) {
    if (!this.engine || !this.engine.agents) return;
    const agents = this.engine.agents;
    const centerX = w / 2;
    const centerY = h / 2;

    const topHubId = this.centralHubId || agents[0].id;
    const centralAgent = this.engine.agentMap.get(topHubId) || agents[0];

    // 1. Draw Radial Orbit Concentric Rings around the Central Hub Node
    ctx.save();
    [165, 275, 375].forEach((radius, idx) => {
      ctx.strokeStyle = idx === 0 ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = idx === 0 ? 1.5 : 1;
      ctx.setLineDash(idx === 0 ? [6, 6] : [4, 4]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // 2. Draw Central Hub Glowing Nebula Halo
    const hubNode = this.cloudNodes.get(topHubId);
    if (hubNode) {
      ctx.save();
      const grad = ctx.createRadialGradient(hubNode.x, hubNode.y, 10, hubNode.x, hubNode.y, 140);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hubNode.x, hubNode.y, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Connection Lines and Numerical Conversation Count Badges
    const countMatrix = this.engine.conversationCountMatrix || {};
    const affMatrix = this.engine.affinityMatrix || {};

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const nodeA = this.cloudNodes.get(a.id);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        const nodeB = this.cloudNodes.get(b.id);
        if (!nodeB) continue;

        const chats = (countMatrix[a.id] && countMatrix[a.id][b.id]) || 0;
        const affA = (affMatrix[a.id] && affMatrix[a.id][b.id]) || 1.0;
        const affB = (affMatrix[b.id] && affMatrix[b.id][a.id]) || 1.0;
        const aff = (affA + affB) / 2;

        if (chats > 0 || aff > 1.25) {
          ctx.save();
          const isCentralLink = a.id === topHubId || b.id === topHubId;
          ctx.strokeStyle = isCentralLink ? (chats > 2 ? '#00f3ff' : '#a855f7') : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = isCentralLink ? Math.min(6, Math.max(1.5, chats * 1.2)) : Math.min(3, Math.max(0.6, (aff - 1) * 1.5));
          ctx.globalAlpha = isCentralLink ? 0.85 : Math.min(0.5, (aff - 1) * 0.3);

          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
          ctx.restore();

          if (chats > 0) {
            const midX = (nodeA.x + nodeB.x) / 2;
            const midY = (nodeA.y + nodeB.y) / 2;

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = isCentralLink ? '#00f3ff' : 'rgba(0, 243, 255, 0.5)';
            ctx.lineWidth = 1;

            const badgeText = `${chats} chats`;
            ctx.font = 'bold 9px Inter, sans-serif';
            const badgeW = ctx.measureText(badgeText).width + 10;

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(midX - badgeW / 2, midY - 9, badgeW, 18, 9);
            else ctx.rect(midX - badgeW / 2, midY - 9, badgeW, 18);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00f3ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, midX, midY);
            ctx.restore();
          }
        }
      }
    }

    // 4. Draw Radial Network Nodes
    agents.forEach(agent => {
      const node = this.cloudNodes.get(agent.id);
      if (!node) return;

      const isCentralHub = agent.id === topHubId;
      const nodeRadius = isCentralHub ? 28 : 20;
      const badge = this.getAgentShortBadge(agent);

      ctx.save();

      if (isCentralHub) {
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 25;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowColor = agent.color || '#00f3ff';
      ctx.shadowBlur = isCentralHub ? 20 : 8;
      ctx.fillStyle = isCentralHub ? '#1e1b4b' : '#0f172a';
      ctx.strokeStyle = isCentralHub ? '#00f3ff' : (agent.color || '#00f3ff');
      ctx.lineWidth = isCentralHub ? 3 : 2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = isCentralHub ? '#00f3ff' : '#ffffff';
      ctx.font = `bold ${Math.floor(nodeRadius * 0.75)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, node.x, node.y);

      if (isCentralHub) {
        ctx.fillStyle = '#00f3ff';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('👑 PRIMARY HUB', node.x, node.y - nodeRadius - 10);
      }

      ctx.font = isCentralHub ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.fillStyle = isCentralHub ? '#00f3ff' : '#f8fafc';
      ctx.fillText(agent.name, node.x, node.y + nodeRadius + 14);

      ctx.restore();
    });

    // HUD Header Legend
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(16, 16, 320, 74, 8);
    else ctx.rect(16, 16, 320, 74);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`👑 RADIAL SOCIAL NETWORK (PRIMARY HUB: ${centralAgent.name})`, 26, 34);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`• Centered on node with MAX connections & chats (${centralAgent.icon} ${centralAgent.name})`, 26, 50);
    ctx.fillText('• Concentric radial orbits extend to direct & extended network contacts', 26, 66);
    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.WorldVisualizer = WorldVisualizer;
}
