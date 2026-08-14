/**
 * World Visualizer for Agent World Game.
 * Renders 2D Canvas Roaming Academy World with clear Active Dialogue HUD Banners,
 * dual speaker spotlights, on-canvas speech bubbles, and Organic Cloud Constellation Network Layout.
 */

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

    this.resizeCanvas();
    this.initCloudNodes();

    window.addEventListener('resize', () => this.resizeCanvas());

    this.startAnimationLoop();
  }

  initCloudNodes() {
    this.cloudNodes.clear();
    const w = this.canvas && this.canvas.width ? this.canvas.width : 800;
    const h = this.canvas && this.canvas.height ? this.canvas.height : 600;

    this.engine.agents.forEach(agent => {
      this.cloudNodes.set(agent.id, {
        x: w / 2 + (Math.random() - 0.5) * (w * 0.6),
        y: h / 2 + (Math.random() - 0.5) * (h * 0.6),
        vx: 0,
        vy: 0,
        radius: 20
      });
    });
  }

  resizeCanvas() {
    const parent = this.canvas ? this.canvas.parentElement : null;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    } else if (this.canvas) {
      this.canvas.width = 800;
      this.canvas.height = 500;
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'network' && this.cloudNodes.size === 0) {
      this.initCloudNodes();
    }
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
      duration: 4000
    };

    this.activeSpeechBubbles = [
      {
        x: agentA.x,
        y: agentA.y - 45,
        text: `${agentA.icon} ${lines[0].text}`,
        color: agentA.color,
        createdAt: Date.now(),
        duration: 4000
      },
      {
        x: agentB.x,
        y: agentB.y - 45,
        text: `${agentB.icon} ${lines[1].text}`,
        color: agentB.color,
        createdAt: Date.now() + 400,
        duration: 4000
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
    const height = (this.canvas && this.canvas.height) || 600;

    this.engine.agents.forEach(agent => {
      if (agent.targetX && agent.targetY) {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        agent.x += dx * 0.06;
        agent.y += dy * 0.06;

        if (Math.hypot(dx, dy) < 10 && agent.state === 'idle') {
          agent.targetX = Math.max(60, Math.min(width - 60, agent.x + (Math.random() - 0.5) * 150));
          agent.targetY = Math.max(60, Math.min(height - 60, agent.y + (Math.random() - 0.5) * 150));
        }
      }
    });
  }

  updateCloudPhysics() {
    const w = (this.canvas && this.canvas.width) || 800;
    const h = (this.canvas && this.canvas.height) || 600;
    const centerX = w / 2;
    const centerY = h / 2;
    const agents = this.engine.agents;

    agents.forEach(a => {
      if (!this.cloudNodes.has(a.id)) {
        this.cloudNodes.set(a.id, {
          x: centerX + (Math.random() - 0.5) * 300,
          y: centerY + (Math.random() - 0.5) * 300,
          vx: 0,
          vy: 0
        });
      }
    });

    for (let i = 0; i < agents.length; i++) {
      const nodeA = this.cloudNodes.get(agents[i].id);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const nodeB = this.cloudNodes.get(agents[j].id);
        if (!nodeB) continue;
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 220) {
          const force = (220 - dist) * 0.08;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }

    for (let i = 0; i < agents.length; i++) {
      const idA = agents[i].id;
      const nodeA = this.cloudNodes.get(idA);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const idB = agents[j].id;
        const nodeB = this.cloudNodes.get(idB);
        if (!nodeB) continue;
        const aff = (this.engine.affinityMatrix[idA][idB] + this.engine.affinityMatrix[idB][idA]) / 2;

        if (aff > 1.2) {
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = Math.max(60, 260 - (aff * 55));
          const springForce = (dist - targetDist) * 0.008;

          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;
          nodeA.vx += fx;
          nodeA.vy += fy;
          nodeB.vx -= fx;
          nodeB.vy -= fy;
        }
      }
    }

    agents.forEach(a => {
      const node = this.cloudNodes.get(a.id);
      if (!node) return;
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * 0.002;
      node.vy += dy * 0.002;

      node.vx *= 0.85;
      node.vy *= 0.85;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(60, Math.min(w - 60, node.x));
      node.y = Math.max(60, Math.min(h - 60, node.y));
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
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark space-academy background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
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

    // Draw Active Speech Bubbles directly on nodes
    const now = Date.now();
    this.activeSpeechBubbles = this.activeSpeechBubbles.filter(b => now - b.createdAt < b.duration);
    this.activeSpeechBubbles.forEach(b => {
      const age = now - b.createdAt;
      if (age > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, 1 - (age / b.duration) * 0.2));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;

        const maxBoxW = 240;
        const textStr = b.text.length > 40 ? b.text.slice(0, 38) + '...' : b.text;
        const textWidth = Math.min(maxBoxW, ctx.measureText(textStr).width + 24);
        const boxX = b.x - textWidth / 2;
        const boxY = b.y - 35;

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth, 32, 8);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(textStr, b.x, boxY + 20);
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
  }

  drawAcademyView(ctx, w, h) {
    // Background Affinity Links
    const pairs = this.engine.getTopAffinityPairs(15);
    pairs.forEach(p => {
      if (p.affinity > 1.2 && p.agentA && p.agentB) {
        ctx.save();
        ctx.strokeStyle = p.agentA.color;
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

    // HIGHLIGHT ACTIVE CONVERSING PAIR (Who & Who is in the conversation)
    let activeAgentA = null;
    let activeAgentB = null;

    if (this.engine.activeSession) {
      activeAgentA = this.engine.activeSession.agentA;
      activeAgentB = this.engine.activeSession.agentB;
    } else if (this.currentDialogueSession && (Date.now() - this.currentDialogueSession.createdAt < 3500)) {
      activeAgentA = this.currentDialogueSession.agentA;
      activeAgentB = this.currentDialogueSession.agentB;
    }

    if (activeAgentA && activeAgentB) {
      ctx.save();

      // 1. Dual Glowing Radial Spotlights underneath the conversing pair
      [activeAgentA, activeAgentB].forEach(agent => {
        const grad = ctx.createRadialGradient(agent.x, agent.y, 5, agent.x, agent.y, 60);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
        grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 60, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Bright Active Conversation Connection Beam
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(activeAgentA.x, activeAgentA.y);
      ctx.lineTo(activeAgentB.x, activeAgentB.y);
      ctx.stroke();

      // 3. Floating "💬 TALKING" Pills above active nodes
      [activeAgentA, activeAgentB].forEach(agent => {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(agent.x - 30, agent.y - 42, 60, 18, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💬 CHATTING', agent.x, agent.y - 30);
      });

      ctx.restore();
    }

    // Draw Agent Nodes
    this.engine.agents.forEach(agent => {
      const isConversing = (activeAgentA && activeAgentA.id === agent.id) || (activeAgentB && activeAgentB.id === agent.id);

      ctx.save();
      ctx.shadowColor = isConversing ? '#00f3ff' : agent.color;
      ctx.shadowBlur = isConversing ? 22 : agent.existentialAwareness > 50 ? 15 : 8;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isConversing ? '#00f3ff' : agent.color;
      ctx.lineWidth = isConversing ? 3.5 : 2.5;

      ctx.beginPath();
      ctx.arc(agent.x, agent.y, isConversing ? 26 : 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (agent.existentialAwareness > 0) {
        ctx.strokeStyle = agent.existentialAwareness > 70 ? '#ff00ff' : '#00f3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * (agent.existentialAwareness / 100));
        ctx.arc(agent.x, agent.y, isConversing ? 29 : 25, startAngle, endAngle);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.font = isConversing ? '18px serif' : '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent.icon, agent.x, agent.y);

      ctx.font = isConversing ? 'bold 12px Inter, sans-serif' : 'bold 11px Inter, sans-serif';
      ctx.fillStyle = isConversing ? '#00f3ff' : '#e2e8f0';
      ctx.fillText(agent.name, agent.x, agent.y + 36);

      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(agent.domain.split('&')[0], agent.x, agent.y + 48);

      ctx.restore();
    });
  }

  // Draw On-Canvas Active Dialogue Banner HUD (Shows Who & Who + What They Talked)
  drawDialogueBannerHUD(ctx, w, h, session, age) {
    const fade = Math.min(1, Math.max(0, 1 - (age / session.duration) * 0.15));

    ctx.save();
    ctx.globalAlpha = fade;

    const bannerW = Math.min(640, w - 32);
    const bannerH = 88;
    const bannerX = (w - bannerW) / 2;
    const bannerY = 16;

    // Glowing Glass HUD Box
    ctx.fillStyle = 'rgba(10, 14, 26, 0.92)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // HUD Header Title
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💬 ACTIVE CONVERSATION (${session.agentA.icon} ${session.agentA.name} ↔ ${session.agentB.icon} ${session.agentB.name})`, bannerX + 16, bannerY + 22);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Turn ${session.sessionTurn}/${session.totalSessionTurns} • Inspiration: ${session.inspirationScore}/100 ⚡`, bannerX + bannerW - 16, bannerY + 22);

    // Dialogue Line A
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = session.agentA.color;
    ctx.fillText(`${session.agentA.icon} ${session.agentA.name}:`, bannerX + 16, bannerY + 46);
    ctx.fillStyle = '#f8fafc';
    const shortLineA = session.lineA.length > 70 ? session.lineA.slice(0, 67) + '...' : session.lineA;
    ctx.fillText(shortLineA, bannerX + 110, bannerY + 46);

    // Dialogue Line B
    ctx.fillStyle = session.agentB.color;
    ctx.fillText(`${session.agentB.icon} ${session.agentB.name}:`, bannerX + 16, bannerY + 68);
    ctx.fillStyle = '#cbd5e1';
    const shortLineB = session.lineB.length > 70 ? session.lineB.slice(0, 67) + '...' : session.lineB;
    ctx.fillText(shortLineB, bannerX + 110, bannerY + 68);

    ctx.restore();
  }

  drawCloudNetworkView(ctx, w, h) {
    const agents = this.engine.agents;

    const centralityMap = new Map();
    let maxCentrality = 1;

    agents.forEach(agent => {
      let totalAff = 0;
      agents.forEach(other => {
        if (other.id !== agent.id) {
          totalAff += (this.engine.affinityMatrix[agent.id][other.id] || 1.0);
        }
      });
      centralityMap.set(agent.id, totalAff);
      if (totalAff > maxCentrality) maxCentrality = totalAff;
    });

    const sortedHubs = [...agents].sort((a, b) => centralityMap.get(b.id) - centralityMap.get(a.id));
    const topHubIds = new Set(sortedHubs.slice(0, 4).map(h => h.id));

    topHubIds.forEach(id => {
      const node = this.cloudNodes.get(id);
      if (node) {
        ctx.save();
        const grad = ctx.createRadialGradient(node.x, node.y, 10, node.x, node.y, 110);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0.18)');
        grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const nodeA = this.cloudNodes.get(a.id);
      if (!nodeA) continue;
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        const nodeB = this.cloudNodes.get(b.id);
        if (!nodeB) continue;

        const aff = (this.engine.affinityMatrix[a.id][b.id] + this.engine.affinityMatrix[b.id][a.id]) / 2;
        const chats = this.engine.conversationCountMatrix[a.id][b.id] || 0;

        if (aff > 1.1 || chats > 0) {
          ctx.save();
          const isHubLink = topHubIds.has(a.id) || topHubIds.has(b.id);
          ctx.strokeStyle = isHubLink ? (aff > 2.2 ? '#00f3ff' : '#a855f7') : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = Math.min(6, Math.max(0.6, (aff - 1) * 2.2));
          ctx.globalAlpha = Math.min(0.85, (aff - 1) * 0.45);

          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
          ctx.restore();

          if (chats > 0) {
            const midX = (nodeA.x + nodeB.x) / 2;
            const midY = (nodeA.y + nodeB.y) / 2;

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 1;

            const badgeText = `${chats} chats`;
            ctx.font = 'bold 9px Inter, sans-serif';
            const badgeW = ctx.measureText(badgeText).width + 10;

            ctx.beginPath();
            ctx.roundRect(midX - badgeW / 2, midY - 9, badgeW, 18, 9);
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

    agents.forEach(agent => {
      const node = this.cloudNodes.get(agent.id);
      if (!node) return;

      const centRatio = (centralityMap.get(agent.id) / maxCentrality);
      const isTopHub = topHubIds.has(agent.id);
      const nodeRadius = 16 + (centRatio * 16);

      ctx.save();

      if (isTopHub) {
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowColor = agent.color;
      ctx.shadowBlur = isTopHub ? 16 : 8;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isTopHub ? '#00f3ff' : agent.color;
      ctx.lineWidth = isTopHub ? 3 : 2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.font = `${Math.floor(nodeRadius * 0.95)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent.icon, node.x, node.y);

      if (isTopHub) {
        ctx.fillStyle = '#00f3ff';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('🌟 HUB', node.x, node.y - nodeRadius - 8);
      }

      ctx.font = isTopHub ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.fillStyle = isTopHub ? '#00f3ff' : '#f8fafc';
      ctx.fillText(agent.name, node.x, node.y + nodeRadius + 14);

      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 290, 72, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('☁️ ORGANIC CLOUD CONSTELLATION NETWORK', 26, 34);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('• 💬 Connection Badges = Numerical Conversation Count (10+ turns per chat)', 26, 50);
    ctx.fillText('• Organic Spring Physics: High affinity agents cluster together', 26, 66);
    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.WorldVisualizer = WorldVisualizer;
}
