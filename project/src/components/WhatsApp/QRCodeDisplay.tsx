import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string;
  onClose: () => void;
  expiresIn?: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  qrCode, 
  onClose,
  expiresIn = 60 
}) => {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    if (!timeLeft || !showQR) return;
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, showQR]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowQR(false);
    }
  }, [timeLeft]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 p-4"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Conectar WhatsApp</h3>
          <p className="text-gray-600 mt-1">Escaneie este QR code com seu celular</p>
        </div>
        
        <div className="flex flex-col items-center">
          {showQR ? (
            <>
              <div className="bg-white p-3 rounded-lg relative">
                <QRCodeSVG
                  value={qrCode}
                  size={220}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              </div>
              
              <div className="mt-6 w-full">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-whatsapp h-2.5 rounded-full" 
                    style={{ width: `${(timeLeft / expiresIn) * 100}%` }} 
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  QR code expira em {timeLeft} segundos
                </p>
              </div>
              
              <div className="mt-6 space-y-4 w-full">
                <p className="text-sm text-gray-600">
                  1. Abra o WhatsApp no seu celular
                </p>
                <p className="text-sm text-gray-600">
                  2. Toque em Menu ou Configurações e selecione WhatsApp Web
                </p>
                <p className="text-sm text-gray-600">
                  3. Aponte seu celular para esta tela para capturar o código
                </p>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-lg font-medium text-gray-800 mb-4">QR code expirou</p>
              <button
                onClick={onClose}
                className="py-2 px-4 bg-whatsapp text-white rounded-md hover:bg-whatsapp-dark transition-colors"
              >
                Gerar Novo QR
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QRCodeDisplay;