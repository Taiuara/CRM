import { User, Proposal, Meeting, Lead } from '@/types';
import bcrypt from 'bcryptjs';

// PostgreSQL para produção (Neon Database)
let db: any = null;
try {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('✅ PostgreSQL conectado!');
  }
} catch {
  console.log('⚠️ PostgreSQL não disponível');
}

// Verificar se KV está disponível  
let kv: any = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv: vercelKv } = require('@vercel/kv');
    kv = vercelKv;
    console.log('✅ Vercel KV conectado!');
  }
} catch {
  console.log('⚠️ Vercel KV não disponível - usando memória local');
}

// Simulação de base de dados em memória (fallback)
let users: User[] = [];
let proposals: Proposal[] = [];
let meetings: Meeting[] = [];
let leads: Lead[] = [];

// Criar tabelas no PostgreSQL se necessário
async function createTables() {
  if (!db) return;
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20),
        email VARCHAR(255),
        responsible_name VARCHAR(255),
        description TEXT,
        status VARCHAR(50) NOT NULL,
        salesperson_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_date TIMESTAMP NOT NULL,
        type VARCHAR(50) NOT NULL,
        proposal_id INTEGER REFERENCES proposals(id),
        salesperson_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(255),
        contact VARCHAR(255),
        site VARCHAR(255),
        state VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas PostgreSQL criadas/verificadas');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Função para inicializar dados padrão
export async function initializeData() {
  if (db) {
    // Usar PostgreSQL (Neon)
    await createTables();
    
    const adminCheck = await db.query('SELECT * FROM users WHERE email = $1', ['admin@pingdesk.com']);
    if (adminCheck.rows.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Administrador', 'admin@pingdesk.com', adminPassword, 'admin']
      );
      console.log('👤 Admin criado no PostgreSQL');
    }
  } else if (kv) {
    // Usar Vercel KV
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
      console.log('👤 Admin criado no KV');
    }
  } else {
    // Fallback para memória local
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
  }
}

// Operações CRUD para Users
export const userService = {
  async findAll(): Promise<User[]> {
    await initializeData();
    
    if (db) {
      const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map((row: any) => ({
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } else if (kv) {
      const userEmails = await kv.smembers('users') || [];
      const users = await Promise.all(
        userEmails.map(async (email: string) => {
          return await kv.get(`user:${email}`);
        })
      );
      return users.filter(Boolean);
    } else {
      return users;
    }
  },

  async findById(id: string): Promise<User | undefined> {
    await initializeData();
    
    if (db) {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else if (kv) {
      const userEmails = await kv.smembers('users') || [];
      for (const email of userEmails) {
        const user = await kv.get(`user:${email}`);
        if (user && user.id === id) {
          return user;
        }
      }
      return undefined;
    } else {
      return users.find(user => user.id === id);
    }
  },

  async findByEmail(email: string): Promise<User | undefined> {
    await initializeData();
    
    if (db) {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else if (kv) {
      return await kv.get(`user:${email}`);
    } else {
      return users.find(user => user.email === email);
    }
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await initializeData();
    
    if (db) {
      const result = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [userData.name, userData.email, userData.password, userData.role]
      );
      
      const row = result.rows[0];
      console.log('👤 Usuário criado no PostgreSQL:', userData.email);
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else if (kv) {
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
      console.log('👤 Usuário criado no KV:', user.email);
      return user;
    } else {
      const user: User = {
        ...userData,
        id: (users.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(user);
      return user;
    }
  },

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    await initializeData();
    
    if (db) {
      const setClause = [];
      const values = [];
      let paramCount = 1;
      
      if (userData.name) {
        setClause.push(`name = $${paramCount}`);
        values.push(userData.name);
        paramCount++;
      }
      if (userData.email) {
        setClause.push(`email = $${paramCount}`);
        values.push(userData.email);
        paramCount++;
      }
      if (userData.password) {
        setClause.push(`password = $${paramCount}`);
        values.push(userData.password);
        paramCount++;
      }
      if (userData.role) {
        setClause.push(`role = $${paramCount}`);
        values.push(userData.role);
        paramCount++;
      }
      
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(parseInt(id));
      
      const result = await db.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else if (kv) {
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
      const index = users.findIndex(user => user.id === id);
      if (index === -1) return undefined;
      
      users[index] = {
        ...users[index],
        ...userData,
        updatedAt: new Date()
      };
      return users[index];
    }
  },

  async delete(id: string): Promise<boolean> {
    await initializeData();
    
    if (db) {
      const result = await db.query('DELETE FROM users WHERE id = $1', [parseInt(id)]);
      return result.rowCount > 0;
    } else if (kv) {
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
      const index = users.findIndex(user => user.id === id);
      if (index === -1) return false;
      
      users.splice(index, 1);
      return true;
    }
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
