/**
 * Event Keyword Analysis Tool
 * Used to analyze keywords in event names and descriptions, and find similar events
 */

// BC Cancer Foundation event keyword category definitions
const KEYWORD_CATEGORIES = {
    // Cancer type related
    'breast-cancer': ['breast cancer', 'mammogram', 'pink ribbon', 'mammary'],
    'prostate-cancer': ['prostate cancer', 'psa screening', 'men\'s health'],
    'lung-cancer': ['lung cancer', 'respiratory', 'breathing', 'lung screening'],
    'leukemia': ['leukemia', 'blood cancer', 'bone marrow', 'stem cell'],
    'lymphoma': ['lymphoma', 'hodgkin', 'non-hodgkin'],
    'pediatric-cancer': ['pediatric cancer', 'childhood cancer', 'kids cancer', 'children cancer'],
    
    // Extended cancer types
    'brain-cancer': ['brain tumor', 'glioma', 'glioblastoma', 'neuro-oncology', 'brain cancer'],
    'colorectal-cancer': ['colorectal cancer', 'colon cancer', 'rectal cancer', 'bowel cancer'],
    'skin-cancer': ['melanoma', 'skin cancer', 'basal cell', 'squamous cell'],
    
    // Event types
    'fundraising': ['donation', 'fundraiser', 'giving', 'contribute', 'pledge', 'charity', 'fundraising'],
    'research': ['research', 'innovation', 'breakthrough', 'discovery', 'laboratory', 'science', 'scientific'],
    'awareness': ['awareness', 'education', 'outreach', 'inform', 'prevention', 'knowledge'],
    'memorial': ['memorial', 'honor', 'remembrance', 'tribute', 'memory', 'celebrating life', 'in memory'],
    'run-walk': ['marathon', 'run', 'walk', 'race', '5k', '10k', 'steps', 'running', 'walking'],
    'cycling': ['ride', 'cycling', 'bike', 'bicycle', 'tour', 'biking'],
  
    // Target audience
    'survivors': ['survivor', 'remission', 'recovery', 'post-treatment', 'survivorship'],
    'women-health': ['\\bwomen\\b', 'women\'s health', 'feminine', 'ladies', 'female', 'sister'],
    'men-health': ['\\bmen\\b', 'men\'s health', 'masculine', 'gentlemen', 'male', 'brother'],
    'youth': ['youth', 'young adult', 'teen', 'adolescent', 'student', 'children', 'kids'],
    'seniors': ['senior', 'elderly', 'older adult', 'retired', 'aging', 'retirement'],
  
    // Support services
    'patient-support': ['patient', 'support', 'care', 'assistance', 'help', 'aid'],
    'family-support': ['family', 'caregiver', 'spouse', 'relative', 'loved ones'],
    'emotional-support': ['emotional', 'mental health', 'counseling', 'therapy', 'psychological'],
    'clinical-trials': ['trial', 'clinical', 'experimental', 'treatment', 'protocol', 'study'],
  
    // Seasonal/Specific time
    'annual': ['annual', 'yearly', 'anniversary', 'every year'],
    'spring': ['spring', 'may', 'april', 'easter', 'bloom'],
    'summer': ['summer', 'july', 'august', 'solstice', 'hot'],
    'fall': ['fall', 'autumn', 'october', 'november', 'harvest'],
    'holiday': ['holiday', 'christmas', 'thanksgiving', 'festive', 'season'],
  
    // Region specific
    'vancouver': ['vancouver', 'downtown', 'stanley park', 'metro vancouver'],
    'victoria': ['victoria', 'island', 'capital', 'vancouver island'],
    'kelowna': ['kelowna', 'okanagan', 'interior'],
    'abbotsford': ['abbotsford', 'fraser valley', 'fraser'],
    'rural': ['rural', 'remote', 'northern', 'interior', 'countryside'],
  
    // Special event formats
    'gala': ['gala', 'dinner', 'banquet', 'formal', 'celebration', 'reception'],
    'concert': ['concert', 'music', 'performance', 'entertainment', 'show'],
    'virtual': ['virtual', 'online', 'digital', 'remote', 'zoom', 'webinar'],
    'golf': ['golf', 'tournament', 'putting', 'course', 'tee'],
    'community': ['community', 'local', 'neighborhood', 'grassroots', 'regional'],

    // New: Treatment methods related
    'precision-medicine': ['precision medicine', 'personalized treatment', 'targeted therapy', 'genomic', 'molecular', 'biomarker'],
    'immunotherapy': ['immunotherapy', 'immune system', 'car-t', 'checkpoint inhibitor', 'antibody therapy'],
    'radiation-therapy': ['radiation', 'radiotherapy', 'external beam', 'brachytherapy', 'proton therapy'],
    
    // New: BC Cancer specific programs
    'bc-cancer-research': ['bc cancer research', 'vancouver cancer research', 'cancer research centre', 'genome centre'],
    'screening-prevention': ['screening', 'early detection', 'prevention', 'risk assessment', 'genetic testing'],
    
    // New: Donation types
    'planned-giving': ['planned giving', 'legacy gift', 'estate planning', 'bequest', 'endowment'],
    'monthly-giving': ['monthly donor', 'sustaining gift', 'recurring donation', 'ongoing support'],
    'major-gifts': ['major gift', 'leadership giving', 'transformational gift', 'capital campaign'],
    
    // New: Special programs and facilities
    'medical-equipment': ['medical equipment', 'imaging', 'diagnostic', 'treatment technology', 'linear accelerator'],
    'support-programs': ['transportation assistance', 'accommodation', 'wig bank', 'nutrition', 'support group'],
    
    // New: BC Cancer signature events
    'signature-events': [
      'ride to conquer cancer',
      'hope couture',
      'inspiration gala',
      'jeans day',
      'golf for the cure'
    ]
};

