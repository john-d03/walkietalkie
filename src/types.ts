export interface User {
  id: string;
  name: string;
  channel: number;
  isTalking: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  system?: boolean;
}