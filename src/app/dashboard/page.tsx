'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardStats, Meeting } from '@/types';
import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Calendar
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    const fetchUpcomingMeetings = async () => {
      try {
        const response = await fetch('/api/meetings/upcoming');
        const data = await response.json();
        setUpcomingMeetings(data);
      } catch (error) {
        console.error('Erro ao carregar reuniões:', error);
      }
    };

    fetchStats();
    fetchUpcomingMeetings();
  }, []);

  const isAdmin = session?.user?.role === 'admin';

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <Sidebar>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Visão geral de todas as vendas e performance da equipe'
              : 'Acompanhe suas vendas e performance'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Propostas"
            value={stats?.totalProposals || 0}
            icon={FileText}
            color="text-blue-600"
          />
          <StatCard
            title="Vendas Fechadas"
            value={stats?.closedDeals || 0}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            title="Faturamento Total"
            value={`R$ ${stats?.totalValue?.toLocaleString('pt-BR') || '0'}`}
            icon={DollarSign}
            color="text-purple-600"
            subtitle={isAdmin ? "100% do valor" : "80% do valor (comissão)"}
          />
          <StatCard
            title={isAdmin ? "Comissão Total" : "Minha Comissão"}
            value={`R$ ${stats?.commission?.toLocaleString('pt-BR') || '0'}`}
            icon={TrendingUp}
            color="text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximas Reuniões */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Próximas Reuniões</h2>
            </div>
            
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{meeting.contact}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(meeting.date).toLocaleDateString('pt-BR')} às {meeting.time}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{meeting.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma reunião agendada para os próximos dias
              </p>
            )}
          </div>

          {/* Performance Mensal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Performance Mensal</h2>
            </div>
            
            {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
              <div className="space-y-3">
                {stats.monthlyStats.slice(-3).map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{month.month}</p>
                      <p className="text-sm text-gray-600">
                        {month.closedDeals} vendas de {month.proposals} propostas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        R$ {month.value.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round((month.closedDeals / month.proposals) * 100)}% conversão
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Dados de performance não disponíveis
              </p>
            )}
          </div>
        </div>

        {/* Notificações/Alertas */}
        {upcomingMeetings.some(m => {
          const meetingTime = new Date(`${m.date}T${m.time}`);
          const now = new Date();
          const timeDiff = meetingTime.getTime() - now.getTime();
          const hoursUntilMeeting = timeDiff / (1000 * 60 * 60);
          return hoursUntilMeeting <= 2 && hoursUntilMeeting > 0;
        }) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Reunião se aproximando!
                </h3>
                <p className="text-sm text-yellow-700">
                  Você tem uma reunião nas próximas 2 horas. Verifique sua agenda.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
