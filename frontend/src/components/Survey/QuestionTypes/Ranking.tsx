import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface RankingProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
}

const Ranking: React.FC<RankingProps> = ({ question, onAnswer, disabled }) => {
  const [items, setItems] = useState(question.options || []);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const maxSelections = question.maxSelections || 3;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDragOverItem(null);
      return;
    }

    const draggedOption = items[draggedItem];
    const newItems = [...items];
    
    // Remove dragged item
    newItems.splice(draggedItem, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedOption);
    
    setItems(newItems);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleSubmit = () => {
    const topItems = items.slice(0, maxSelections).map(opt => opt.value);
    onAnswer(topItems);
  };

  // Touch support for mobile
  const [touchItem, setTouchItem] = useState<number | null>(null);

  const handleTouchStart = (_e: React.TouchEvent, index: number) => {
    setTouchItem(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchItem === null) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropIndex = element?.closest('[data-index]')?.getAttribute('data-index');
    
    if (dropIndex !== null && dropIndex !== undefined) {
      setDragOverItem(parseInt(dropIndex));
    }
  };

  const handleTouchEnd = () => {
    if (touchItem !== null && dragOverItem !== null && touchItem !== dragOverItem) {
      const draggedOption = items[touchItem];
      const newItems = [...items];
      
      newItems.splice(touchItem, 1);
      newItems.splice(dragOverItem, 0, draggedOption);
      
      setItems(newItems);
    }
    
    setTouchItem(null);
    setDragOverItem(null);
  };

  return (
    <Container>
      <Instructions>
        Drag to rank your top {maxSelections} priorities:
      </Instructions>
      
      <OptionsContainer>
        {items.map((option, index) => (
          <OptionItem
            key={option.id}
            data-index={index}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            $isDragging={draggedItem === index}
            $isDragOver={dragOverItem === index}
            $isTopChoice={index < maxSelections}
          >
            <DragHandle>⋮⋮</DragHandle>
            <Number $isTopChoice={index < maxSelections}>{index + 1}</Number>
            <Label>{option.label}</Label>
          </OptionItem>
        ))}
      </OptionsContainer>
      
      <SubmitSection>
        <Hint>Your top {maxSelections} selections will be submitted</Hint>
        <SubmitButton onClick={handleSubmit} disabled={disabled}>
          Continue with Top {maxSelections}
        </SubmitButton>
      </SubmitSection>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Instructions = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OptionItem = styled.div<{ 
  $isDragging: boolean; 
  $isDragOver: boolean;
  $isTopChoice: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, $isTopChoice }) =>
    $isTopChoice ? theme.colors.primary + '10' : theme.colors.surface};
  border: 2px solid ${({ theme, $isDragOver, $isTopChoice }) =>
    $isDragOver ? theme.colors.primary : $isTopChoice ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: move;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $isDragging }) => ($isDragging ? 0.5 : 1)};
  transform: ${({ $isDragOver }) => ($isDragOver ? 'scale(1.02)' : 'scale(1)')};
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.primary}50;
  }
`;

const DragHandle = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  cursor: grab;
  
  &:active {
    cursor: grabbing;
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
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const Label = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const SubmitSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
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
`;

export default Ranking;