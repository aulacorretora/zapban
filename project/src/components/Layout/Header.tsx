import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, Zap } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getGenderFromName, getRandomAvatar } from '../../lib/avatars';

interface HeaderProps {
  toggleMobileMenu: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileMenu, title }) => {
  const { user } = useUserStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  const notifications = [
    { id: 1, title: 'WhatsApp desconectado', message: 'Sua instância Principal foi desconectada', time: '5 min atrás' },
    { id: 2, title: 'Nova mensagem', message: 'Você recebeu 3 novas mensagens', time: '1 hora atrás' },
  ];

  useEffect(() => {
    if (user?.nome) {
      const gender = getGenderFromName(user.nome);
      const avatar = getRandomAvatar(gender);
      setUserAvatar(avatar);
    }
  }, [user?.nome]);

  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          type="button"
          className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none mr-4"
          onClick={toggleMobileMenu}
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center">
          <div className="hidden lg:flex items-center mr-3">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="bg-whatsapp-dark rounded-lg p-1.5">
                <Zap size={20} className="text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
              />
            </motion.div>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:block relative">
          <div className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-whatsapp focus:border-transparent text-sm w-full md:w-64 transition-all duration-300 focus:w-80"
            />
          </div>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-600 hover:text-gray-900 focus:outline-none relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={20} />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
            >
              2
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10"
              >
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="p-2 text-center border-t border-gray-200">
                  <button className="text-xs text-whatsapp hover:text-whatsapp-dark font-medium">
                    Ver todas as notificações
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.nome || 'Usuário'}</p>
            <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <motion.div
              initial={false}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-whatsapp to-whatsapp-dark flex items-center justify-center text-white font-medium shadow-md cursor-pointer transform transition-all duration-300 group-hover:shadow-lg overflow-hidden"
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={user?.nome || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.nome ? getFirstName(user.nome) : 'U'}</span>
              )}
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
            />
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;