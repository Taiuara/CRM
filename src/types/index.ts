export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'salesperson';
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  provider: string;
  whatsapp?: string;
  email?: string;
  responsibleName?: string;
  status: ProposalStatus;
  description: string;
  descriptionHistory: DescriptionEntry[];
  planClosed?: string;
  planValue?: number;
  salespersonId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DescriptionEntry {
  id: string;
  description: string;
  timestamp: Date;
  status: ProposalStatus;
}

export type ProposalStatus = 
  | 'inicio'
  | 'negociando'
  | 'quase-fechando'
  | 'concluido-sucesso'
  | 'encerrado-falta-interesse';

export interface Meeting {
  id: string;
  proposalId: string;
  date: Date;
  time: string;
  type: MeetingType;
  contact: string;
  notes?: string;
  salespersonId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MeetingType = 'email' | 'call' | 'whatsapp' | 'video';

export interface Lead {
  id: string;
  provider?: string;
  contact?: string;
  website?: string;
  state?: string;
  salespersonId: string;
  convertedToProposal?: boolean;
  proposalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalProposals: number;
  closedDeals: number;
  totalValue: number;
  commission: number;
  monthlyStats: {
    month: string;
    proposals: number;
    closedDeals: number;
    value: number;
  }[];
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  'inicio': 'Início',
  'negociando': 'Negociando',
  'quase-fechando': 'Quase Fechando',
  'concluido-sucesso': 'Concluído com Sucesso',
  'encerrado-falta-interesse': 'Encerrado por Falta de Interesse'
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  'email': 'E-mail',
  'call': 'Ligação',
  'whatsapp': 'WhatsApp',
  'video': 'Vídeo Chamada'
};
