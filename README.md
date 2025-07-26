# PingDesk CRM - Sistema de Gestão de Vendas

Sistema CRM completo desenvolvido em Next.js para gestão de propostas, agenda e leads de vendedores.

## 🚀 Funcionalidades

### Sistema de Usuários
- **Administrador**: 
  - Visualiza todas as negociações (somente leitura)
  - Gerencia vendedores (criar, editar, excluir)
  - Acesso a 100% do valor dos planos fechados
- **Vendedor**: 
  - Gerencia suas próprias propostas
  - Sistema de agenda integrado
  - Gestão de leads com conversão
  - Acesso a 80% do valor dos planos fechados

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15 com App Router
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **Autenticação**: NextAuth.js
- **Ícones**: Lucide React
- **Hash de Senhas**: bcryptjs

## 📋 Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Git

## 🔧 Instalação e Configuração

1. **Clone o repositório**:
```bash
git clone https://github.com/Taiuara/crm.git
cd crm
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=http://localhost:3000
```

4. **Execute o projeto em desenvolvimento**:
```bash
npm run dev
```

5. **Acesse o sistema**:
Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 🌐 Deploy no Vercel

Este projeto está otimizado para deploy no Vercel:

1. **Fork ou clone este repositório**
2. **Conecte ao Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório do GitHub
3. **Configure as variáveis de ambiente**:
   - `NEXTAUTH_SECRET`: Gere uma chave secreta segura
   - `NEXTAUTH_URL`: URL do seu domínio (ex: `https://seu-crm.vercel.app`)

## 📱 Como Usar

### Primeiro Acesso
1. Acesse a página de login
2. Cadastre o primeiro usuário (será automaticamente admin)
3. Configure vendedores através do painel administrativo

### Fluxo de Trabalho
1. **Leads** → Converta em **Propostas**
2. **Propostas** → Gerencie status: Início → Negociando → Quase fechando → Concluído/Encerrado
3. **Agenda** → Agende reuniões vinculadas às propostas
4. **Dashboard** → Acompanhe métricas e performance

### Módulo de Propostas
- **Campos**: Provedor, WhatsApp, E-mail, Nome do responsável, Status, Descrição
- **Status**: Início → Negociando → Quase fechando → Concluído com sucesso / Encerrado por falta de interesse
- **Histórico**: Registro de alterações de status e descrições
- **Valor**: Plano fechado e valor (obrigatório quando status = "Concluído com Sucesso")

### Sistema de Agenda
- Calendário brasileiro integrado
- Agendamento de reuniões vinculadas a propostas
- **Tipos de contato**: E-mail, Ligação, WhatsApp, Vídeo Chamada
- Campo de anotações para reuniões

### Gestão de Leads
- **Campos**: Provedor, Contato, Site, Estado (todos opcionais)
- Conversão de leads em propostas
- Vinculação automática ao vendedor

## 🏗️ Arquitetura

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard
│   ├── proposals/         # Gestão de propostas
│   ├── agenda/            # Sistema de agenda
│   ├── leads/             # Gestão de leads
│   ├── users/             # Gestão de usuários
│   └── login/             # Autenticação
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
├── types/                 # Definições TypeScript
└── styles/               # Estilos globais
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## � Licença

© 2025 PingDesk. Todos os direitos reservados.

## 📞 Contato

PingDesk - [contato@pingdesk.com](mailto:contato@pingdesk.com)

Link do Projeto: [https://github.com/Taiuara/crm](https://github.com/Taiuara/crm)
