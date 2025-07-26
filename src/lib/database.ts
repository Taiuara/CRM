import { User, Proposal, Meeting, Lead } from '@/types';
import bcrypt from 'bcryptjs';

// Simulação de base de dados em memória
let users: User[] = [];
let proposals: Proposal[] = [];
let meetings: Meeting[] = [];
let leads: Lead[] = [];

// Função para inicializar dados padrão
export async function initializeData() {
  // Criar usuário administrador inicial se não existir
  if (users.length === 0) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    users = [
      {
        id: '1',
        name: 'Administrador',
        email: 'admin@pingdesk.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
  
  if (proposals.length === 0) {
    proposals = [];
  }
  if (meetings.length === 0) {
    meetings = [];
  }
  if (leads.length === 0) {
    leads = [];
  }
}

// Operações CRUD para Users
export const userService = {
  async findAll(): Promise<User[]> {
    await initializeData();
    return users;
  },

  async findById(id: string): Promise<User | undefined> {
    await initializeData();
    return users.find(user => user.id === id);
  },

  async findByEmail(email: string): Promise<User | undefined> {
    await initializeData();
    return users.find(user => user.email === email);
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await initializeData();
    const user: User = {
      ...userData,
      id: (users.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(user);
    return user;
  },

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    await initializeData();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date()
    };
    return users[index];
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    users.splice(index, 1);
    return true;
  }
};

// Operações CRUD para Proposals
export const proposalService = {
  async findAll(): Promise<Proposal[]> {
    await initializeData();
    return proposals;
  },

  async findById(id: string): Promise<Proposal | undefined> {
    await initializeData();
    return proposals.find(proposal => proposal.id === id);
  },

  async findBySalesperson(salespersonId: string): Promise<Proposal[]> {
    await initializeData();
    return proposals.filter(proposal => proposal.salespersonId === salespersonId);
  },

  async create(proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'descriptionHistory'>): Promise<Proposal> {
    await initializeData();
    const proposal: Proposal = {
      ...proposalData,
      id: (proposals.length + 1).toString(),
      descriptionHistory: [
        {
          id: '1',
          description: proposalData.description,
          timestamp: new Date(),
          status: proposalData.status
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    proposals.push(proposal);
    return proposal;
  },

  async update(id: string, proposalData: Partial<Omit<Proposal, 'id' | 'createdAt'>>): Promise<Proposal | undefined> {
    await initializeData();
    const index = proposals.findIndex(proposal => proposal.id === id);
    if (index === -1) return undefined;

    const currentProposal = proposals[index];
    
    // Se a descrição ou status mudaram, adicionar ao histórico
    if (proposalData.description && proposalData.description !== currentProposal.description) {
      const newEntry = {
        id: (currentProposal.descriptionHistory.length + 1).toString(),
        description: proposalData.description,
        timestamp: new Date(),
        status: proposalData.status || currentProposal.status
      };
      proposalData.descriptionHistory = [...currentProposal.descriptionHistory, newEntry];
    }
    
    proposals[index] = {
      ...currentProposal,
      ...proposalData,
      updatedAt: new Date()
    };
    return proposals[index];
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    const index = proposals.findIndex(proposal => proposal.id === id);
    if (index === -1) return false;
    
    proposals.splice(index, 1);
    return true;
  }
};

// Operações CRUD para Meetings
export const meetingService = {
  async findAll(): Promise<Meeting[]> {
    await initializeData();
    return meetings;
  },

  async findBySalesperson(salespersonId: string): Promise<Meeting[]> {
    await initializeData();
    return meetings.filter(meeting => meeting.salespersonId === salespersonId);
  },

  async findByDate(date: Date, salespersonId?: string): Promise<Meeting[]> {
    await initializeData();
    const dateStr = date.toDateString();
    return meetings.filter(meeting => {
      const meetingDateStr = meeting.date.toDateString();
      return meetingDateStr === dateStr && 
        (!salespersonId || meeting.salespersonId === salespersonId);
    });
  },

  async create(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    await initializeData();
    const meeting: Meeting = {
      ...meetingData,
      id: (meetings.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    meetings.push(meeting);
    return meeting;
  },

  async update(id: string, meetingData: Partial<Omit<Meeting, 'id' | 'createdAt'>>): Promise<Meeting | undefined> {
    await initializeData();
    const index = meetings.findIndex(meeting => meeting.id === id);
    if (index === -1) return undefined;
    
    meetings[index] = {
      ...meetings[index],
      ...meetingData,
      updatedAt: new Date()
    };
    return meetings[index];
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    const index = meetings.findIndex(meeting => meeting.id === id);
    if (index === -1) return false;
    
    meetings.splice(index, 1);
    return true;
  }
};

// Operações CRUD para Leads
export const leadService = {
  async findAll(): Promise<Lead[]> {
    await initializeData();
    return leads;
  },

  async findById(id: string): Promise<Lead | undefined> {
    await initializeData();
    return leads.find(lead => lead.id === id);
  },

  async findBySalesperson(salespersonId: string): Promise<Lead[]> {
    await initializeData();
    return leads.filter(lead => lead.salespersonId === salespersonId);
  },

  async create(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    await initializeData();
    const lead: Lead = {
      ...leadData,
      id: (leads.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    leads.push(lead);
    return lead;
  },

  async update(id: string, leadData: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<Lead | undefined> {
    await initializeData();
    const index = leads.findIndex(lead => lead.id === id);
    if (index === -1) return undefined;
    
    leads[index] = {
      ...leads[index],
      ...leadData,
      updatedAt: new Date()
    };
    return leads[index];
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    const index = leads.findIndex(lead => lead.id === id);
    if (index === -1) return false;
    
    leads.splice(index, 1);
    return true;
  }
};