// New: Category weight definitions
const CATEGORY_WEIGHTS = {
  // Core cancer type weights
  'breast-cancer': 1.5,
  'prostate-cancer': 1.5,
  'lung-cancer': 1.5,
  'brain-cancer': 1.5,
  'colorectal-cancer': 1.5,
  
  // BC Cancer specific program weights
  'bc-cancer-research': 2.0,
  'screening-prevention': 1.8,
  'signature-events': 1.7,
  
  // Treatment method weights
  'precision-medicine': 1.6,
  'immunotherapy': 1.6,
  'radiation-therapy': 1.6,
  
  // Donation type weights
  'planned-giving': 1.4,
  'monthly-giving': 1.4,
  'major-gifts': 1.5,
  
  // Default weight for other categories is 1.0
};

// New: Context relevance definitions
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
 * Analyze event text and extract keyword categories
 * @param {Object} event - Event object containing name, description, etc.
 * @returns {Array} - Returns found keyword categories and their weights
 */
export const analyzeEventKeywords = (event) => {
  if (!event) return [];
  
  // Combine event name and description, convert to lowercase for matching
  const text = `${event.name || ''} ${event.description || ''} ${event.type || ''}`.toLowerCase();
  const results = [];
  
  // Iterate through each keyword category
  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    // Find all matching keywords
    const matches = keywords.filter(keyword => {
      // If keyword starts with \b, it's a regex pattern
      if (keyword.startsWith('\\b')) {
        const regex = new RegExp(keyword, 'i');
        return regex.test(text);
      }
      // Otherwise use normal string inclusion check
      return text.includes(keyword.toLowerCase());
    });
    
    if (matches.length > 0) {
      // Get category weight, use default weight 1.0 if not defined
      const weight = CATEGORY_WEIGHTS[category] || 1.0;
      
      // Calculate score: number of matches * weight
      const score = matches.length * weight;
      
      // Extra points for keywords appearing in title
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
  
  // Sort by score in descending order
  return results.sort((a, b) => b.score - a.score);
};

/**
 * Analyze event context
 * @param {Object} event - Event object
 * @returns {Object} - Returns context analysis results
 */
export const analyzeEventContext = (event) => {
  const text = `${event.name || ''} ${event.description || ''}`.toLowerCase();
  const contextScores = {};
  
  for (const [context, patterns] of Object.entries(CONTEXT_PATTERNS)) {
    let score = 0;
    
    // Check main indicators
    patterns.indicators.forEach(indicator => {
      if (text.includes(indicator)) score += 2;
    });
    
    // Check related words
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
 * Find events similar to the given event
 * @param {Object} targetEvent - Target event
 * @param {Array} allEvents - Array of all events
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Array} - Array of similar events, sorted by similarity
 */
export const findSimilarEvents = (targetEvent, allEvents, maxResults = 5) => {
  if (!targetEvent || !allEvents || allEvents.length === 0) {
    return [];
  }
  
  // Analyze target event
  const targetKeywords = analyzeEventKeywords(targetEvent);
  const targetContext = analyzeEventContext(targetEvent);
  
  // Score similarity for other events
  const similarEvents = allEvents
    .filter(event => event.id !== targetEvent.id) // Exclude target event itself
    .map(event => {
      const eventKeywords = analyzeEventKeywords(event);
      const eventContext = analyzeEventContext(event);
      
      // Calculate keyword matching score
      const keywordScore = eventKeywords.reduce((score, keyword) => {
        const targetMatch = targetKeywords.find(tk => tk.category === keyword.category);
        if (targetMatch) {
          return score + (keyword.score * targetMatch.weight);
        }
        return score;
      }, 0);
      
      // Calculate context matching score
      const contextScore = Object.entries(eventContext).reduce((score, [context, value]) => {
        const targetValue = targetContext[context] || 0;
        return score + (value * targetValue);
      }, 0);
      
      return {
        event,
        similarityScore: keywordScore + contextScore,
        matchingCategories: eventKeywords.map(k => k.category),
        contextMatches: Object.keys(eventContext)
      };
    })
    .filter(result => result.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults);
    
  return similarEvents;
};

/**
 * Get display name for a category
 * @param {string} categoryKey - Category key
 * @returns {string} - Formatted display name
 */
export const getCategoryDisplayName = (categoryKey) => {
  // Convert snake_case to Title Case
  return categoryKey
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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