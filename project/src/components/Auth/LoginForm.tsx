import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../../lib/supabase';
import { MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/userStore';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast.success('Email de confirmação reenviado! Por favor, verifique sua caixa de entrada.', {
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Falha ao reenviar o email de confirmação. Tente novamente mais tarde.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);

    try {
      const { data, userData } = await signInWithEmail(email, password);
      if (!data?.session) throw new Error('No session');
      
      // Set user data in store if available
      if (userData) {
        setUser(userData);
      } else {
        console.warn('User profile not found. Only authentication data available.');
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Check for specific error types
      if (error.message?.includes('email_not_confirmed') || error.message === 'Email not confirmed') {
        setShowResend(true);
        toast.error(
          'Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.',
          { duration: 5000 }
        );
      } else if (error.message === 'Invalid login credentials') {
        toast.error('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
      } else {
        toast.error('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-card"
    >
      <div className="text-center">
        <div className="mx-auto flex justify-center items-center w-12 h-12 rounded-full bg-whatsapp text-white">
          <MessageCircle size={24} />
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Entrar no ZapBan</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sua plataforma de automação do WhatsApp
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
              placeholder="seu.email@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
              placeholder="••••••••"
            />
          </div>
        </div>

        {showResend && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendConfirmation}
              className="text-whatsapp hover:text-whatsapp-dark font-medium"
            >
              Reenviar email de confirmação
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-whatsapp focus:ring-whatsapp border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Lembrar-me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-whatsapp hover:text-whatsapp-dark">
              Esqueceu sua senha?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Não tem uma conta?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate('/signup')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
          >
            Criar conta
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;