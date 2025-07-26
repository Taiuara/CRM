'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Proposal, PROPOSAL_STATUS_LABELS } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function ProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals');
        const data = await response.json();
        setProposals(data);
      } catch (error) {
        console.error('Erro ao carregar propostas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (proposal.responsibleName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;

    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProposals(proposals.filter(p => p.id !== id));
      } else {
        alert('Erro ao excluir proposta');
      }
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      alert('Erro ao excluir proposta');
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

  return (
    <Sidebar>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
            <p className="text-gray-600">
              {isAdmin ? 'Gerencie todas as propostas da equipe' : 'Gerencie suas propostas'}
            </p>
          </div>
          {!isAdmin && (
            <Link
              href="/proposals/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por provedor ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Propostas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredProposals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm || statusFilter ? 'Nenhuma proposta encontrada com os filtros aplicados.' : 'Nenhuma proposta encontrada.'}
              </p>
              {!isAdmin && !searchTerm && !statusFilter && (
                <Link
                  href="/proposals/new"
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar sua primeira proposta
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.provider}
                          </div>
                          {proposal.email && (
                            <div className="text-sm text-gray-500">
                              {proposal.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {proposal.responsibleName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                          {PROPOSAL_STATUS_LABELS[proposal.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {proposal.planValue 
                          ? `R$ ${proposal.planValue.toLocaleString('pt-BR')}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/proposals/${proposal.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {!isAdmin && (
                            <>
                              <Link
                                href={`/proposals/${proposal.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(proposal.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
