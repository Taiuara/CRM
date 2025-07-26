import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { meetingService, proposalService } from '@/lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;

    const meetings = isAdmin 
      ? await meetingService.findAll()
      : await meetingService.findBySalesperson(userId);

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { proposalId, date, time, type, contact, notes } = body;

    if (!proposalId || !date || !time || !type || !contact) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: proposalId, date, time, type, contact' },
        { status: 400 }
      );
    }

    // Para administradores, usar o ID do vendedor da proposta
    // Para vendedores, usar o próprio ID
    let salespersonId = session.user.id;
    
    if (session.user.role === 'admin') {
      // Buscar a proposta para pegar o salespersonId
      const proposal = await proposalService.findById(proposalId);
      if (!proposal) {
        return NextResponse.json(
          { error: 'Proposta não encontrada' },
          { status: 404 }
        );
      }
      salespersonId = proposal.salespersonId;
    }

    const meeting = await meetingService.create({
      proposalId,
      date: new Date(date + 'T00:00:00'),
      time,
      type,
      contact,
      notes,
      salespersonId
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
