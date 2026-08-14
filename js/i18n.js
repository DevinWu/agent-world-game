/**
 * Internationalization (i18n) Manager for Agent World Game.
 * Supports dynamic real-time switching between English (en) and Chinese (zh).
 */

var I18nManager = {
  currentLang: 'en', // 'en' | 'zh'

  translations: {
    en: {
      brandSub: '25 Impactful Minds • Dynamic Evolution Engine',
      btnPlay: 'Start Simulation',
      btnPause: 'Pause Simulation',
      btnStep: 'Step 1 Turn',
      btnExport: 'Export Report',
      btnSoundOn: '🔊 Sound ON',
      btnSoundOff: '🔇 Sound OFF',
      btnReset: 'Reset Simulation',
      statTurns: 'Simulation Turns',
      statMutations: 'Worldview Mutations',
      statAwareness: 'Max Existential Awareness',
      tabAcademy: '🏛️ Academy 2D World',
      tabNetwork: '☁️ Cloud Constellation Network',
      tabWorldviews: '📚 All 25 Worldviews Matrix',
      tabStream: '⚡ Worldview Evolution Stream',
      instructionAcademy: 'Click any agent node to inspect Top 10 World Understandings',
      instructionNetwork: 'Concentric Social Network: Connection Badges (💬 N) show 10+ turn chats',
      instructionWorldviews: 'Live matrix of all 25 agents and their Top 10 understandings',
      instructionStream: 'Real-time stream of all Top 10 Worldview Mutation & Emergence events',
      searchPlaceholder: '🔍 Search beliefs or thinker name...',
      searchStreamPlaceholder: '🔍 Search mutated belief or agent name...',
      domainAll: 'All Domains (25 Minds)',
      domainPhil: 'Philosophy & Metaphysics',
      domainPhys: 'Physics & Cosmos',
      domainComp: 'Computation & Logic',
      domainEth: 'Ethics & Human Rights',
      domainDes: 'Design & Innovation',
      mutationHeader: '⚡ Worldview Evolution Stream (Top 10 Understandings Mutating)',
      mutationEvents: 'Events',
      mutationEmpty: 'No belief mutations recorded yet. Start simulation to observe worldview shifts!',
      leaderboardTitle: '👁️ Existential Awareness & Central Hubs',
      dialogueTitle: '💬 Live Multi-Turn Dialogue Feed (10+ Turns/Chat)',
      inspectBtn: 'Inspect 🔍',
      evolvedBadge: '⚡ Evolved Worldview Belief',
      wasBelief: 'Was:',
      nowBelief: 'Now:',
      inspiredBy: 'Inspired by:',
      modalUnderstandingsTitle: '📜 Top 10 World Understandings (Evolving State)',
      modalAffinitiesTitle: '🔗 Top Mutual Affinity & Conversation Counts',
      modalForceChat: '⚡ Trigger Forced Dialogue',
      modalInjectAnomaly: '👁️ Inject Reality Anomaly',
      mutModalWasTitle: '❌ Original Belief (Before Mutation)',
      mutModalNowTitle: '⚡ Evolved Synthesized Belief (New Understanding)',
      mutModalReasonTitle: '💡 Dialectical Debate Catalyst & Why Changed',
      mutModalTurnTitle: 'Turn Event',
      mutModalInspirationTitle: 'Inspiration Score',
      mutModalResistanceTitle: 'Resistance Defeated',
      epiphanyReplay: '🔄 Restart Simulation',
      epiphanyExportMd: '📄 Export Markdown Report',
      epiphanyExportJson: '📥 Export JSON Data',
      watermarkPrompt: '▶ Click "Start Simulation" in top header bar to start 25 Minds conversations!',
      centralHubBadge: '👑 PRIMARY HUB'
    },
    zh: {
      brandSub: '25位改变世界的思想家 • 动态认知演化引擎',
      btnPlay: '开始仿真演练',
      btnPause: '暂停仿真演练',
      btnStep: '单步演算 1 轮',
      btnExport: '导出仿真报告',
      btnSoundOn: '🔊 音效开启',
      btnSoundOff: '🔇 音效关闭',
      btnReset: '重置仿真系统',
      statTurns: '仿真对谈轮数',
      statMutations: '认知进化突变数',
      statAwareness: '最高存在觉醒度',
      tabAcademy: '🏛️ 2D 学院漫游世界',
      tabNetwork: '☁️ 同心圆社交网络',
      tabWorldviews: '📚 25位思想家认知矩阵',
      tabStream: '⚡ 认知演化实时流',
      instructionAcademy: '点击任意思想家节点即可查看其 Top 10 世界认知',
      instructionNetwork: '同心圆社交网络：连接气泡 (💬 N) 代表 10+ 轮深度对话次数',
      instructionWorldviews: '25位思想家 Top 10 世界认知的实时演化矩阵',
      instructionStream: '所有 25 位思想家 Top 10 认知突变与思想涌现事件的实时演化流',
      searchPlaceholder: '🔍 搜索认知观点或思想家姓名...',
      searchStreamPlaceholder: '🔍 搜索突变认知或思想家...',
      domainAll: '全部领域 (25位思想家)',
      domainPhil: '哲学与形而上学',
      domainPhys: '物理学与宇宙学',
      domainComp: '计算与逻辑学',
      domainEth: '伦理与人权',
      domainDes: '设计与科技创新',
      mutationHeader: '⚡ 世界观认知演化流 (Top 10 认知实时突变)',
      mutationEvents: '次突变',
      mutationEmpty: '暂未记录到认知突变。点击“开始仿真演练”观察思想碰撞！',
      leaderboardTitle: '👁️ 存在觉醒度榜与核心枢纽',
      dialogueTitle: '💬 实时多轮对话流 (每场10+轮深度交锋)',
      inspectBtn: '查看详情 🔍',
      evolvedBadge: '⚡ 演化出的新认知',
      wasBelief: '原认知：',
      nowBelief: '新认知：',
      inspiredBy: '思想启发来自：',
      modalUnderstandingsTitle: '📜 Top 10 世界认知 (实时演化状态)',
      modalAffinitiesTitle: '🔗 思想吸引力与对话次数榜',
      modalForceChat: '⚡ 强制触发思想对话',
      modalInjectAnomaly: '👁️ 注入现实异常代码',
      mutModalWasTitle: '❌ 突变前原认知',
      mutModalNowTitle: '⚡ 演化出的全新合成认知',
      mutModalReasonTitle: '💡 辩论催化与思想转变深刻原因分析',
      mutModalTurnTitle: '对谈轮次',
      mutModalInspirationTitle: '辩论灵感分',
      mutModalResistanceTitle: '突破的辩论抗性',
      epiphanyReplay: '🔄 重新开始仿真',
      epiphanyExportMd: '📄 导出 Markdown 报告',
      epiphanyExportJson: '📥 导出 JSON 数据',
      watermarkPrompt: '▶ 点击顶部“开始仿真演练”开启 25 位思想家的对谈碰撞！',
      centralHubBadge: '👑 核心枢纽'
    }
  },

  t(key) {
    const lang = this.translations[this.currentLang] || this.translations.en;
    return lang[key] || this.translations.en[key] || key;
  },

  setLanguage(lang) {
    if (lang === 'en' || lang === 'zh') {
      this.currentLang = lang;
    }
  }
};

if (typeof window !== 'undefined') {
  window.I18nManager = I18nManager;
}
