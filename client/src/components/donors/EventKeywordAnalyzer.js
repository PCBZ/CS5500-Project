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
  
    // 活动类型
    'fundraising': ['donation', 'fundraiser', 'giving', 'contribute', 'pledge', 'charity', 'fundraising'],
    'research': ['research', 'innovation', 'breakthrough', 'discovery', 'laboratory', 'science', 'scientific'],
    'awareness': ['awareness', 'education', 'outreach', 'inform', 'prevention', 'knowledge'],
    'memorial': ['memorial', 'honor', 'remembrance', 'tribute', 'memory', 'celebrating life', 'in memory'],
    'run-walk': ['marathon', 'run', 'walk', 'race', '5k', '10k', 'steps', 'running', 'walking'],
    'cycling': ['ride', 'cycling', 'bike', 'bicycle', 'tour', 'biking'],
  
    // 受众群体
    'survivors': ['survivor', 'remission', 'recovery', 'post-treatment', 'survivorship'],
    'women-health': ['women', 'women\'s health', 'feminine', 'ladies', 'female'],
    'men-health': ['men', 'men\'s health', 'masculine', 'gentlemen', 'male'],
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
    'community': ['community', 'local', 'neighborhood', 'grassroots', 'regional']
  };
  
  /**
   * 分析事件文本，提取关键词类别
   * @param {Object} event - 活动对象，包含name, description等字段
   * @returns {Array} - 返回找到的关键词类别数组
   */
  export const analyzeEventKeywords = (event) => {
    if (!event) return [];
    
    // 将活动名称和描述合并，转为小写以便匹配
    const text = `${event.name || ''} ${event.description || ''} ${event.type || ''}`.toLowerCase();
    const foundCategories = [];
    
    // 遍历每个关键词类别
    for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
      // 如果文本包含这个类别的任何关键词
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        foundCategories.push(category);
      }
    }
    
    return foundCategories;
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
      'community': 'Community'
    };
    
    return displayNames[categoryKey] || categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    
    // 分析目标活动的关键词类别
    const targetCategories = analyzeEventKeywords(targetEvent);
    if (targetCategories.length === 0) {
      return []; // 如果目标活动没有关键词类别，返回空数组
    }
    
    // 对其他活动进行相似度评分
    const similarEvents = allEvents
      .filter(event => event.id !== targetEvent.id) // 排除目标活动本身
      .map(event => {
        const eventCategories = analyzeEventKeywords(event);
        
        // 计算共同类别数量
        const commonCategories = targetCategories.filter(category => 
          eventCategories.includes(category)
        );
        
        // 计算简单相似分数
        const similarityScore = commonCategories.length / Math.max(targetCategories.length, 1);
        
        return {
          event,
          similarityScore,
          commonCategories
        };
      })
      .filter(item => item.similarityScore > 0) // 只保留有共同类别的活动
      .sort((a, b) => b.similarityScore - a.similarityScore) // 按相似度降序排序
      .slice(0, maxResults); // 只返回指定数量的结果
    
    return similarEvents;
  };
  
  export default {
    analyzeEventKeywords,
    getCategoryDisplayName,
    findSimilarEvents,
    KEYWORD_CATEGORIES
  };