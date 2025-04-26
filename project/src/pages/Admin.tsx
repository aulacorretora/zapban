import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../stores/userStore';
import { supabase } from '../lib/supabase';
import {
  Users,
  Activity,
  MessageSquare,
  Bot,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  Search
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeToday: number;
  totalInstances: number;
  connectedInstances: number;
  totalAutomations: number;
  activeAutomations: number;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan_id: string | null;
  plan?: {
    name: string;
  };
  instances_count?: number;
}

const Admin: React.FC = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeToday: 0,
    totalInstances: 0,
    connectedInstances: 0,
    totalAutomations: 0,
    activeAutomations: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || userData?.role !== 'admin') {
        toast.error('Acesso não autorizado');
        navigate('/dashboard');
        return;
      }
    };

    checkAdmin();
    fetchMetrics();
    fetchUsers();
  }, [user, navigate]);

  const fetchMetrics = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', today.toISOString());

      // Fetch instances metrics
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('status');

      const connectedInstances = instances?.filter(i => i.status === 'CONNECTED').length || 0;

      // Fetch automations metrics
      const { data: automations } = await supabase
        .from('automations')
        .select('status');

      const activeAutomations = automations?.filter(a => a.status === 'ACTIVE').length || 0;

      setMetrics({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalInstances: instances?.length || 0,
        connectedInstances,
        totalAutomations: automations?.length || 0,
        activeAutomations
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Erro ao carregar métricas');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          plan:plan_id (
            name
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;

      // Get instance counts for each user
      const usersWithCounts = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from('whatsapp_instances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            instances_count: count
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MetricCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-card p-6"
    >
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-800">{value}</h3>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo</h2>
        <p className="text-gray-600 mt-1">Gerencie usuários e monitore métricas do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={Users}
          title="Total de Usuários"
          value={metrics.totalUsers}
          color="bg-blue-500"
        />
        <MetricCard
          icon={Activity}
          title="Usuários Ativos Hoje"
          value={metrics.activeToday}
          color="bg-green-500"
        />
        <MetricCard
          icon={MessageSquare}
          title="Instâncias Conectadas"
          value={`${metrics.connectedInstances}/${metrics.totalInstances}`}
          color="bg-purple-500"
        />
        <MetricCard
          icon={Bot}
          title="Automações Ativas"
          value={`${metrics.activeAutomations}/${metrics.totalAutomations}`}
          color="bg-orange-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-800">Usuários do Sistema</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nome
                    <ChevronDown size={16} className="ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    <ChevronDown size={16} className="ml-1" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instâncias
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Data de Criação
                    <ChevronDown size={16} className="ml-1" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.plan?.name || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.instances_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleUserStatus(user.id, !!user.is_active)}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                          user.is_active
                            ? 'text-red-700 bg-red-100 hover:bg-red-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <XCircle size={16} className="mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-1" />
                            Ativar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;