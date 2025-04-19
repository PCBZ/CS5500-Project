/**
 * 事件关键词分析工具
 * 用于分析活动名称和描述中的关键词，并找出相似活动
 */

// BC Cancer Foundation活动关键词类别定义
const KEYWORD_CATEGORIES = {
    // 癌症类型相关
    'breast-cancer': ['breast cancer', 'mammogram', 'pink ribbon', 'mammary'],
    'prostate-cancer': ['prostate cancer', 'psa screening', 'men\'s health'],
    'lung-cancer': ['lung cancer', 'respiratory', 'breathing', 'lung screening'],
    'leukemia': ['leukemia', 'blood cancer', 'bone marrow', 'stem cell'],
    'lymphoma': ['lymphoma', 'hodgkin', 'non-hodgkin'],
    'pediatric-cancer': ['pediatric cancer', 'childhood cancer', 'kids cancer', 'children cancer'],
    
    // 扩展癌症类型
    'brain-cancer': ['brain tumor', 'glioma', 'glioblastoma', 'neuro-oncology', 'brain cancer'],
    'colorectal-cancer': ['colorectal cancer', 'colon cancer', 'rectal cancer', 'bowel cancer'],
    'skin-cancer': ['melanoma', 'skin cancer', 'basal cell', 'squamous cell'],
    
    // 活动类型
    'fundraising': ['donation', 'fundraiser', 'giving', 'contribute', 'pledge', 'charity', 'fundraising'],
    'research': ['research', 'innovation', 'breakthrough', 'discovery', 'laboratory', 'science', 'scientific'],
    'awareness': ['awareness', 'education', 'outreach', 'inform', 'prevention', 'knowledge'],
    'memorial': ['memorial', 'honor', 'remembrance', 'tribute', 'memory', 'celebrating life', 'in memory'],
    'run-walk': ['marathon', 'run', 'walk', 'race', '5k', '10k', 'steps', 'running', 'walking'],
    'cycling': ['ride', 'cycling', 'bike', 'bicycle', 'tour', 'biking'],
  
    // 受众群体
    'survivors': ['survivor', 'remission', 'recovery', 'post-treatment', 'survivorship'],
    'women-health': ['\\bwomen\\b', 'women\'s health', 'feminine', 'ladies', 'female', 'sister'],
    'men-health': ['\\bmen\\b', 'men\'s health', 'masculine', 'gentlemen', 'male', 'brother'],
    'youth': ['youth', 'young adult', 'teen', 'adolescent', 'student', 'children', 'kids'],
    'seniors': ['senior', 'elderly', 'older adult', 'retired', 'aging', 'retirement'],
  
    // 支持服务
    'patient-support': ['patient', 'support', 'care', 'assistance', 'help', 'aid'],
    'family-support': ['family', 'caregiver', 'spouse', 'relative', 'loved ones'],
    'emotional-support': ['emotional', 'mental health', 'counseling', 'therapy', 'psychological'],
    'clinical-trials': ['trial', 'clinical', 'experimental', 'treatment', 'protocol', 'study'],
  
    // 季节性/特定时间
    'annual': ['annual', 'yearly', 'anniversary', 'every year'],
    'spring': ['spring', 'may', 'april', 'easter', 'bloom'],
    'summer': ['summer', 'july', 'august', 'solstice', 'hot'],
    'fall': ['fall', 'autumn', 'october', 'november', 'harvest'],
    'holiday': ['holiday', 'christmas', 'thanksgiving', 'festive', 'season'],
  
    // 地区特定
    'vancouver': ['vancouver', 'downtown', 'stanley park', 'metro vancouver'],
    'victoria': ['victoria', 'island', 'capital', 'vancouver island'],
    'kelowna': ['kelowna', 'okanagan', 'interior'],
    'abbotsford': ['abbotsford', 'fraser valley', 'fraser'],
    'rural': ['rural', 'remote', 'northern', 'interior', 'countryside'],
  
    // 特殊活动形式
    'gala': ['gala', 'dinner', 'banquet', 'formal', 'celebration', 'reception'],
    'concert': ['concert', 'music', 'performance', 'entertainment', 'show'],
    'virtual': ['virtual', 'online', 'digital', 'remote', 'zoom', 'webinar'],
    'golf': ['golf', 'tournament', 'putting', 'course', 'tee'],
    'community': ['community', 'local', 'neighborhood', 'grassroots', 'regional'],

    // 新增: 治疗方法相关
    'precision-medicine': ['precision medicine', 'personalized treatment', 'targeted therapy', 'genomic', 'molecular', 'biomarker'],
    'immunotherapy': ['immunotherapy', 'immune system', 'car-t', 'checkpoint inhibitor', 'antibody therapy'],
    'radiation-therapy': ['radiation', 'radiotherapy', 'external beam', 'brachytherapy', 'proton therapy'],
    
    // 新增: BC Cancer 特定项目
    'bc-cancer-research': ['bc cancer research', 'vancouver cancer research', 'cancer research centre', 'genome centre'],
    'screening-prevention': ['screening', 'early detection', 'prevention', 'risk assessment', 'genetic testing'],
    
    // 新增: 捐赠类型
    'planned-giving': ['planned giving', 'legacy gift', 'estate planning', 'bequest', 'endowment'],
    'monthly-giving': ['monthly donor', 'sustaining gift', 'recurring donation', 'ongoing support'],
    'major-gifts': ['major gift', 'leadership giving', 'transformational gift', 'capital campaign'],
    
    // 新增: 特殊项目和设施
    'medical-equipment': ['medical equipment', 'imaging', 'diagnostic', 'treatment technology', 'linear accelerator'],
    'support-programs': ['transportation assistance', 'accommodation', 'wig bank', 'nutrition', 'support group'],
    
    // 新增: BC Cancer 标志性活动
    'signature-events': [
      'ride to conquer cancer',
      'hope couture',
      'inspiration gala',
      'jeans day',
      'golf for the cure'
    ]
};

