import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragEndEvent } from '@dnd-kit/core';
import { Question } from '../../../types/survey';
import { DragStateContext } from '../ChatInterface';

interface RankingProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
}

interface SortableItemProps {
  id: string;
  label: string;
  index: number;
  isTopChoice: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, label, index, isTopChoice }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
  } = useSortable({ id });

  const isActive = active?.id === id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { activeId, setActiveDragItem } = useContext(DragStateContext);

  useEffect(() => {
    if (isDragging && activeId === id) {
      setActiveDragItem(
        <DragOverlayContent $isTopChoice={isTopChoice}>
          <DragHandle aria-hidden>≡</DragHandle>
          <Number $isTopChoice={isTopChoice}>{index + 1}</Number>
          <Label>{label}</Label>
        </DragOverlayContent>
      );
    }
  }, [isDragging, activeId, id, isTopChoice, index, label, setActiveDragItem]);

  return (
    <OptionItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      $isActive={isActive}
      $isTopChoice={isTopChoice}
      {...attributes}
      {...listeners}
    >
      <DragHandle aria-hidden>≡</DragHandle>
      <Number $isTopChoice={isTopChoice}>{index + 1}</Number>
      <Label>{label}</Label>
    </OptionItem>
  );
};

const Ranking: React.FC<RankingProps> = ({ question, onAnswer, disabled }) => {
  const [items, setItems] = useState(question.options || []);
  const maxSelections = question.maxSelections || 3;
  const { setDragHandlers } = useContext(DragStateContext);

  // Register drag end handler
  useEffect(() => {
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (over && active.id !== over.id) {
        setItems((prevItems) => {
          const oldIndex = prevItems.findIndex((item) => item.id === active.id);
          const newIndex = prevItems.findIndex((item) => item.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(prevItems, oldIndex, newIndex);
          }
          return prevItems;
        });
      }
    };

    setDragHandlers({ onDragEnd: handleDragEnd });
  }, [setDragHandlers]);

  const handleSubmit = () => {
    const topItems = items.slice(0, maxSelections).map((opt) => opt.value);
    onAnswer(topItems);
  };

  return (
    <Container>
      <Instructions>Drag and drop to reorder</Instructions>
      
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <OptionsContainer>
          {items.map((option, index) => (
            <SortableItem
              key={option.id}
              id={option.id}
              label={option.label}
              index={index}
              isTopChoice={index < maxSelections}
            />
          ))}
        </OptionsContainer>
      </SortableContext>

      <SubmitSection>
        <Hint>Your top {maxSelections} selections will be submitted</Hint>
        <SubmitButton onClick={handleSubmit} disabled={disabled}>
          Continue with Top {maxSelections}
        </SubmitButton>
      </SubmitSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Instructions = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  text-align: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OptionItem = styled.div<{ 
  $isDragging?: boolean;
  $isActive?: boolean;
  $isTopChoice: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.primary + '10' : theme.colors.surface};
  border: 2px solid ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  opacity: ${({ $isDragging }) => ($isDragging ? 0.3 : 1)};
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  transform-origin: center center;
  will-change: transform, opacity;
  
  /* Float effect when active (grabbed but not yet dragging) */
  ${({ $isActive, $isDragging }) => $isActive && !$isDragging && `
    transform: scale(1.05) rotate(2deg);
    box-shadow: 
      0 20px 40px rgba(0,0,0,0.15),
      0 15px 25px rgba(0,0,0,0.1),
      0 0 40px rgba(0,85,165,0.1);
    animation: float 2s ease-in-out infinite;
    z-index: 1000;
    
    @keyframes float {
      0%, 100% {
        transform: scale(1.05) rotate(2deg) translateY(0px);
      }
      50% {
        transform: scale(1.05) rotate(2deg) translateY(-5px);
      }
    }
  `}
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
    
    ${({ $isActive, $isDragging }) => $isActive && !$isDragging && `
      transform: scale(1.03) rotate(1deg);
      
      @keyframes float {
        0%, 100% {
          transform: scale(1.03) rotate(1deg) translateY(0px);
        }
        50% {
          transform: scale(1.03) rotate(1deg) translateY(-3px);
        }
      }
    `}
  }
`;

const DragOverlayContent = styled.div<{ 
  $isTopChoice: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.15),
    0 15px 25px rgba(0,0,0,0.1),
    0 0 40px rgba(0,85,165,0.1);
  cursor: grabbing;
  min-width: 300px;
  transform: scale(1.05) rotate(2deg);
  animation: float 2s ease-in-out infinite;
  will-change: transform;
  
  @keyframes float {
    0%, 100% {
      transform: scale(1.05) rotate(2deg) translateY(0px);
    }
    50% {
      transform: scale(1.05) rotate(2deg) translateY(-5px);
    }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-width: 250px;
    transform: scale(1.03) rotate(1deg);
    
    @keyframes float {
      0%, 100% {
        transform: scale(1.03) rotate(1deg) translateY(0px);
      }
      50% {
        transform: scale(1.03) rotate(1deg) translateY(-3px);
      }
    }
  }
`;

const DragHandle = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  width: 24px;
  text-align: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`;

const Number = styled.span<{ $isTopChoice: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.text.inverse : theme.colors.text.primary};
  border-radius: 50%;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  flex-shrink: 0;
`;

const Label = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.4;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const SubmitSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

export default Ranking;