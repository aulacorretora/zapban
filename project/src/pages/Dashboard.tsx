import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../stores/userStore';
import { getMessageAnalytics } from '../lib/supabase';
import { BarChart3, Users, MessageSquare, Calendar, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Analytics {
  date: string;
  unique_contacts: number;
  inbound_messages: number;
  outbound_messages: number;
  total_messages: number;
}

interface Contact {
  name: string;
  number: string;
  lastMessage: string;
  time: string;
  status: 'online' | 'offline' | 'typing';
}

const Dashboard: React.FC = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Mock active contacts for demonstration
  const activeContacts: Contact[] = [
    { name: 'Maria Silva', number: '+55 11 98765-4321', lastMessage: 'Obrigada pelo atendimento!', time: '2 min atrás', status: 'online' },
    { name: 'João Santos', number: '+55 11 91234-5678', lastMessage: 'Quando chega meu pedido?', time: '5 min atrás', status: 'typing' },
    { name: 'Ana Oliveira', number: '+55 11 97654-3210', lastMessage: 'Vou verificar e retorno', time: '15 min atrás', status: 'offline' },
  ];
  
  useEffect(() => {
    if (!user?.id) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case 'day':
            startDate = subDays(now, 1);
            break;
          case 'week':
            startDate = subDays(now, 7);
            break;
          case 'month':
            startDate = subDays(now, 30);
            break;
          case 'custom':
            startDate = new Date(customDateRange.start);
            now.setTime(Date.parse(customDateRange.end));
            break;
        }

        const analyticsData = await getMessageAnalytics(
          user.id,
          startDate.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        );
        
        setAnalytics(analyticsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Falha ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, dateRange, customDateRange]);

  const getTotalContacts = () => {
    return analytics.reduce((sum, day) => sum + day.unique_contacts, 0);
  };

  const getTotalMessages = () => {
    return analytics.reduce((sum, day) => sum + day.total_messages, 0);
  };

  const getAverageMessagesPerDay = () => {
    if (analytics.length === 0) return 0;
    return Math.round(getTotalMessages() / analytics.length);
  };

  const getMessageTrend = () => {
    if (analytics.length < 2) return 0;
    const latest = analytics[0]?.total_messages || 0;
    const previous = analytics[1]?.total_messages || 0;
    return ((latest - previous) / previous) * 100;
  };

  const formatChartDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral das suas conversas no WhatsApp
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Contatos Ativos</p>
                <h3 className="text-2xl font-semibold text-gray-800">{getTotalContacts()}</h3>
              </div>
            </div>
            <div className="flex items-center text-green-500">
              <ArrowUpRight size={20} />
              <span className="text-sm ml-1">12%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Mensagens</p>
                <h3 className="text-2xl font-semibold text-gray-800">{getTotalMessages()}</h3>
              </div>
            </div>
            <div className="flex items-center text-red-500">
              <ArrowDownRight size={20} />
              <span className="text-sm ml-1">{getMessageTrend().toFixed(1)}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Média Diária</p>
                <h3 className="text-2xl font-semibold text-gray-800">{getAverageMessagesPerDay()}</h3>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4 flex-1">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="block w-full text-sm text-gray-700 border-gray-300 rounded-md focus:ring-whatsapp focus:border-whatsapp"
              >
                <option value="day">Último Dia</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Final</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-card p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Atividade de Mensagens</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, 'Mensagens']}
                  labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR })}
                />
                <Area
                  type="monotone"
                  dataKey="inbound_messages"
                  stackId="1"
                  stroke="#10B981"
                  fill="#D1FAE5"
                  name="Recebidas"
                />
                <Area
                  type="monotone"
                  dataKey="outbound_messages"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#DBEAFE"
                  name="Enviadas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Active Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Contatos Ativos</h3>
            <span className="text-sm text-gray-500">Últimos 30 min</span>
          </div>
          <div className="space-y-4">
            {activeContacts.map((contact, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">{contact.name.charAt(0)}</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    contact.status === 'online' ? 'bg-green-500' :
                    contact.status === 'typing' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{contact.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{contact.number}</p>
                  <p className="text-sm text-gray-600 truncate mt-1">{contact.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Contact Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribuição de Contatos</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value, 'Contatos']}
                labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR })}
              />
              <Bar
                dataKey="unique_contacts"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
                name="Contatos Únicos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;