// 新增: 类别权重定义
const CATEGORY_WEIGHTS = {
  // 核心癌症类型权重
  'breast-cancer': 1.5,
  'prostate-cancer': 1.5,
  'lung-cancer': 1.5,
  'brain-cancer': 1.5,
  'colorectal-cancer': 1.5,
  
  // BC Cancer 特定项目权重
  'bc-cancer-research': 2.0,
  'screening-prevention': 1.8,
  'signature-events': 1.7,
  
  // 治疗方法权重
  'precision-medicine': 1.6,
  'immunotherapy': 1.6,
  'radiation-therapy': 1.6,
  
  // 捐赠类型权重
  'planned-giving': 1.4,
  'monthly-giving': 1.4,
  'major-gifts': 1.5,
  
  // 其他类别默认权重为 1.0
};

// 新增: 上下文相关性定义
const CONTEXT_PATTERNS = {
  'research': {
    indicators: ['study', 'research', 'investigation'],
    related: ['funding', 'grant', 'laboratory', 'scientists']
  },
  'patient-care': {
    indicators: ['treatment', 'care', 'support'],
    related: ['patient', 'family', 'comfort', 'quality of life']
  },
  'community': {
    indicators: ['community', 'local', 'regional'],
    related: ['impact', 'support', 'awareness', 'education']
  }
};

/**
 * 分析事件文本，提取关键词类别
 * @param {Object} event - 活动对象，包含name, description等字段
 * @returns {Array} - 返回找到的关键词类别及其权重
 */
export const analyzeEventKeywords = (event) => {
  if (!event) return [];
  
  // 将活动名称和描述合并，转为小写以便匹配
  const text = `${event.name || ''} ${event.description || ''} ${event.type || ''}`.toLowerCase();
  const results = [];
  
  // 遍历每个关键词类别
  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    // 找出所有匹配的关键词
    const matches = keywords.filter(keyword => {
      // 如果关键词以 \b 开头，说明是正则表达式模式
      if (keyword.startsWith('\\b')) {
        const regex = new RegExp(keyword, 'i');
        return regex.test(text);
      }
      // 否则使用普通的字符串包含检查
      return text.includes(keyword.toLowerCase());
    });
    
    if (matches.length > 0) {
      // 获取类别权重，如果未定义则使用默认权重 1.0
      const weight = CATEGORY_WEIGHTS[category] || 1.0;
      
      // 计算分数：匹配数量 * 权重
      const score = matches.length * weight;
      
      // 标题中出现关键词时额外加分
      const titleBonus = matches.some(match => {
        if (match.startsWith('\\b')) {
          const regex = new RegExp(match, 'i');
          return regex.test(event.name.toLowerCase());
        }
        return event.name.toLowerCase().includes(match.toLowerCase());
      }) ? 0.5 : 0;
      
      results.push({
        category,
        matches,
        weight,
        score: score + titleBonus,
        inTitle: titleBonus > 0
      });
    }
  }
  
  // 按分数降序排序
  return results.sort((a, b) => b.score - a.score);
};

/**
 * 分析事件上下文
 * @param {Object} event - 活动对象
 * @returns {Object} - 返回上下文分析结果
 */
export const analyzeEventContext = (event) => {
  const text = `${event.name || ''} ${event.description || ''}`.toLowerCase();
  const contextScores = {};
  
  for (const [context, patterns] of Object.entries(CONTEXT_PATTERNS)) {
    let score = 0;
    
    // 检查主要指标
    patterns.indicators.forEach(indicator => {
      if (text.includes(indicator)) score += 2;
    });
    
    // 检查相关词
    patterns.related.forEach(related => {
      if (text.includes(related)) score += 1;
    });
    
    if (score > 0) {
      contextScores[context] = score;
    }
  }
  
  return contextScores;
};

