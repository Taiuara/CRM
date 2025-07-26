import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { meetingService } from '@/lib/database';

interface Params {
  id: string;
}

export async function PUT(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params;
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

    const meeting = await meetingService.update(id, {
      proposalId,
      date: new Date(date + 'T00:00:00'),
      time,
      type,
      contact,
      notes,
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const success = await meetingService.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir reunião:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
