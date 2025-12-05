export enum AgentType {
  FRONT_DESK = 'FRONT_DESK',
  TRIAGE = 'TRIAGE'
}

export interface AgentConfig {
  id: AgentType;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  voiceName: string; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
}

export interface AudioVisualizerProps {
  isActive: boolean;
  volume: number;
}
