import { User, Proposal, Meeting, Lead } from '@/types';
import bcrypt from 'bcryptjs';

// Para desenvolvimento local - dados em memória
let localUsers: User[] = [];
const localProposals: Proposal[] = [];
const localMeetings: Meeting[] = [];
const localLeads: Lead[] = [];

// Vercel KV para produção (se disponível)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;
try {
  if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    kv = require('@vercel/kv').kv;
  }
} catch {
  console.log('Vercel KV não disponível, usando memória local');
}

// Função para decidir se usar KV ou memória local
const isProduction = () => process.env.NODE_ENV === 'production' && kv;

// Função para inicializar dados padrão
export async function initializeData() {
  if (isProduction()) {
    // Verificar se já existe usuário admin no KV
    const adminExists = await kv.get('user:admin@pingdesk.com');
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = {
        id: '1',
        name: 'Administrador',
        email: 'admin@pingdesk.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await kv.set('user:admin@pingdesk.com', adminUser);
      await kv.sadd('users', 'admin@pingdesk.com');
    }
  } else {
    // Desenvolvimento local - usar memória
    if (localUsers.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      localUsers = [
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
  }
}

// Operações CRUD para Users
export const userService = {
  async findAll(): Promise<User[]> {
    await initializeData();
    
    if (isProduction()) {
      const userEmails = await kv.smembers('users') || [];
      const users = await Promise.all(
        userEmails.map(async (email: string) => {
          return await kv.get(`user:${email}`);
        })
      );
      return users.filter(Boolean);
    } else {
      return localUsers;
    }
  },

  async findById(id: string): Promise<User | undefined> {
    await initializeData();
    
    if (isProduction()) {
      const userEmails = await kv.smembers('users') || [];
      for (const email of userEmails) {
        const user = await kv.get(`user:${email}`);
        if (user && user.id === id) {
          return user;
        }
      }
      return undefined;
    } else {
      return localUsers.find(user => user.id === id);
    }
  },

  async findByEmail(email: string): Promise<User | undefined> {
    await initializeData();
    
    if (isProduction()) {
      return await kv.get(`user:${email}`);
    } else {
      return localUsers.find(user => user.email === email);
    }
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await initializeData();
    
    if (isProduction()) {
      const userEmails = await kv.smembers('users') || [];
      const newId = (userEmails.length + 1).toString();
      
      const user: User = {
        ...userData,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await kv.set(`user:${userData.email}`, user);
      await kv.sadd('users', userData.email);
      return user;
    } else {
      const user: User = {
        ...userData,
        id: (localUsers.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      localUsers.push(user);
      return user;
    }
  },

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    await initializeData();
    
    if (isProduction()) {
      const userEmails = await kv.smembers('users') || [];
      for (const email of userEmails) {
        const user = await kv.get(`user:${email}`);
        if (user && user.id === id) {
          const updatedUser = {
            ...user,
            ...userData,
            updatedAt: new Date()
          };
          
          // Se o email mudou, precisamos atualizar as chaves
          if (userData.email && userData.email !== user.email) {
            await kv.del(`user:${user.email}`);
            await kv.srem('users', user.email);
            await kv.set(`user:${userData.email}`, updatedUser);
            await kv.sadd('users', userData.email);
          } else {
            await kv.set(`user:${email}`, updatedUser);
          }
          
          return updatedUser;
        }
      }
      return undefined;
    } else {
      const index = localUsers.findIndex(user => user.id === id);
      if (index === -1) return undefined;
      
      localUsers[index] = {
        ...localUsers[index],
        ...userData,
        updatedAt: new Date()
      };
      return localUsers[index];
    }
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    
    if (isProduction()) {
      const userEmails = await kv.smembers('users') || [];
      for (const email of userEmails) {
        const user = await kv.get(`user:${email}`);
        if (user && user.id === id) {
          await kv.del(`user:${email}`);
          await kv.srem('users', email);
          return true;
        }
      }
      return false;
    } else {
      const index = localUsers.findIndex(user => user.id === id);
      if (index === -1) return false;
      
      localUsers.splice(index, 1);
      return true;
    }
  }
};

// Continuar com outras operações CRUD (proposals, meetings, leads)
// Por simplicidade, mantendo apenas userService por enquanto
export const proposalService = {
  async findAll(): Promise<Proposal[]> {
    return localProposals;
  },
  
  async findById(id: string): Promise<Proposal | undefined> {
    return localProposals.find(p => p.id === id);
  },
  
  async findBySalesperson(salespersonId: string): Promise<Proposal[]> {
    return localProposals.filter(p => p.salespersonId === salespersonId);
  },
  
  async create(proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'descriptionHistory'>): Promise<Proposal> {
    const proposal: Proposal = {
      ...proposalData,
      id: (localProposals.length + 1).toString(),
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
    localProposals.push(proposal);
    return proposal;
  },
  
  async update(id: string, proposalData: Partial<Omit<Proposal, 'id' | 'createdAt'>>): Promise<Proposal | undefined> {
    const index = localProposals.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    const oldProposal = localProposals[index];
    const updatedProposal = {
      ...oldProposal,
      ...proposalData,
      updatedAt: new Date()
    };
    
    // Se a descrição mudou, adicionar ao histórico
    if (proposalData.description && proposalData.description !== oldProposal.description) {
      const newHistoryEntry = {
        id: (oldProposal.descriptionHistory.length + 1).toString(),
        description: proposalData.description,
        timestamp: new Date(),
        status: proposalData.status || oldProposal.status
      };
      updatedProposal.descriptionHistory = [...oldProposal.descriptionHistory, newHistoryEntry];
    }
    
    localProposals[index] = updatedProposal;
    return updatedProposal;
  },
  
  async delete(id: string): Promise<boolean> {
    const index = localProposals.findIndex(p => p.id === id);
    if (index === -1) return false;
    localProposals.splice(index, 1);
    return true;
  }
};

export const meetingService = {
  async findAll(): Promise<Meeting[]> {
    return localMeetings;
  },
  
  async findById(id: string): Promise<Meeting | undefined> {
    return localMeetings.find(m => m.id === id);
  },
  
  async findBySalesperson(salespersonId: string): Promise<Meeting[]> {
    return localMeetings.filter(m => m.salespersonId === salespersonId);
  },
  
  async create(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    const meeting: Meeting = {
      ...meetingData,
      id: (localMeetings.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    localMeetings.push(meeting);
    return meeting;
  },
  
  async update(id: string, meetingData: Partial<Omit<Meeting, 'id' | 'createdAt'>>): Promise<Meeting | undefined> {
    const index = localMeetings.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    localMeetings[index] = {
      ...localMeetings[index],
      ...meetingData,
      updatedAt: new Date()
    };
    return localMeetings[index];
  },
  
  async delete(id: string): Promise<boolean> {
    const index = localMeetings.findIndex(m => m.id === id);
    if (index === -1) return false;
    localMeetings.splice(index, 1);
    return true;
  }
};

export const leadService = {
  async findAll(): Promise<Lead[]> {
    return localLeads;
  },
  
  async findById(id: string): Promise<Lead | undefined> {
    return localLeads.find(l => l.id === id);
  },
  
  async create(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const lead: Lead = {
      ...leadData,
      id: (localLeads.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    localLeads.push(lead);
    return lead;
  },
  
  async update(id: string, leadData: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<Lead | undefined> {
    const index = localLeads.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    
    localLeads[index] = {
      ...localLeads[index],
      ...leadData,
      updatedAt: new Date()
    };
    return localLeads[index];
  },
  
  async delete(id: string): Promise<boolean> {
    const index = localLeads.findIndex(l => l.id === id);
    if (index === -1) return false;
    localLeads.splice(index, 1);
    return true;
  }
};
