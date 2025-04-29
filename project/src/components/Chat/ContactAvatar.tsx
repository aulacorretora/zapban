import React from 'react';

interface ContactAvatarProps {
  name: string;
  profilePicUrl?: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  profilePicUrl,
  isOnline = false,
  size = 'md'
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className="relative">
      {profilePicUrl ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
          <img 
            src={profilePicUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div 
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-whatsapp to-whatsapp-dark flex items-center justify-center text-white font-medium`}
        >
          {getInitials(name)}
        </div>
      )}
      
      {isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default ContactAvatar;
