import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface RankingProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
}

const Ranking: React.FC<RankingProps> = ({ question, onAnswer, disabled }) => {
  const [items, setItems] = useState(question.options || []);
  const maxSelections = question.maxSelections || 3;

  const sensors = useSensors(
    // Start quickly on mouse; small movement threshold removes dragginess
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    // Long-press on touch to avoid accidental scrolls
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = useMemo(() => items.map((it) => it.id), [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setItems((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleSubmit = () => {
    const topItems = items.slice(0, maxSelections).map((opt) => opt.value);
    onAnswer(topItems);
  };

  return (
    <Container>
      <Instructions>
        Drag to rank your top {maxSelections} priorities:
      </Instructions>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <OptionsContainer>
            {items.map((option, index) => (
              <SortableItem
                key={option.id}
                id={option.id}
                index={index}
                label={option.label}
                isTop={index < maxSelections}
                disabled={!!disabled}
              />
            ))}
          </OptionsContainer>
        </SortableContext>
      </DndContext>

      <SubmitSection>
        <Hint>Your top {maxSelections} selections will be submitted</Hint>
        <SubmitButton onClick={handleSubmit} disabled={disabled}>
          Continue with Top {maxSelections}
        </SubmitButton>
      </SubmitSection>
    </Container>
  );
};

interface SortableItemProps {
  id: string;
  index: number;
  label: string;
  isTop: boolean;
  disabled: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, index, label, isTop, disabled }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  // Detect coarse (touch) pointers to keep handle-only drag on mobile
  const [isCoarse, setIsCoarse] = useState<boolean>(false);
  useEffect(() => {
    try {
      const mm = window.matchMedia('(pointer: coarse)');
      setIsCoarse(mm.matches || navigator.maxTouchPoints > 0);
      const listener = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
      if (mm.addEventListener) mm.addEventListener('change', listener);
      else if ((mm as any).addListener) (mm as any).addListener(listener);
      return () => {
        if (mm.removeEventListener) mm.removeEventListener('change', listener);
        else if ((mm as any).removeListener) (mm as any).removeListener(listener);
      };
    } catch {
      setIsCoarse(navigator.maxTouchPoints > 0);
    }
  }, []);

  return (
    <OptionItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      $isDragOver={false}
      $isTopChoice={isTop}
      data-index={index}
      tabIndex={0}
      // On desktop, make whole card draggable for better discoverability
      {...(!isCoarse ? { ...attributes, ...listeners } : {})}
    >
      {/* On touch devices, keep the handle as the drag target to avoid accidental drags */}
      <DragHandle {...(isCoarse ? { ...attributes, ...listeners } : {})} aria-label="Drag to reorder">⋮⋮</DragHandle>
      <Number $isTopChoice={isTop}>{index + 1}</Number>
      <Label>{label}</Label>
    </OptionItem>
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
  cursor: grab;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $isDragging }) => ($isDragging ? 0.5 : 1)};
  transform: ${({ $isDragOver }) => ($isDragOver ? 'scale(1.02)' : 'scale(1)')};
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  
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
