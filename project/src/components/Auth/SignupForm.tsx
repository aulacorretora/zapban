import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '../../lib/supabase';
import { MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, userData } = await signUpWithEmail(email, password, fullName);
      if (!data.user) {
        throw new Error('Signup failed');
      }
      setSignupComplete(true);
      toast.success('Cadastro realizado! Verifique seu email para continuar.', {
        duration: 6000,
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado. Por favor, faça login.');
        navigate('/login');
      } else {
        toast.error('Falha ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (signupComplete) {
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
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifique seu Email</h2>
          <p className="mt-4 text-gray-600">
            Enviamos um link de confirmação para:
            <br />
            <span className="font-medium text-gray-800">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Por favor, verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
          </p>
          
          <div className="pt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-whatsapp hover:text-whatsapp-dark font-medium"
            >
              Voltar para o Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

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
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Criar uma conta</h2>
        <p className="mt-2 text-sm text-gray-600">
          Entre para o ZapBan e automatize seu WhatsApp
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
              placeholder="João Silva"
            />
          </div>
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-70"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
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
              Já tem uma conta?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
          >
            Entrar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupForm;