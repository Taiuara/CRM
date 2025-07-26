import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { proposalService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;

    // Buscar propostas baseado no role
    const proposals = isAdmin 
      ? await proposalService.findAll()
      : await proposalService.findBySalesperson(userId);

    // Calcular estatísticas
    const totalProposals = proposals.length;
    const closedDeals = proposals.filter(p => p.status === 'concluido-sucesso').length;
    const totalValue = proposals
      .filter(p => p.status === 'concluido-sucesso' && p.planValue)
      .reduce((sum, p) => sum + (p.planValue || 0), 0);
    
    // Comissão: 100% para admin, 80% para vendedor
    const commission = isAdmin ? totalValue : totalValue * 0.8;

    // Estatísticas mensais (últimos 6 meses)
    const monthlyStats = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const monthProposals = proposals.filter(p => {
        const proposalDate = new Date(p.createdAt);
        return proposalDate.getMonth() === date.getMonth() && 
               proposalDate.getFullYear() === date.getFullYear();
      });
      
      const monthClosedDeals = monthProposals.filter(p => p.status === 'concluido-sucesso');
      const monthValue = monthClosedDeals
        .filter(p => p.planValue)
        .reduce((sum, p) => sum + (p.planValue || 0), 0);
      
      monthlyStats.push({
        month: monthName,
        proposals: monthProposals.length,
        closedDeals: monthClosedDeals.length,
        value: isAdmin ? monthValue : monthValue * 0.8
      });
    }

    return NextResponse.json({
      totalProposals,
      closedDeals,
      totalValue,
      commission,
      monthlyStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
