'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import { Meeting, Proposal, MEETING_TYPE_LABELS, MeetingType } from '@/types';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Mail,
  Phone,
  Video,
  MessageCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function AgendaPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          fetch('/api/meetings'),
          fetch('/api/proposals')
        ];
        
        // Se for admin, buscar também os usuários
        if (session?.user.role === 'admin') {
          requests.push(fetch('/api/users'));
        }
        
        const responses = await Promise.all(requests);
        const meetingsData = await responses[0].json();
        const proposalsData = await responses[1].json();
        
        setMeetings(meetingsData);
        setProposals(proposalsData);
        
        if (session?.user.role === 'admin' && responses[2]) {
          const usersData = await responses[2].json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Completar com dias do próximo mês
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  const getIconForMeetingType = (type: MeetingType) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'video': return Video;
      case 'whatsapp': return MessageCircle;
      default: return User;
    }
  };

  const getColorForMeetingType = (type: MeetingType) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-100';
      case 'call': return 'text-green-600 bg-green-100';
      case 'video': return 'text-purple-600 bg-purple-100';
      case 'whatsapp': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) return;
    
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeetings(meetings.filter(m => m.id !== meetingId));
      } else {
        alert('Erro ao excluir reunião');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir reunião');
    }
  };

  const updateMeeting = async (meetingId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedMeeting = await response.json();
        setMeetings(meetings.map(m => m.id === meetingId ? updatedMeeting : m));
        setEditingMeeting(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao atualizar reunião');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar reunião');
    }
  };

  const MeetingModal = () => {
    const isEditing = !!editingMeeting;
    const [formData, setFormData] = useState({
      proposalId: editingMeeting?.proposalId || '',
      type: (editingMeeting?.type || 'email') as MeetingType,
      date: editingMeeting ? new Date(editingMeeting.date).toISOString().split('T')[0] : 
            (selectedDate ? selectedDate.toISOString().split('T')[0] : ''),
      time: editingMeeting?.time || '',
      contact: editingMeeting?.contact || '',
      notes: editingMeeting?.notes || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      
      try {
        if (isEditing) {
          await updateMeeting(editingMeeting.id, formData);
        } else {
          const response = await fetch('/api/meetings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            const newMeeting = await response.json();
            setMeetings([...meetings, newMeeting]);
            setShowNewMeetingModal(false);
            setFormData({
              proposalId: '',
              type: 'email',
              date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
              time: '',
              contact: '',
              notes: ''
            });
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Erro ao criar reunião');
          }
        }
      } catch (error) {
        console.error('Erro:', error);
        setError('Erro de conexão. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleClose = () => {
      if (isEditing) {
        setEditingMeeting(null);
      } else {
        setShowNewMeetingModal(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditing ? 'Editar Reunião' : 'Agendar Nova Reunião'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Proposta
              </label>
              <select
                value={formData.proposalId}
                onChange={(e) => setFormData({...formData, proposalId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                <option value="">Selecione uma proposta</option>
                {proposals.map((proposal) => (
                  <option key={proposal.id} value={proposal.id}>
                    {proposal.provider}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Tipo de Reunião
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as MeetingType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="email">E-mail</option>
                <option value="call">Ligação</option>
                <option value="video">Vídeo Chamada</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Horário
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Contato
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                placeholder="E-mail, telefone ou WhatsApp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Observações sobre a reunião..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Salvando...' : 'Agendando...'}
                  </>
                ) : (
                  isEditing ? 'Salvar' : 'Agendar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600">Gerencie suas reuniões e compromissos</p>
          </div>
          <button
            onClick={() => setShowNewMeetingModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agendar Reunião
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header do Calendário */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dias do Mês */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayMeetings = getMeetingsForDate(day.date);
                  const isCurrentDay = isToday(day.date);
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50
                        ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                      `}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                        ${isCurrentDay ? 'text-blue-600' : ''}
                      `}>
                        {day.date.getDate()}
                        {isCurrentDay && (
                          <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayMeetings.slice(0, 3).map((meeting) => {
                          const proposal = proposals.find(p => p.id === meeting.proposalId);
                          const Icon = getIconForMeetingType(meeting.type);
                          
                          return (
                            <div
                              key={meeting.id}
                              className={`
                                text-xs p-1 rounded truncate flex items-center
                                ${getColorForMeetingType(meeting.type)}
                              `}
                            >
                              <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {meeting.time} - {proposal?.provider || 'Provedor'}
                              </span>
                            </div>
                          );
                        })}
                        {dayMeetings.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayMeetings.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalhes do Dia Selecionado */}
          <div className="space-y-6">
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </h3>
                
                <button
                  onClick={() => setShowNewMeetingModal(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </button>

                <div className="space-y-3">
                  {getMeetingsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhuma reunião agendada
                    </p>
                  ) : (
                    getMeetingsForDate(selectedDate).map((meeting) => {
                      const proposal = proposals.find(p => p.id === meeting.proposalId);
                      const Icon = getIconForMeetingType(meeting.type);
                      
                      return (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="font-medium text-gray-900">
                                {proposal?.provider || 'Provedor'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{meeting.time}</span>
                              <button
                                onClick={() => setEditingMeeting(meeting)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar reunião"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteMeeting(meeting.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Excluir reunião"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {MEETING_TYPE_LABELS[meeting.type]} • {meeting.contact}
                          </p>
                          
                          {meeting.notes && (
                            <p className="text-sm text-gray-500 mb-2">{meeting.notes}</p>
                          )}
                          
                          {session?.user.role === 'admin' && (
                            <p className="text-xs text-blue-600">
                              Vendedor: {users.find(u => u.id === meeting.salespersonId)?.name || 'N/A'}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Próximas Reuniões */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas Reuniões</h3>
              
              <div className="space-y-3">
                {meetings
                  .filter(meeting => {
                    // Simplificar a comparação de datas
                    const meetingDate = new Date(meeting.date).toISOString().split('T')[0];
                    const today = new Date().toISOString().split('T')[0];
                    return meetingDate >= today;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA.getTime() === dateB.getTime()) {
                      return a.time.localeCompare(b.time);
                    }
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, 5)
                  .map((meeting) => {
                    const proposal = proposals.find(p => p.id === meeting.proposalId);
                    const Icon = getIconForMeetingType(meeting.type);
                    
                    return (
                      <div key={meeting.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {proposal?.provider || 'Provedor'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(meeting.date).toLocaleDateString('pt-BR')} às {meeting.time}
                              {session?.user.role === 'admin' && (
                                <span className="text-blue-600 ml-2">
                                  • {users.find(u => u.id === meeting.salespersonId)?.name || 'N/A'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {meetings.filter(meeting => {
                  const meetingDate = new Date(meeting.date).toISOString().split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  return meetingDate >= today;
                }).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma reunião agendada
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para Nova Reunião */}
        {(showNewMeetingModal || editingMeeting) && <MeetingModal />}
      </div>
    </Sidebar>
  );
}
