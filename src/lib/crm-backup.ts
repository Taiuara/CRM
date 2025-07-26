// Sistema de backup completo para todos os dados do CRM
export const crmBackup = {
  // Verificar se estamos no Vercel
  isVercel: () => typeof window !== 'undefined' && 
    (window.location.hostname.includes('.vercel.app') || window.location.hostname.includes('localhost')),
  
  // Salvar todos os dados no localStorage
  saveData: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`crm-${key}`, JSON.stringify(data));
      console.log(`✅ Backup salvo: ${key}`, data);
    }
  },
  
  // Carregar dados do localStorage
  loadData: (key: string): any[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`crm-${key}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  },
  
  // Interceptar todas as APIs e fazer backup automático
  interceptAPI: async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      
      if (response.ok && crmBackup.isVercel()) {
        const data = await response.clone().json();
        
        // Identificar tipo de dados pela URL e fazer backup
        if (url.includes('/api/users')) {
          if (Array.isArray(data)) {
            crmBackup.saveData('users', data);
          } else if (data.id && data.email) {
            const users = crmBackup.loadData('users');
            const index = users.findIndex((u: any) => u.id === data.id);
            if (index >= 0) {
              users[index] = data;
            } else {
              users.push(data);
            }
            crmBackup.saveData('users', users);
          }
        }
        
        else if (url.includes('/api/meetings')) {
          if (Array.isArray(data)) {
            crmBackup.saveData('meetings', data);
          } else if (data.id) {
            const meetings = crmBackup.loadData('meetings');
            const index = meetings.findIndex((m: any) => m.id === data.id);
            if (index >= 0) {
              meetings[index] = data;
            } else {
              meetings.push(data);
            }
            crmBackup.saveData('meetings', meetings);
          }
        }
        
        else if (url.includes('/api/proposals')) {
          if (Array.isArray(data)) {
            crmBackup.saveData('proposals', data);
          } else if (data.id) {
            const proposals = crmBackup.loadData('proposals');
            const index = proposals.findIndex((p: any) => p.id === data.id);
            if (index >= 0) {
              proposals[index] = data;
            } else {
              proposals.push(data);
            }
            crmBackup.saveData('proposals', proposals);
          }
        }
        
        else if (url.includes('/api/leads')) {
          if (Array.isArray(data)) {
            crmBackup.saveData('leads', data);
          } else if (data.id) {
            const leads = crmBackup.loadData('leads');
            const index = leads.findIndex((l: any) => l.id === data.id);
            if (index >= 0) {
              leads[index] = data;
            } else {
              leads.push(data);
            }
            crmBackup.saveData('leads', leads);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Erro na API:', error);
      
      // Se API falhar no Vercel, tentar usar backup
      if (crmBackup.isVercel() && options?.method === 'GET') {
        if (url.includes('/api/users')) {
          const backup = crmBackup.loadData('users');
          return new Response(JSON.stringify(backup), { status: 200 });
        }
        if (url.includes('/api/meetings')) {
          const backup = crmBackup.loadData('meetings');
          return new Response(JSON.stringify(backup), { status: 200 });
        }
        if (url.includes('/api/proposals')) {
          const backup = crmBackup.loadData('proposals');
          return new Response(JSON.stringify(backup), { status: 200 });
        }
        if (url.includes('/api/leads')) {
          const backup = crmBackup.loadData('leads');
          return new Response(JSON.stringify(backup), { status: 200 });
        }
      }
      
      throw error;
    }
  },
  
  // Função para deletar item do backup
  deleteFromBackup: (type: string, id: string) => {
    const data = crmBackup.loadData(type);
    const filtered = data.filter((item: any) => item.id !== id);
    crmBackup.saveData(type, filtered);
  },
  
  // Inicializar admin padrão se não existir
  initAdmin: () => {
    const users = crmBackup.loadData('users');
    if (users.length === 0) {
      const adminUser = {
        id: '1',
        name: 'Administrador',
        email: 'admin@pingdesk.com',
        // Senha hash pré-calculado para 'admin123'
        password: '$2a$10$vI7eKfP8DZKfB7tHwY8qE.8FjLlnZI9qS6JOb7Y3dNjVzGX0dP4B2',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      crmBackup.saveData('users', [adminUser]);
      console.log('👤 Admin criado no backup:', adminUser);
    }
  },
  
  // Mostrar status do backup
  showStatus: () => {
    console.log('📊 Status do Backup CRM:');
    console.log('👥 Usuários:', crmBackup.loadData('users').length);
    console.log('📅 Reuniões:', crmBackup.loadData('meetings').length);
    console.log('📋 Propostas:', crmBackup.loadData('proposals').length);
    console.log('🎯 Leads:', crmBackup.loadData('leads').length);
  }
};

// Auto-inicializar quando carregado
if (typeof window !== 'undefined') {
  crmBackup.initAdmin();
  
  // Substituir fetch global para interceptar automaticamente
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Se é uma API do nosso CRM, usar backup
    if (url.includes('/api/')) {
      return crmBackup.interceptAPI(url, init);
    }
    
    // Senão, usar fetch normal
    return originalFetch(input, init);
  };
  
  console.log('🔄 Sistema de backup CRM ativado!');
}
