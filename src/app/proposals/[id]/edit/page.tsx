'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Proposal, PROPOSAL_STATUS_LABELS, ProposalStatus } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    whatsapp: '',
    email: '',
    responsibleName: '',
    status: 'inicio' as ProposalStatus,
    description: '',
    planClosed: '',
    planValue: ''
  });

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
          setFormData({
            provider: data.provider,
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            responsibleName: data.responsibleName || '',
            status: data.status,
            description: data.description,
            planClosed: data.planClosed || '',
            planValue: data.planValue ? data.planValue.toString() : ''
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validar se plano fechado e valor são obrigatórios quando status = concluido-sucesso
      if (formData.status === 'concluido-sucesso') {
        if (!formData.planClosed || !formData.planValue) {
          alert('Plano fechado e valor são obrigatórios quando o status é "Concluído com Sucesso"');
          setSaving(false);
          return;
        }
      }

      const updateData = {
        ...formData,
        planValue: formData.planValue ? parseFloat(formData.planValue.replace(/[^\d,]/g, '').replace(',', '.')) : null
      };

      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push(`/proposals/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao atualizar proposta');
      }
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error);
      alert('Erro ao atualizar proposta');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
            href={`/proposals/${params.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Visualizar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Editar Proposta</h1>
          <p className="text-gray-600">{proposal.provider}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provedor */}
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                  Provedor *
                </label>
                <input
                  type="text"
                  id="provider"
                  name="provider"
                  required
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Nome do Responsável */}
              <div>
                <label htmlFor="responsibleName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  id="responsibleName"
                  name="responsibleName"
                  value={formData.responsibleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(PROPOSAL_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Campos obrigatórios quando status = concluido-sucesso */}
              {formData.status === 'concluido-sucesso' && (
                <>
                  <div>
                    <label htmlFor="planClosed" className="block text-sm font-medium text-gray-700 mb-2">
                      Plano Fechado *
                    </label>
                    <input
                      type="text"
                      id="planClosed"
                      name="planClosed"
                      required={formData.status === 'concluido-sucesso'}
                      value={formData.planClosed}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do plano fechado"
                    />
                  </div>

                  <div>
                    <label htmlFor="planValue" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Plano (R$) *
                    </label>
                    <input
                      type="number"
                      id="planValue"
                      name="planValue"
                      required={formData.status === 'concluido-sucesso'}
                      value={formData.planValue}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Nova Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Descrição *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adicione uma nova descrição/atualização..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Esta descrição será adicionada ao histórico da proposta
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <Link
                href={`/proposals/${params.id}`}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Sidebar>
  );
}
