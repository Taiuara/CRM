'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Lead } from '@/types';
import {
  Plus,
  Search,
  ExternalLink,
  ArrowRight,
  Trash2,
  Edit,
  Globe,
  MapPin,
  Phone
} from 'lucide-react';

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    contact: '',
    website: '',
    state: ''
  });

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        const data = await response.json();
        setLeads(data);
      } catch (error) {
        console.error('Erro ao carregar leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.provider?.toLowerCase().includes(searchLower)) ||
      (lead.contact?.toLowerCase().includes(searchLower)) ||
      (lead.website?.toLowerCase().includes(searchLower)) ||
      (lead.state?.toLowerCase().includes(searchLower))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newLead = await response.json();
        setLeads([...leads, newLead]);
        setFormData({ provider: '', contact: '', website: '', state: '' });
        setShowNewLeadModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar lead');
      }
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      alert('Erro ao criar lead');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConvertToProposal = async (leadId: string) => {
    if (!confirm('Deseja converter este lead em uma proposta?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Atualizar a lista de leads
        setLeads(leads.map(lead => 
          lead.id === leadId 
            ? { ...lead, convertedToProposal: true, proposalId: data.proposalId }
            : lead
        ));
        alert('Lead convertido em proposta com sucesso!');
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao converter lead');
      }
    } catch (error) {
      console.error('Erro ao converter lead:', error);
      alert('Erro ao converter lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLeads(leads.filter(l => l.id !== id));
      } else {
        alert('Erro ao excluir lead');
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      alert('Erro ao excluir lead');
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
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">
              {isAdmin ? 'Visualize todos os leads da equipe' : 'Gerencie seus leads e converta em propostas'}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por provedor, contato, site ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum lead encontrado com os filtros aplicados.' : 'Nenhum lead encontrado.'}
              </p>
              {!isAdmin && !searchTerm && (
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar seu primeiro lead
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {lead.provider || 'Provedor não informado'}
                        </h3>
                        {lead.convertedToProposal && (
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            Convertido
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {lead.contact && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{lead.contact}</span>
                          </div>
                        )}
                        
                        {lead.website && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-gray-400" />
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              {lead.website}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {lead.state && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{lead.state}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Criado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {!isAdmin && (
                      <div className="flex items-center space-x-2 ml-4">
                        {!lead.convertedToProposal ? (
                          <button
                            onClick={() => handleConvertToProposal(lead.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Converter
                          </button>
                        ) : (
                          <a
                            href={`/proposals/${lead.proposalId}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                          >
                            Ver Proposta
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal para Novo Lead */}
        {showNewLeadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Novo Lead</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                    Provedor
                  </label>
                  <input
                    type="text"
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa/provedor"
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                    Contato
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Telefone ou e-mail"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Site
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="www.exemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SP, RJ, MG..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewLeadModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Criar Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
