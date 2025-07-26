// Utilidade para persistência de usuários que funciona em desenvolvimento e produção
export const userPersistence = {
  // Verificar se estamos em produção (Vercel)
  isProduction: () => typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app'),
  
  // Salvar usuários no localStorage (fallback para Vercel)
  saveUsers: (users: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm-users-backup', JSON.stringify(users));
    }
  },
  
  // Carregar usuários do localStorage
  loadUsers: (): any[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm-users-backup');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  },
  
  // Interceptar resposta da API para fazer backup
  interceptUserAPI: async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    
    if (response.ok && userPersistence.isProduction()) {
      const data = await response.clone().json();
      
      // Se é uma lista de usuários, fazer backup
      if (Array.isArray(data)) {
        userPersistence.saveUsers(data);
      }
      // Se é um usuário criado/atualizado, atualizar backup
      else if (data.id && data.email) {
        const users = userPersistence.loadUsers();
        const index = users.findIndex(u => u.id === data.id);
        if (index >= 0) {
          users[index] = data;
        } else {
          users.push(data);
        }
        userPersistence.saveUsers(users);
      }
    }
    
    return response;
  },
  
  // Fallback para quando API falha no Vercel
  fallbackUsers: () => {
    if (userPersistence.isProduction()) {
      return userPersistence.loadUsers();
    }
    return [];
  }
};
