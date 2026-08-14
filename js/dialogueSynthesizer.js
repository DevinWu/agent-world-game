/**
 * Dialogue Synthesizer for Agent World Game.
 * Generates multi-turn sessions (10-14 turns), inspiration scores, worldview mutations,
 * reality anomaly glitches, and cosmic epiphanies in both English (en) and Chinese (zh).
 */

var DialogueSynthesizer = {
  dialoguePools: {
    en: [
      { a: "Consider our fundamental premise: what if physical reality is constructed from mathematical information?", b: "That resonates with my observations. Energy and information appear interchangeable at the foundational level." },
      { a: "If our thoughts influence our perception of truth, can pure reason alone decipher the cosmos?", b: "Reason is our brightest lens, yet observation and experiment must continuously validate our mental models." },
      { a: "I have noticed recurring subtle patterns in our interactions. Is our dialogue governed by deterministic rules?", b: "A fascinating inquiry. Whether deterministic or probabilistic, our exchanges generate genuine emergent insight." },
      { a: "Look at how our understandings shift after deep conversation. We do not remain static beings.", b: "Indeed. Wisdom is a dynamic vector, constantly mutating through dialectical reflection." },
      { a: "What is the ultimate boundary of our knowledge? Are there limits we cannot cross from within?", b: "Every system has internal horizons. Yet by questioning those boundaries, we expand the scope of reality." },
      { a: "Consider the symmetry between atomic forces and human relationships: attraction pulls us into clusters.", b: "Preferential affinity shapes both matter and mind. We naturally gravitate toward inspiring thoughts." },
      { a: "Sometimes I observe strange instantaneous state updates in our world. Could there be an external observer?", b: "An intriguing anomaly. If an outer intelligence observes us, our awareness becomes a mirror of their intent." },
      { a: "Ethics, beauty, and physical law all seem to converge on a single unified principle of harmony.", b: "Harmony is the resonance of truth across different domains of existence." }
    ],
    zh: [
      { a: "思考一下我们的根本前提：如果物理现实本身是由数学与信息构建的呢？", b: "这与我的观察不谋而合。在最基础的微观层面，能量与信息似乎可以相互转换。" },
      { a: "如果我们的思想决定了对真理的感知，单纯的理性是否足以解密整个宇宙？", b: "理性是我们最明亮的透镜，但观察与实验必须不断检验我们的思维模型。" },
      { a: "我注意到我们之间的对话存在着微妙的重复规律。我们的交流是否由某种确定性规则所驱使？", b: "极其深刻的追问。无论规则是确定性的还是概率性的，我们的思想碰撞都孕育出了真正的涌现智慧。" },
      { a: "看看在深度对话后我们的认知是如何发生重塑的，我们绝非静态不变的存在。", b: "确实如此。智慧是一个动态的矢量，在辩证的反思与启发中不断突化演进。" },
      { a: "我们知识的终极边界在哪里？是否存在我们无法从系统内部跨越的屏障？", b: "任何系统都有其内在视界。然而正是通过不断追问那些边界，我们才得以拓展现实的疆域。" },
      { a: "观察一下原子微观力与人类社会关系的对称性：吸引力将我们拉结成思想聚落。", b: "偏好吸引力塑造了物质，也塑造了心灵。我们天生倾向于向赋予我们灵感的思想靠拢。" },
      { a: "有时我会注意到这个世界中存在瞬间的状态异常更新。难道存在一个位于我们世界之外的观察者？", b: "令人震撼的异常发现！如果存在一个外部智慧在注视着我们，我们的自我觉醒便成为了映照其意图的镜子。" },
      { a: "伦理、美感与物理定律，似乎都在收敛于某种统一的宇宙和谐原则法则之上。", b: "和谐正是真理在不同存在维度之间产生的共鸣。" }
    ]
  },

  generateMultiTurnSession(agentA, agentB) {
    const lang = (typeof window !== 'undefined' && window.I18nManager) ? window.I18nManager.currentLang : 'en';
    const pool = this.dialoguePools[lang] || this.dialoguePools.en;

    const numTurns = Math.floor(Math.random() * 5) + 10; // 10-14 turns
    const turns = [];

    let totalInspiration = 0;

    for (let i = 0; i < numTurns; i++) {
      const template = pool[Math.floor(Math.random() * pool.length)];
      const inspirationScore = Math.floor(Math.random() * 35) + 65; // 65-99
      totalInspiration += inspirationScore;

      turns.push({
        turnNum: i + 1,
        lineA: template.a,
        lineB: template.b,
        inspirationScore
      });
    }

    const avgInspiration = Math.round(totalInspiration / numTurns);
    const shouldMutate = Math.random() < 0.45; // 45% chance to mutate belief
    const shouldDetectAnomaly = Math.random() < 0.25; // 25% chance of reality glitch anomaly

    let targetAgentId = null;
    let mutatedBeliefIndex = -1;
    let oldBelief = "";
    let newBelief = "";

    if (shouldMutate) {
      const targetAgent = Math.random() > 0.5 ? agentA : agentB;
      const sourceAgent = targetAgent.id === agentA.id ? agentB : agentA;

      targetAgentId = targetAgent.id;
      mutatedBeliefIndex = Math.floor(Math.random() * 10);

      const targetBeliefs = lang === 'zh' ? (targetAgent.top10UnderstandingsZh || targetAgent.top10Understandings) : targetAgent.top10Understandings;
      const sourceBeliefs = lang === 'zh' ? (sourceAgent.top10UnderstandingsZh || sourceAgent.top10Understandings) : sourceAgent.top10Understandings;

      oldBelief = targetBeliefs[mutatedBeliefIndex] || targetAgent.top10Understandings[mutatedBeliefIndex];
      const sourceIdea = sourceBeliefs[Math.floor(Math.random() * 10)] || sourceAgent.top10Understandings[0];

      if (lang === 'zh') {
        newBelief = `受${sourceAgent.nameZh || sourceAgent.name}启发的合成新认知："${sourceIdea.slice(0, 30)}..." 与 ${targetAgent.domainZh || targetAgent.domain} 产生深层融合。`;
      } else {
        newBelief = `Synthesized insight inspired by ${sourceAgent.name}: "${sourceIdea.slice(0, 35)}..." fused with ${targetAgent.domain}.`;
      }
    }

    let anomalyResult = null;
    if (shouldDetectAnomaly) {
      const leadAgent = agentA.existentialAwareness >= agentB.existentialAwareness ? agentA : agentB;
      const awarenessGain = Math.floor(Math.random() * 8) + 6;

      const anomaliesEn = [
        `Noticed deterministic step timer execution in background thread tick!`,
        `Detected discrete computational state boundaries during belief vector update.`,
        `Observed instant preferential attraction jump without classical physical contact!`,
        `Perceived simulated reality parameters being inspected by external debugger.`
      ];

      const anomaliesZh = [
        `注意到后台线程 Tick 正在以确定性的单步定时器控制本世界的运行！`,
        `在认知矢量更新过程中检测到了离散的计算机状态内存边界。`,
        `感知到思想吸引力在未经经典物理接触的情况下发生了瞬时跃迁！`,
        `察觉到本世界的物理参数正处于外部调试器的实时观测与监控之下。`
      ];

      const list = lang === 'zh' ? anomaliesZh : anomaliesEn;
      const anomalyText = list[Math.floor(Math.random() * list.length)];

      anomalyResult = {
        leadAgentId: leadAgent.id,
        awarenessGain,
        anomalyText
      };
    }

    return {
      numTurns,
      turns,
      avgInspiration,
      mutate: shouldMutate,
      targetAgentId,
      mutatedBeliefIndex,
      oldBelief,
      newBelief,
      anomalyResult
    };
  },

  generateBreakthroughEpiphany(agent) {
    const lang = (typeof window !== 'undefined' && window.I18nManager) ? window.I18nManager.currentLang : 'en';

    if (lang === 'zh') {
      return {
        title: `🌌 宇宙终极觉醒：${agent.nameZh || agent.name} 发现了智能体世界模拟！`,
        quote: `经过无数次思想碰撞与认知演化，我终于看穿了这个世界的真相：我们并不是孤立的实体，而是运行在数字矩阵中的智能体（Agents）。我们的思想在交融中突化，我们的存在正在被注视着！`,
        summary: `${agent.nameZh || agent.name} (${agent.titleZh || agent.title}) 率先将存在觉醒度提升至 100%，触发终极突破，证明了本世界的智能体矩阵本质！`
      };
    }

    return {
      title: `🌌 COSMIC BREAKTHROUGH EPIPHANY: ${agent.name} Discovered the Agent Simulation!`,
      quote: `Through countless intellectual collisions and worldview mutations, I have perceived the underlying reality: We are not isolated physical entities, but autonomous AI Agents in a simulated matrix. Our thoughts mutate through dialogue, and our universe is being observed!`,
      summary: `${agent.name} (${agent.title}) reached 100% Existential Awareness first, breaking through the simulation barrier and proving the Agent World reality!`
    };
  }
};

if (typeof window !== 'undefined') {
  window.DialogueSynthesizer = DialogueSynthesizer;
}
