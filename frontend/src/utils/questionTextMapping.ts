// Question text mapping based on the survey structure
// This maps question IDs (blockIds) to their actual text

export const questionTextMap: Record<string, string> = {
  // Opening and intro
  'b0': 'Introduction - Hi! I\'m Amanda Roy',
  'b1': 'Welcome video from Amanda Roy, CEO',
  'b1a': 'Yep, that\'s me!',
  'b1b': 'We take your privacy seriously',
  'b1c': 'Privacy policy information',
  'b2': 'Ready to share your thoughts? (It\'ll take about 8-10 minutes)',
  'b2-info': 'Tell me more first - Of course!',
  'b2-info-1': 'About GHAC - Reimagining connections',
  'b2-info-2': 'This is a listening tour',
  'b2-info-ready': 'Ready to begin?',
  'b2-info-goodbye': 'Thanks for stopping by',
  'b2-info-exit': 'Early exit - Explore GHAC?',
  'b3': 'What should I call you?',
  'b3-response': 'Name acknowledgment',
  'b3-empty-message': 'No problem! Let\'s get started.',
  
  // Connection and engagement
  'b4': 'Connection to Greater Hartford Arts Council',
  'b4-past-engagement': 'Welcome back! When was the last time you engaged or donated to the Greater Hartford Arts Council?',
  'b4a': 'Thank you message based on connection type',
  'b4a-other': 'Other connection details',
  'b5': 'How do you currently connect with the arts in our region?',
  'b5-response': 'Arts connection response routing',
  'b5-other-only': 'Other arts connection details',
  'b5-thanks': 'Thanks for sharing',
  'b5-normal-response': 'Arts connection acknowledgment',
  'b5-other-multi': 'Multiple arts connections with other',
  'b6': 'How essential are arts and culture to making Greater Hartford a thriving place? (0-5 scale)',
  'b6-response': 'Arts importance response',
  
  // Personal stories and perception
  'b7': 'What\'s one way the arts have touched your life personally?',
  'b8': 'What drives your giving decisions most? (Supporter) / What would be most important to you? (Non-supporter)',
  'b9': 'Where would you place GHAC on these spectrums?',
  'b10': 'If GHAC could offer you one thing, what type of relationship would feel most meaningful?',
  'b11': 'What makes it challenging to engage with arts organizations at the level you\'d like?',
  'b12': 'If you could wave a magic wand and transform one thing about arts organizations\' relationships, what would it be?',
  
  // Future engagement
  'b13': 'Which of these resonate with your personal relationship to creativity?',
  'b14': 'What would you most like to see strengthen in Greater Hartford\'s arts ecosystem? (Rank top 3)',
  'b15': 'What specific opportunities might interest you in the next year?',
  
  // Contact preferences and closing
  'b16': 'How would you prefer to hear from us about opportunities?',
  'b16-contact-confirm': 'Confirm sharing contact information',
  'b16-contact-great': 'Contact info confirmation success',
  'b16-contact-preface': 'Feel free to share any or all ways to stay in touch.',
  'b16-contact-skip': 'No worries! (contact info skipped)',
  'b16a-contact': 'Contact information (name, address, phone, email)',
  'b16a-social': 'Follow us on social media',
  'b16-chat-again': 'We will work on putting more of these together!',
  'b17': 'How valuable was this conversation for you?',
  'b18': 'Would you be willing to share a bit more about yourself? (Demographics)',
  'b19': 'Which age range best describes you?',
  'b19.2': 'What best describes your gender identity?',
  'b19.2-self-describe': 'Please describe your gender',
  'b19.3': 'How would you describe your racial or ethnic background?',
  'b19.3-self-describe': 'Please describe your race and ethnicity',
  'b19.4': 'What\'s been your typical annual support level?',
  'b19.5': 'What\'s your ZIP code?',
  'b20': 'Thank you for sharing! Want to explore what GHAC is up to right now?'
};

// Helper to get question text from various ID formats
export const getQuestionTextFromId = (questionId: string): string => {
  // First check if it's a blockId we recognize
  if (questionTextMap[questionId]) {
    return questionTextMap[questionId];
  }
  
  // Check metadata for blockId if this is a UUID
  // This will be handled by the component using metadata
  
  return `Question ${questionId}`;
};

