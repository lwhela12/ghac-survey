import React, { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

interface RankingProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
}

const Ranking: React.FC<RankingProps> = ({ question, onAnswer, disabled }) => {
  const [items, setItems] = useState(question.options || []);
  const maxSelections = question.maxSelections || 3;

  // Mobile tap-to-swap state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setItemRef = (id: string) => (el: HTMLDivElement | null) => {
    itemRefs.current[id] = el;
  };
  const pendingSwap = useRef<{ a: string; b: string; oldPos: Record<string, number> } | null>(null);

  // Run simple FLIP animation for swapped items on mobile
  useLayoutEffect(() => {
    if (!pendingSwap.current) return;
    const { a, b, oldPos } = pendingSwap.current;
    const ids = [a, b];
    const newPos: Record<string, number> = {};
    try {
      // Measure new positions
      ids.forEach((id) => {
        const el = itemRefs.current[id];
        if (el) newPos[id] = el.getBoundingClientRect().top;
      });

      // Apply FLIP for each swapped element
      ids.forEach((id) => {
        const el = itemRefs.current[id];
        if (!el) return;
        const dy = (oldPos[id] ?? 0) - (newPos[id] ?? 0);
        if (typeof dy !== 'number' || !isFinite(dy) || Math.abs(dy) < 1) return;

        el.style.transition = 'none';
        el.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform 180ms ease-out';
          el.style.transform = 'translateY(0)';
          const cleanup = () => {
            el.style.transition = '';
            el.style.transform = '';
            el.removeEventListener('transitionend', cleanup);
          };
          // Fallback cleanup in case transitionend doesn't fire
          const timeout = window.setTimeout(cleanup, 220);
          const wrappedCleanup = () => {
            window.clearTimeout(timeout);
            cleanup();
          };
          el.addEventListener('transitionend', wrappedCleanup);
        });
      });
    } catch (e) {
      // Swallow any animation errors to avoid crashing the app
      // eslint-disable-next-line no-console
      console.warn('Ranking FLIP animation skipped:', e);
    } finally {
      pendingSwap.current = null;
      // Ensure selection highlight is cleared as soon as animation completes
      setSelectedId(null);
    }
  }, [items]);

  const handleItemClick = (id: string) => {
    if (disabled) return;
    if (!selectedId) {
      setSelectedId(id);
      return;
    }
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    // Swap selectedId with id
    const from = items.findIndex((it) => it.id === selectedId);
    const to = items.findIndex((it) => it.id === id);
    if (from === -1 || to === -1) {
      setSelectedId(null);
      return;
    }
    // Record old positions for FLIP
    const oldPos: Record<string, number> = {};
    [selectedId, id].forEach((key) => {
      const el = itemRefs.current[key];
      if (el) oldPos[key] = el.getBoundingClientRect().top;
    });
    setItems((prev) => {
      const next = prev.slice();
      const tmp = next[from];
      next[from] = next[to];
      next[to] = tmp;
      return next;
    });
    pendingSwap.current = { a: selectedId, b: id, oldPos };
    setSelectedId(null);
  };

  const handleSubmit = () => {
    const topItems = items.slice(0, maxSelections).map((opt) => opt.value);
    onAnswer(topItems);
  };

  return (
    <Container>
      {/* Bubble copy handles the main instruction; keeping inline area focused on the cards */}
      <Instructions />
      <OptionsContainer>
        {items.map((option, index) => (
          <OptionItem
            key={option.id}
            ref={setItemRef(option.id)}
            $isDragging={false}
            $isDragOver={false}
            $isTopChoice={index < maxSelections}
            $isSelected={selectedId === option.id}
            data-index={index}
            onClick={() => handleItemClick(option.id)}
            role="button"
            aria-pressed={selectedId === option.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(option.id);
              }
            }}
          >
            <DragHandle aria-hidden>↕︎</DragHandle>
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
  $isSelected?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  /* Top 3 always blue-tinted; when selected, grey it out */
  background-color: ${({ theme, $isTopChoice, $isSelected }) =>
    $isSelected
      ? theme.colors.border /* grey for selected state */
      : ($isTopChoice ? theme.colors.primary + '10' : theme.colors.surface)};
  border: 2px solid ${({ theme, $isDragOver, $isTopChoice }) =>
    $isDragOver ? theme.colors.primary : $isTopChoice ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $isDragging }) => ($isDragging ? 0.5 : 1)};
  transform: ${({ $isDragOver }) => ($isDragOver ? 'scale(1.02)' : 'scale(1)')};
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  box-shadow: ${({ $isSelected }) => ($isSelected ? '0 0 0 3px rgba(0,85,165,0.25)' : 'none')};
  
  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme, $isSelected }) =>
        $isSelected ? theme.colors.borderLight : 'inherit'};
      border-color: ${({ theme }) => theme.colors.primary}50;
    }
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
