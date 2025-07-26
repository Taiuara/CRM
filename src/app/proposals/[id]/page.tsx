'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Proposal, PROPOSAL_STATUS_LABELS } from '@/types';
import { ArrowLeft, Calendar, User, Mail, Phone, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ViewProposalPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
        } else if (response.status === 404) {
          router.push('/proposals');
        }
      } catch (error) {
        console.error('Erro ao carregar proposta:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProposal();
    }
  }, [params.id, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inicio': return 'bg-gray-100 text-gray-800';
      case 'negociando': return 'bg-blue-100 text-blue-800';
      case 'quase-fechando': return 'bg-yellow-100 text-yellow-800';
      case 'concluido-sucesso': return 'bg-green-100 text-green-800';
      case 'encerrado-falta-interesse': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (!proposal) {
    return (
      <Sidebar>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposta não encontrada</h1>
            <Link href="/proposals" className="text-blue-600 hover:text-blue-700">
              Voltar para Propostas
            </Link>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/proposals"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Propostas
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{proposal.provider}</h1>
              <p className="text-gray-600">Proposta #{proposal.id}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(proposal.status)}`}>
              {PROPOSAL_STATUS_LABELS[proposal.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Proposta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
                  <p className="text-gray-900">{proposal.provider}</p>
                </div>

                {proposal.responsibleName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{proposal.responsibleName}</p>
                    </div>
                  </div>
                )}

                {proposal.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`mailto:${proposal.email}`} className="text-blue-600 hover:text-blue-700">
                        {proposal.email}
                      </a>
                    </div>
                  </div>
                )}

                {proposal.whatsapp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <a 
                        href={`https://wa.me/55${proposal.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        {proposal.whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {proposal.planClosed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plano Fechado</label>
                    <p className="text-gray-900">{proposal.planClosed}</p>
                  </div>
                )}

                {proposal.planValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Plano</label>
                    <p className="text-green-600 font-semibold">
                      R$ {proposal.planValue.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Descrições */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atualizações</h2>
              
              <div className="space-y-4">
                {proposal.descriptionHistory.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                        {PROPOSAL_STATUS_LABELS[entry.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informações Laterais */}
          <div className="space-y-6">
            {/* Detalhes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última Atualização</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {new Date(proposal.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/proposals/${proposal.id}/edit`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Editar Proposta
                </Link>

                <Link
                  href="/agenda"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