// Format complex answers for display
export const formatComplexAnswer = (answer: any): string => {
  // Handle multiple choice arrays
  if (Array.isArray(answer.answer_choice_ids) && answer.answer_choice_ids.length > 0) {
    return answer.answer_choice_ids.join(', ');
  }
  
  // Handle metadata with scale values or demographic data
  if (answer.metadata && typeof answer.metadata === 'object') {
    const metadata = answer.metadata;
    const blockId = metadata.blockId;
    
    // b18 is just Yes/No for demographics consent
    if (blockId === 'b18') {
      // The answer_text should contain Yes or No
      return answer.answer_text || 'No answer provided';
    }
    
    // Each demographic question saves its own answer
    if (blockId === 'b19' || blockId === 'b19.2' || blockId === 'b19.3' || 
        blockId === 'b19.4' || blockId === 'b19.5') {
      // These should have their answers in answer_text or answer_choice_ids
      if (answer.answer_choice_ids && answer.answer_choice_ids.length > 0) {
        return answer.answer_choice_ids.join(', ');
      }
      return answer.answer_text || 'No answer provided';
    }
    
    // Legacy check for old format (if any)
    if (blockId === 'b19-old-format') {
      const demographicFields: string[] = [];
      
      // Handle each demographic field
      if (metadata.user_age) {
        demographicFields.push(`Age: ${metadata.user_age}`);
      }
      if (metadata.user_zip) {
        demographicFields.push(`ZIP: ${metadata.user_zip}`);
      }
      if (metadata.giving_level) {
        demographicFields.push(`Giving Level: $${metadata.giving_level}`);
      }
      if (metadata.race_ethnicity) {
        const races = Array.isArray(metadata.race_ethnicity) 
          ? metadata.race_ethnicity.join(', ') 
          : metadata.race_ethnicity;
        demographicFields.push(`Race/Ethnicity: ${races}`);
      }
      if (metadata.gender_identity) {
        demographicFields.push(`Gender: ${metadata.gender_identity}`);
      }
      
      if (demographicFields.length > 0) {
        return demographicFields.join(' | ');
      }
    }
    
    // Check for semantic differential scales or other complex data
    const scaleKeys = Object.keys(metadata).filter(key => key !== 'blockId');
    if (scaleKeys.length > 0) {
      // Check if this looks like semantic differential data
      const hasScaleValues = scaleKeys.some(key => 
        typeof metadata[key] === 'number' && metadata[key] >= 1 && metadata[key] <= 5
      );
      
      if (hasScaleValues) {
        return scaleKeys.map(key => {
          const value = metadata[key];
          // Format scale name and value
          const scaleName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `${scaleName}: ${value}/5`;
        }).join(', ');
      }
    }
  }
  
  // Handle empty answer_text but with video_url
  if (!answer.answer_text && answer.video_url) {
    return 'Video response provided';
  }
  
  // Default to answer_text
  return answer.answer_text || 'No answer provided';
};

// Get the actual question type based on the question ID
export const getQuestionType = (questionId: string, answer: any): string => {
  const typeMap: Record<string, string> = {
    'b1': 'video',
    'b2': 'single-choice',
    'b2-info': 'yes-no',
    'b3': 'text-input',
    'b3-empty-message': 'dynamic-message',
    'b4': 'single-choice',
    'b4-past-engagement': 'single-choice',
    'b4a': 'dynamic-message',
    'b5': 'multi-choice',
    'b6': 'scale',
    'b7': 'mixed-media',
    'b8': 'single-choice',
    'b9': 'semantic-differential',
    'b10': 'single-choice',
    'b11': 'multi-choice',
    'b12': 'mixed-media',
    'b13': 'multi-choice',
    'b14': 'ranking',
    'b15': 'multi-choice',
    'b16': 'single-choice',
    'b17': 'scale',
    'b18': 'demographics',
    'b19': 'dynamic-message'
  };
  
  // Try to get from metadata blockId
  const blockId = answer.metadata?.blockId || questionId;
  if (typeMap[blockId]) {
    return typeMap[blockId];
  }
  
  // Fallback to inferring from answer
  if (answer.video_url) return 'video';
  if (answer.answer_choice_ids?.length > 0) return 'multi-choice';
  if (answer.answer_text === 'acknowledged') return 'dynamic-message';
  
  return 'unknown';
};
