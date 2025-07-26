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

    const proposals = isAdmin 
      ? await proposalService.findAll()
      : await proposalService.findBySalesperson(userId);

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'salesperson') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, whatsapp, email, responsibleName, status, description } = body;

    if (!provider || !status || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: provider, status, description' },
        { status: 400 }
      );
    }

    const proposal = await proposalService.create({
      provider,
      whatsapp,
      email,
      responsibleName,
      status,
      description,
      salespersonId: session.user.id
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
