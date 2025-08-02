import React, { useState } from 'react';
import styled from 'styled-components';
import { Question } from '../../../types/survey';

const ContactForm: React.FC<{ question: Question; onAnswer: (answer: any) => void; disabled?: boolean }> = ({ 
  question, onAnswer, disabled 
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswer(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {question.fields?.map((field) => (
        <Field key={field.id}>
          <Label>{field.label}</Label>
          <Input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.required}
          />
        </Field>
      ))}
      <SubmitButton type="submit" disabled={disabled}>Submit</SubmitButton>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Field = styled.div``;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export default ContactForm;