export interface Message {
    id: number;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
  }