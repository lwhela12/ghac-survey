import React from 'react';
import { Question } from '../../types/survey';
import VideoAutoplay from './QuestionTypes/VideoAutoplay';
import QuickReply from './QuestionTypes/QuickReply';
import TextInput from './QuestionTypes/TextInput';
import SingleChoice from './QuestionTypes/SingleChoice';
import MultiChoice from './QuestionTypes/MultiChoice';
import Scale from './QuestionTypes/Scale';
import MixedMedia from './QuestionTypes/MixedMedia';
import SemanticDifferential from './QuestionTypes/SemanticDifferential';
import Ranking from './QuestionTypes/Ranking';
import YesNo from './QuestionTypes/YesNo';
import ContactForm from './QuestionTypes/ContactForm';
import Demographics from './QuestionTypes/Demographics';
import FinalMessage from './QuestionTypes/FinalMessage';

interface QuestionRendererProps {
  question: Question;
  onAnswer: (answer: any) => void;
  disabled?: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ 
  question, 
  onAnswer, 
  disabled = false 
}) => {
  switch (question.type) {
    case 'video-autoplay':
      return <VideoAutoplay question={question} onComplete={onAnswer} />;
    
    case 'quick-reply':
    case 'message-button':
      return <QuickReply question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'text-input':
    case 'text-input-followup':
      return <TextInput question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'single-choice':
      return <SingleChoice question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'multi-choice':
      return <MultiChoice question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'scale':
      return <Scale question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'mixed-media':
      return <MixedMedia question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'semantic-differential':
      return <SemanticDifferential question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'ranking':
      return <Ranking question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'yes-no':
      return <YesNo question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'contact-form':
      return <ContactForm question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'demographics':
      return <Demographics question={question} onAnswer={onAnswer} disabled={disabled} />;
    
    case 'final-message':
      return <FinalMessage question={question} onAnswer={onAnswer} />;
    
    case 'dynamic-message':
      // Dynamic messages are handled directly in ChatInterface
      return null;
    
    default:
      console.warn(`Unknown question type: ${question.type}`);
      return null;
  }
};

export default QuestionRenderer;