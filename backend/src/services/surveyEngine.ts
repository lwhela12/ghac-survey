import { logger } from '../utils/logger';
import { createClient } from 'redis';
import surveyStructure from '../database/survey-structure.json';

interface SurveyState {
  surveyId: string;
  responseId: string;
  currentBlockId: string;
  variables: Record<string, any>;
  completedBlocks: string[];
  answers: Record<string, any>;
}

class SurveyEngine {
  private redis: ReturnType<typeof createClient> | null = null;
  private blocks: typeof surveyStructure.blocks;
  private redisPromise: Promise<void> | null = null;
  private memoryStore: Map<string, SurveyState> = new Map();
  private useMemoryStore = true;

  constructor() {
    this.blocks = surveyStructure.blocks;
    // Only init Redis if URL is provided
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
      this.redisPromise = this.initRedis().catch(err => {
        logger.warn('Redis initialization failed, using memory store', err);
        this.useMemoryStore = true;
      });
    } else {
      logger.warn('Redis not configured, using memory store');
    }
  }

  private async initRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL
      });
      
      this.redis.on('error', err => {
        logger.error('Redis Client Error', err);
        this.useMemoryStore = true;
      });
      
      await this.redis.connect();
      this.useMemoryStore = false;
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      this.useMemoryStore = true;
      throw error;
    }
  }

  private async ensureRedis() {
    if (!this.redis && this.redisPromise) {
      try {
        await this.redisPromise;
      } catch (error) {
        logger.warn('Redis not available, using memory store');
      }
    }
    return this.redis;
  }

  async initializeState(sessionId: string, initialData: Partial<SurveyState>) {
    const state: SurveyState = {
      surveyId: initialData.surveyId!,
      responseId: initialData.responseId || '',
      currentBlockId: initialData.currentBlockId || 'b1',
      variables: initialData.variables || {},
      completedBlocks: [],
      answers: {}
    };

    if (this.useMemoryStore) {
      this.memoryStore.set(sessionId, state);
    } else {
      const redis = await this.ensureRedis();
      if (redis) {
        await redis.setEx(
          `survey:${sessionId}`,
          3600 * 24, // 24 hours
          JSON.stringify(state)
        );
      } else {
        this.memoryStore.set(sessionId, state);
      }
    }
  }

  async getState(sessionId: string): Promise<SurveyState | null> {
    if (this.useMemoryStore) {
      return this.memoryStore.get(sessionId) || null;
    }
    
    const redis = await this.ensureRedis();
    if (redis) {
      const data = await redis.get(`survey:${sessionId}`);
      return data ? JSON.parse(data) : null;
    }
    
    return this.memoryStore.get(sessionId) || null;
  }

  async updateState(sessionId: string, questionId: string, answer: any) {
    logger.debug(`Updating state for question ${questionId} with answer: ${answer}`);
    const state = await this.getState(sessionId);
    if (!state) return;

    // Save answer
    state.answers[questionId] = answer;
    state.completedBlocks.push(questionId);

    // Update variables based on answer
    const block = this.blocks[questionId as keyof typeof this.blocks];
    
    // If the block has a variable field, store the answer in that variable
    if (block && 'variable' in block) {
      const variableName = (block as any).variable;
      state.variables[variableName] = answer;
      logger.debug(`Stored answer in variable ${variableName}: ${answer}`);
    }
    
    if (block && 'options' in block) {
      const selectedOption = Array.isArray(block.options) && 
        block.options.find((opt: any) => opt.value === answer || opt.id === answer);
      
      if (selectedOption && 'setVariables' in selectedOption) {
        logger.debug(`Setting variables from option ${selectedOption.id}:`, selectedOption.setVariables);
        Object.assign(state.variables, selectedOption.setVariables);
        logger.debug('Updated variables:', state.variables);
      }
    }

    // Handle special variable updates
    this.updateSpecialVariables(state, questionId, answer);

    if (this.useMemoryStore) {
      this.memoryStore.set(sessionId, state);
    } else {
      const redis = await this.ensureRedis();
      if (redis) {
        await redis.setEx(
          `survey:${sessionId}`,
          3600 * 24,
          JSON.stringify(state)
        );
      } else {
        this.memoryStore.set(sessionId, state);
      }
    }
  }

  private updateSpecialVariables(state: SurveyState, questionId: string, answer: any) {
    // Update variables based on specific questions
    switch (questionId) {
      case 'b3': // Name
        state.variables.user_name = answer || '';
        break;
      case 'b4': // Connection type
        logger.debug(`Saving connection_type: ${answer}`);
        state.variables.connection_type = answer;
        break;
      case 'b5': // Arts connections
        state.variables.arts_connections = answer;
        state.variables.arts_connections_count = answer.length;
        state.variables.arts_connections_contains_other = answer.includes('other');
        break;
      case 'b6': // Arts importance
        state.variables.arts_importance = answer;
        break;
      case 'b16': // Contact methods selection (multi-select)
        if (Array.isArray(answer)) {
          state.variables.contact_methods = answer;
          state.variables.wants_email = answer.includes('email');
          state.variables.wants_text = answer.includes('text');
          state.variables.wants_print = answer.includes('print') || answer.includes('newsletter');
          state.variables.wants_social = answer.includes('social');
          state.variables.wants_conversations = answer.includes('conversations');
          state.variables.wants_no_updates = answer.includes('no-updates');
          // Derived: any selection that requires contact details
          state.variables.contact_info_needed = !!(
            state.variables.wants_email ||
            state.variables.wants_text ||
            state.variables.wants_print
          );
          // Reset consent flags on change
          state.variables.contact_info_confirmed = false;
          state.variables.contact_info_skipped = false;
        }
        break;
      case 'b16-contact-confirm':
        // Quick confirm to gather contact details now or not
        // Answer comes as 'yes' or 'no'
        state.variables.contact_info_consent = answer;
        state.variables.contact_info_confirmed = answer === 'yes';
        state.variables.contact_info_skipped = answer === 'no';
        break;
      case 'b16a-contact':
        if (typeof answer === 'object' && answer !== null) {
          if (answer.firstName) state.variables.first_name = answer.firstName;
          if (answer.lastName) state.variables.last_name = answer.lastName;
          if (answer.address1) state.variables.contact_address1 = answer.address1;
          if (answer.address2) state.variables.contact_address2 = answer.address2;
          if (answer.city) state.variables.contact_city = answer.city;
          if (answer.state) state.variables.contact_state = answer.state;
          if (answer.zip) state.variables.contact_zip = answer.zip;
          if (answer.email) state.variables.contact_email = answer.email;
          if (answer.phone) state.variables.contact_phone = answer.phone;
          if (answer.type === 'skipped') state.variables.contact_form_skipped = true;
          state.variables.name_captured = !!(state.variables.first_name || state.variables.last_name);
          state.variables.contact_form_completed = true;
        } else {
          state.variables.contact_form_completed = true;
        }
        break;
      case 'b16-contact-skip':
        state.variables.contact_form_skip_ack_shown = true;
        break;
      case 'b16a-social':
        state.variables.social_shown = true;
        break;
      case 'b16-chat-again':
        state.variables.chat_again_shown = true;
        break;
      case 'b7': // VideoAsk personal story
        if (typeof answer === 'object' && answer !== null) {
          state.variables.personal_story_type = answer.type || 'skipped';
          state.variables.personal_story_response_id = answer.responseId || null;
          state.variables.personal_story_response_url = answer.responseUrl || null;
        } else {
          state.variables.personal_story_type = 'skipped';
        }
        break;
      case 'b12': // VideoAsk magic wand question
        if (typeof answer === 'object' && answer !== null) {
          state.variables.future_vision_type = answer.type || 'skipped';
          state.variables.future_vision_response_id = answer.responseId || null;
          state.variables.future_vision_response_url = answer.responseUrl || null;
        } else {
          state.variables.future_vision_type = 'skipped';
        }
        break;
      case 'b18': // Demographics consent
        state.variables.demographics_consent = answer;
        break;
      case 'b19': // Demographics answers
        // Demographics returns an object with multiple answers
        if (typeof answer === 'object' && answer !== null) {
          Object.assign(state.variables, answer);
        }
        break;
      // Add more cases as needed
    }
  }

  async getFirstQuestion(_surveyId: string) {
    return this.blocks.b0;
  }

  async getCurrentQuestion(sessionId: string) {
    const state = await this.getState(sessionId);
    if (!state) return null;

    return this.blocks[state.currentBlockId as keyof typeof this.blocks];
  }

  async getNextQuestion(sessionId: string, currentQuestionId: string, answer: any): Promise<any> {
    logger.debug(`Getting next question after ${currentQuestionId} with answer: ${answer}`);
    
    const state = await this.getState(sessionId);
    if (!state) {
      logger.error('No state found for session:', sessionId);
      return null;
    }

    // Check if this is a dynamic message (like empty-message)
    if (currentQuestionId.endsWith('-empty-message')) {
      logger.debug('Handling dynamic empty-message block');
      // Extract the original question ID and get its next block
      const originalQuestionId = currentQuestionId.replace('-empty-message', '');
      const originalBlock = this.blocks[originalQuestionId as keyof typeof this.blocks];
      if (originalBlock && 'onEmpty' in originalBlock) {
        const onEmpty = originalBlock.onEmpty as any;
        const nextBlockId = onEmpty.next || originalBlock.next;
        logger.debug(`Empty message next block: ${nextBlockId}`);
        if (nextBlockId) {
          state.currentBlockId = nextBlockId;
          await this.saveState(sessionId, state);
          const nextBlock = this.blocks[nextBlockId as keyof typeof this.blocks];
          logger.debug('Returning next block after empty message:', nextBlock);
          return nextBlock;
        }
      }
    }

    const currentBlock = this.blocks[currentQuestionId as keyof typeof this.blocks];
    if (!currentBlock) {
      logger.error('No block found for ID:', currentQuestionId);
      return null;
    }

    let nextBlockId: string | null = null;

    // Handle onEmpty case for empty answers
    if (answer === '' && 'onEmpty' in currentBlock) {
      const onEmpty = currentBlock.onEmpty as any;
      if (onEmpty.message) {
        // Return a dynamic message block for the onEmpty message
        logger.debug(`Empty answer message: ${onEmpty.message}`);
        return {
          id: `${currentQuestionId}-empty-message`,
          type: 'dynamic-message',
          content: onEmpty.message,
          next: onEmpty.next || currentBlock.next
        };
      }
      nextBlockId = onEmpty.next || currentBlock.next;
    } 
    // Handle different navigation patterns
    else if ('next' in currentBlock) {
      nextBlockId = currentBlock.next as string;
      // Debug logging for VideoAsk questions
      if (currentQuestionId === 'b12' || currentQuestionId === 'b7') {
        logger.debug(`VideoAsk navigation: ${currentQuestionId} -> ${nextBlockId}`);
      }
    }

    // Handle option-based navigation
    if ('options' in currentBlock && Array.isArray(currentBlock.options)) {
      const selectedOption = currentBlock.options.find(
        (opt: any) => {
          // Handle different types of comparisons
          if (opt.value === answer || opt.id === answer) {
            return true;
          }
          // Handle boolean/string comparisons
          if (typeof opt.value === 'boolean' && typeof answer === 'string') {
            return opt.value === (answer === 'true');
          }
          if (typeof opt.value === 'string' && typeof answer === 'boolean') {
            return (opt.value === 'true') === answer;
          }
          return false;
        }
      );
      if (selectedOption && 'next' in selectedOption) {
        nextBlockId = selectedOption.next;
      }
    }

    // Handle conditionalNext in current block
    if (!nextBlockId && 'conditionalNext' in currentBlock) {
      const conditionalNext = currentBlock.conditionalNext as any;
      nextBlockId = this.evaluateConditionalNext(conditionalNext, state.variables);
    }

    // Handle conditional display
    if (nextBlockId) {
      const nextBlock = this.blocks[nextBlockId as keyof typeof this.blocks];
      if (nextBlock && 'showIf' in nextBlock) {
        const shouldShow = this.evaluateCondition(nextBlock.showIf, state.variables);
        if (!shouldShow) {
          // Skip to next question
          state.currentBlockId = nextBlockId;
          await this.saveState(sessionId, state);
          return this.getNextQuestion(sessionId, nextBlockId, null);
        }
      }
    }

    if (nextBlockId) {
      logger.debug(`Next block ID: ${nextBlockId}`);
      state.currentBlockId = nextBlockId;
      await this.saveState(sessionId, state);
      const nextBlock = this.blocks[nextBlockId as keyof typeof this.blocks];
      
      // Check if this is an empty content routing block, auto-advance if so
      if (nextBlock && (nextBlock.type === 'routing' || (nextBlock.type === 'dynamic-message' && 
          (!nextBlock.content || nextBlock.content === '') && 
          'conditionalNext' in nextBlock))) {
        logger.debug(`Auto-advancing through empty routing block: ${nextBlockId}`);
        return this.getNextQuestion(sessionId, nextBlockId, 'acknowledged');
      }
      
      // Special logging for VideoAsk questions
      if (nextBlock && nextBlock.type === 'videoask') {
        logger.debug(`Returning VideoAsk block: ${nextBlockId}`, {
          id: nextBlock.id,
          type: nextBlock.type,
          videoAskFormId: (nextBlock as any).videoAskFormId,
          content: nextBlock.content
        });
      }
      
      logger.debug(`Returning next block:`, nextBlock);
      return nextBlock;
    }

    logger.warn('No next block found');
    return null;
  }

  private evaluateConditionalNext(conditionalNext: any, variables: Record<string, any>): string | null {
    if (!conditionalNext) return null;
    
    if (this.evaluateCondition(conditionalNext.if, variables)) {
      return conditionalNext.then;
    } else {
      // Check if else is a nested condition
      if (typeof conditionalNext.else === 'object' && 'if' in conditionalNext.else) {
        // Recursively evaluate nested condition
        return this.evaluateConditionalNext(conditionalNext.else, variables);
      } else {
        // Simple else value
        return conditionalNext.else;
      }
    }
  }

  private evaluateCondition(condition: any, variables: Record<string, any>): boolean {
    if ('variable' in condition && 'equals' in condition) {
      // Handle array comparisons without mutating the originals
      if (Array.isArray(condition.equals) && Array.isArray(variables[condition.variable])) {
        const a = [...condition.equals].sort();
        const b = [...variables[condition.variable]].sort();
        return JSON.stringify(a) === JSON.stringify(b);
      }
      return variables[condition.variable] === condition.equals;
    }

    if ('variable' in condition && 'contains' in condition) {
      // Check if array contains a value
      const varValue = variables[condition.variable];
      if (Array.isArray(varValue)) {
        return varValue.includes(condition.contains);
      }
      return false;
    }

    if ('variable' in condition && 'greaterThan' in condition) {
      return variables[condition.variable] > condition.greaterThan;
    }

    if ('variable' in condition && 'lessThan' in condition) {
      return variables[condition.variable] < condition.lessThan;
    }

    if ('not' in condition) {
      return !this.evaluateCondition(condition.not, variables);
    }

    if ('or' in condition) {
      if (Array.isArray(condition.or)) {
        return condition.or.some((cond: any) => this.evaluateCondition(cond, variables));
      }
      return this.evaluateCondition(condition.or, variables);
    }

    if ('and' in condition) {
      return condition.and.every((cond: any) => this.evaluateCondition(cond, variables));
    }

    return true;
  }

  async calculateProgress(sessionId: string): Promise<number> {
    const state = await this.getState(sessionId);
    if (!state) return 0;

    // Define the main survey path (blocks that most users will see)
    const mainPath = [
      'b1', 'b2', 'b3', 'b4', 'b4a', 'b5', 'b6', 'b7', 'b8', 'b9',
      'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'
    ];
    
    // Add conditional blocks based on user's path
    const expectedBlocks = [...mainPath];
    
    // Contact confirmation and sub-forms
    const contactNeeded = !!state.variables.contact_info_needed;
    const contactConfirmed = state.variables.contact_info_confirmed === true;
    const wantsSocial = state.variables.wants_social === true;
    const wantsChat = state.variables.wants_conversations === true;
    if (contactNeeded) {
      expectedBlocks.push('b16-contact-confirm');
      if (contactConfirmed) {
        expectedBlocks.push('b16-contact-great');
        expectedBlocks.push('b16-contact-preface');
        expectedBlocks.push('b16a-contact');
      }
    }
    // Social/chat order: chat -> social
    if ((!contactNeeded || contactConfirmed) && wantsChat) expectedBlocks.push('b16-chat-again');
    if ((!contactNeeded || contactConfirmed) && wantsSocial) expectedBlocks.push('b16a-social');
    
    // If user consented to demographics, they see b19
    if (state.variables.demographics_consent === true) {
      expectedBlocks.push('b19');
    }
    
    // b20 is always the final block
    expectedBlocks.push('b20');
    
    // Count how many expected blocks have been completed
    const completedCount = expectedBlocks.filter(blockId => 
      state.completedBlocks.includes(blockId)
    ).length;
    
    const progress = Math.round((completedCount / expectedBlocks.length) * 100);
    
    // Ensure progress never exceeds 100% even if extra blocks were completed
    return Math.min(progress, 100);
  }

  formatQuestionForClient(question: any, variables: Record<string, any>) {
    // Deep clone to avoid modifying original
    const formatted = JSON.parse(JSON.stringify(question));

    // Replace template variables
    const replaceVariables = (text: string) => {
      // First handle if-else conditionals
      text = text.replace(/\{\{#if (\w+)\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/g, 
        (_match, varName, ifText, elseText) => {
          return variables[varName] ? ifText : elseText;
        }
      );
      
      // Then handle if conditionals without else
      text = text.replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/g,
        (_match, varName, ifText) => {
          return variables[varName] ? ifText : '';
        }
      );
      
      // Finally handle simple variable replacements
      text = text.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
        return variables[varName] || '';
      });
      
      return text;
    };

    // Replace in content
    if (typeof formatted.content === 'string') {
      formatted.content = replaceVariables(formatted.content);
    } else if (typeof formatted.content === 'object' && formatted.contentCondition) {
      // Handle conditional content
      logger.debug(`Evaluating content condition for question ${formatted.id}:`, formatted.contentCondition);
      logger.debug('Current variables:', variables);
      const conditionResult = this.evaluateCondition(formatted.contentCondition.if, variables);
      logger.debug(`Condition result: ${conditionResult}`);
      const contentKey = conditionResult ? formatted.contentCondition.then : formatted.contentCondition.else;
      logger.debug(`Selected content key: ${contentKey}`);
      formatted.content = replaceVariables(formatted.content[contentKey]);
      logger.debug(`Final content for ${formatted.id}: "${formatted.content}"`);
    } else if (formatted.type === 'dynamic-message' && typeof formatted.content === 'object') {
      // Handle dynamic-message type - select content based on previous answer
      // The content key should match the previous answer value (stored in variables)
      logger.debug('Processing dynamic-message with variables:', variables);
      logger.debug('Available content keys:', Object.keys(formatted.content));
      
      let selectedContent = formatted.content.default || 'Thanks for sharing!';
      
      // Look for the connection type in variables
      if (variables.connection_type) {
        logger.debug(`Looking for content with key: ${variables.connection_type}`);
        if (formatted.content[variables.connection_type]) {
          selectedContent = formatted.content[variables.connection_type];
          logger.debug('Found matching content!');
        } else {
          logger.debug('No matching content found, using default');
        }
      } else {
        logger.debug('No connection_type in variables');
      }
      
      formatted.content = replaceVariables(selectedContent);
    }
    
    // Handle conditionalContent array (for multiple conditions)
    if (formatted.conditionalContent && Array.isArray(formatted.conditionalContent)) {
      let matchedContent = null;
      
      for (const item of formatted.conditionalContent) {
        if (item.condition === 'default') {
          matchedContent = item.content;
          break;
        }
        if (this.evaluateCondition(item.condition, variables)) {
          matchedContent = item.content;
          break;
        }
      }
      
      if (matchedContent && (formatted.content === 'placeholder' || formatted.content === '')) {
        formatted.content = replaceVariables(matchedContent);
      }
    }
    
    // Replace variables in options if they exist
    if (formatted.options && Array.isArray(formatted.options)) {
      formatted.options = formatted.options.map((option: any) => ({
        ...option,
        label: option.label ? replaceVariables(option.label) : option.label
      }));
    }
    
    // Replace variables in placeholder if it exists
    if (formatted.placeholder) {
      formatted.placeholder = replaceVariables(formatted.placeholder);
    }

    return formatted;
  }

  async clearState(sessionId: string) {
    if (this.useMemoryStore) {
      this.memoryStore.delete(sessionId);
    } else {
      const redis = await this.ensureRedis();
      if (redis) {
        await redis.del(`survey:${sessionId}`);
      } else {
        this.memoryStore.delete(sessionId);
      }
    }
  }

  private async saveState(sessionId: string, state: SurveyState) {
    if (this.useMemoryStore) {
      this.memoryStore.set(sessionId, state);
    } else {
      const redis = await this.ensureRedis();
      if (redis) {
        await redis.setEx(
          `survey:${sessionId}`,
          3600 * 24,
          JSON.stringify(state)
        );
      } else {
        this.memoryStore.set(sessionId, state);
      }
    }
  }
}

export const surveyEngine = new SurveyEngine();