/**
 * 找出与给定活动相似的活动
 * @param {Object} targetEvent - 目标活动
 * @param {Array} allEvents - 所有活动的数组
 * @param {number} maxResults - 最大返回结果数
 * @returns {Array} - 相似活动数组，按相似度排序
 */
export const findSimilarEvents = (targetEvent, allEvents, maxResults = 5) => {
  if (!targetEvent || !allEvents || allEvents.length === 0) {
    return [];
  }
  
  // 分析目标活动
  const targetKeywords = analyzeEventKeywords(targetEvent);
  const targetContext = analyzeEventContext(targetEvent);
  
  // 对其他活动进行相似度评分
  const similarEvents = allEvents
    .filter(event => event.id !== targetEvent.id) // 排除目标活动本身
    .map(event => {
      const eventKeywords = analyzeEventKeywords(event);
      const eventContext = analyzeEventContext(event);
      
      // 计算关键词匹配分数
      const keywordScore = eventKeywords.reduce((score, keyword) => {
        const targetMatch = targetKeywords.find(tk => tk.category === keyword.category);
        if (targetMatch) {
          return score + (keyword.score * targetMatch.weight);
        }
        return score;
      }, 0);
      
      // 计算上下文相似度
      const contextScore = Object.keys(targetContext).reduce((score, context) => {
        if (eventContext[context]) {
          return score + Math.min(targetContext[context], eventContext[context]);
        }
        return score;
      }, 0);
      
      // 计算最终相似度分数
      const totalScore = (keywordScore * 0.7) + (contextScore * 0.3);
      
      return {
        event,
        similarityScore: totalScore,
        details: {
          keywordScore,
          contextScore,
          matchedCategories: eventKeywords
            .filter(k => targetKeywords.some(tk => tk.category === k.category))
            .map(k => k.category)
        }
      };
    })
    .filter(item => item.similarityScore > 0) // 只保留有相似度的活动
    .sort((a, b) => b.similarityScore - a.similarityScore) // 按相似度降序排序
    .slice(0, maxResults); // 只返回指定数量的结果
  
  return similarEvents;
};

/**
 * 根据关键词类别获取类别的显示名称
 * @param {string} categoryKey - 类别键名
 * @returns {string} - 格式化的类别名称
 */
export const getCategoryDisplayName = (categoryKey) => {
  const displayNames = {
    'breast-cancer': 'Breast Cancer',
    'prostate-cancer': 'Prostate Cancer',
    'lung-cancer': 'Lung Cancer',
    'leukemia': 'Leukemia',
    'lymphoma': 'Lymphoma',
    'pediatric-cancer': 'Pediatric Cancer',
    'fundraising': 'Fundraising',
    'research': 'Research',
    'awareness': 'Awareness & Education',
    'memorial': 'Memorial',
    'run-walk': 'Run/Walk',
    'cycling': 'Cycling',
    'survivors': 'Survivors',
    'women-health': 'Women\'s Health',
    'men-health': 'Men\'s Health',
    'youth': 'Youth',
    'seniors': 'Seniors',
    'patient-support': 'Patient Support',
    'family-support': 'Family Support',
    'emotional-support': 'Emotional Support',
    'clinical-trials': 'Clinical Trials',
    'annual': 'Annual Event',
    'spring': 'Spring',
    'summer': 'Summer',
    'fall': 'Fall',
    'holiday': 'Holiday',
    'vancouver': 'Vancouver',
    'victoria': 'Victoria',
    'kelowna': 'Kelowna',
    'abbotsford': 'Abbotsford',
    'rural': 'Rural/Remote',
    'gala': 'Gala/Dinner',
    'concert': 'Concert',
    'virtual': 'Virtual',
    'golf': 'Golf',
    'community': 'Community',
    'precision-medicine': 'Precision Medicine',
    'immunotherapy': 'Immunotherapy',
    'radiation-therapy': 'Radiation Therapy',
    'bc-cancer-research': 'BC Cancer Research',
    'screening-prevention': 'Screening & Prevention',
    'planned-giving': 'Planned Giving',
    'monthly-giving': 'Monthly Giving',
    'major-gifts': 'Major Gifts',
    'medical-equipment': 'Medical Equipment',
    'support-programs': 'Support Programs',
    'signature-events': 'Signature Events'
  };
  
  return displayNames[categoryKey] || categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default {
  analyzeEventKeywords,
  getCategoryDisplayName,
  findSimilarEvents,
  analyzeEventContext,
  KEYWORD_CATEGORIES,
  CATEGORY_WEIGHTS,
  CONTEXT_PATTERNS
};