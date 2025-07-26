import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { meetingService, proposalService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;

    // Buscar reuniões dos próximos 7 dias
    const meetings = isAdmin 
      ? await meetingService.findAll()
      : await meetingService.findBySalesperson(userId);

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingMeetings = [];
    
    for (const meeting of meetings) {
      // Usar apenas a data (sem horário) para comparação mais simples
      const meetingDateStr = new Date(meeting.date).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const nextWeekStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (meetingDateStr >= todayStr && meetingDateStr <= nextWeekStr) {
        // Buscar informações da proposta associada
        const proposal = await proposalService.findById(meeting.proposalId);
        
        upcomingMeetings.push({
          id: meeting.id,
          date: meeting.date,
          time: meeting.time,
          type: meeting.type,
          contact: meeting.contact,
          notes: meeting.notes,
          provider: proposal?.provider || 'Provedor não encontrado',
          proposalId: meeting.proposalId
        });
      }
    }

    // Ordenar por data/hora
    upcomingMeetings.sort((a, b) => {
      const dateA = new Date(a.date).toISOString().split('T')[0];
      const dateB = new Date(b.date).toISOString().split('T')[0];
      
      if (dateA === dateB) {
        return a.time.localeCompare(b.time);
      }
      return dateA.localeCompare(dateB);
    });

    return NextResponse.json(upcomingMeetings.slice(0, 5)); // Primeiras 5 reuniões
  } catch (error) {
    console.error('Erro ao buscar reuniões próximas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
