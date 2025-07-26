# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Projeto CRM para Vendedores

Este é um sistema CRM desenvolvido em Next.js com TypeScript, focado na gestão de vendas e propostas.

### Arquitetura e Tecnologias
- Next.js 14+ com App Router
- TypeScript
- Tailwind CSS
- Autenticação baseada em roles (Admin/Vendedor)
- Sistema de propostas com status tracking
- Agenda integrada com calendário brasileiro
- Dashboard com métricas de vendas

### Funcionalidades Principais

#### Sistema de Usuários
- **Administrador**: Visualiza todas as negociações, gerencia vendedores
- **Vendedor**: Gerencia suas próprias propostas, agenda e leads

#### Módulo de Propostas
- Status: Inicio → Negociando → Quase fechando → Concluído com sucesso / Encerrado por falta de interesse
- Campos: Provedor, WhatsApp, E-mail, Nome do responsável, Descrição
- Histórico de alterações de status e descrições

#### Sistema de Agenda
- Calendário brasileiro
- Agendamento de reuniões vinculadas a propostas
- Tipos: E-mail, Ligação, WhatsApp, Vídeo Chamada
- Notificações de compromissos

#### Gestão de Leads
- Campos: Provedor, Contato, Site, Estado (todos opcionais)
- Conversão de leads em propostas

#### Dashboard
- Vendedor: 80% do valor dos planos fechados
- Administrador: 100% do valor dos planos fechados

### Padrões de Desenvolvimento
- Use componentes reutilizáveis
- Implemente validação de dados
- Mantenha separação entre lógica de negócio e apresentação
- Use hooks customizados para lógica complexa
- Implemente tratamento de erros consistente
