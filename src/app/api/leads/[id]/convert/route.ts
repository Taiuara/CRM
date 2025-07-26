import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leadService, proposalService } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'salesperson') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await leadService.findById(id);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    if (lead.salespersonId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (lead.convertedToProposal) {
      return NextResponse.json({ error: 'Lead já foi convertido em proposta' }, { status: 400 });
    }

    // Criar proposta baseada no lead
    const proposal = await proposalService.create({
      provider: lead.provider || 'Provedor do Lead',
      whatsapp: lead.contact || '',
      email: '',
      responsibleName: '',
      status: 'inicio',
      description: `Proposta criada a partir do lead. Site: ${lead.website || 'N/A'}, Estado: ${lead.state || 'N/A'}`,
      salespersonId: session.user.id
    });

    // Atualizar o lead como convertido
    await leadService.update(id, {
      convertedToProposal: true,
      proposalId: proposal.id
    });

    return NextResponse.json({ 
      message: 'Lead convertido em proposta com sucesso',
      proposalId: proposal.id 
    });
  } catch (error) {
    console.error('Erro ao converter lead:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
