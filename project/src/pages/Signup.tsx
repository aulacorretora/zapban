import React from 'react';
import SignupForm from '../components/Auth/SignupForm';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-whatsapp-dark to-primary-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center"
      >
        <div className="mx-auto flex justify-center items-center w-20 h-20 rounded-full bg-white">
          <MessageCircle size={40} className="text-whatsapp" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-white">ZapBan</h1>
        <p className="mt-2 text-white text-xl opacity-80">WhatsApp Automation Platform</p>
      </motion.div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm />
      </div>

      <div className="mt-8 text-center">
        <p className="text-white text-opacity-80 text-sm">
          &copy; {new Date().getFullYear()} ZapBan. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;