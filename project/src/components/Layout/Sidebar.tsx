import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Users, 
  Bot, 
  Link as LinkIcon, 
  LogOut,
  BarChart,
  Zap,
  Mail
} from 'lucide-react';
import { signOut } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useUserStore } from '../../stores/userStore';
import { getGenderFromName, getRandomAvatar } from '../../lib/avatars';

interface SidebarProps {
  isMobile: boolean;
  closeMobileMenu?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, closeMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isAdmin = user?.role === 'admin';
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user?.nome) {
      const gender = getGenderFromName(user.nome);
      const avatar = getRandomAvatar(gender);
      setUserAvatar(avatar);
    }
  }, [user?.nome]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Desconectado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast.error('Falha ao desconectar');
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: <Home size={20} />, label: 'Início' },
    { path: '/chat', icon: <MessageSquare size={20} />, label: 'Chat' },
    { path: '/automations', icon: <Bot size={20} />, label: 'Automações' },
    { path: '/webhooks', icon: <LinkIcon size={20} />, label: 'Webhooks' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  if (isAdmin) {
    menuItems.push(
      { path: '/admin', icon: <Users size={20} />, label: 'Administração' },
      { path: '/analytics', icon: <BarChart size={20} />, label: 'Análises' }
    );
  }

  const handleMenuItemClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  };

  return (
    <motion.div
      initial={{ x: isMobile ? -250 : 0, opacity: isMobile ? 0 : 1 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col h-full bg-whatsapp-dark text-white w-64 ${isMobile ? 'fixed inset-y-0 left-0 z-40' : ''}`}
    >
      <div className="p-6 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="bg-white rounded-lg p-2 transform rotate-3 transition-transform duration-300 hover:rotate-6">
              <Zap size={24} className="text-whatsapp-dark" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl tracking-tight">ZapBan</span>
            <span className="text-xs text-white/70">Automação Inteligente</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleMenuItemClick}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-whatsapp text-white'
                  : 'text-white opacity-80 hover:opacity-100 hover:bg-opacity-25 hover:bg-black'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-auto p-4 border-t border-whatsapp/20"
      >
        <motion.div 
          className="bg-whatsapp/10 rounded-lg p-4 mb-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-whatsapp to-whatsapp-dark flex items-center justify-center text-white font-medium shadow-lg overflow-hidden">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={user?.nome || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.nome ? getFirstName(user.nome) : 'U'}</span>
                )}
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-whatsapp-dark"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-white/70 truncate flex items-center">
                <Mail size={12} className="mr-1" />
                {user?.email}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.button
          onClick={handleSignOut}
          className="flex w-full items-center px-4 py-2 text-sm rounded-md text-white opacity-80 hover:opacity-100 hover:bg-black/25 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={18} />
          <span className="ml-3">Sair</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;