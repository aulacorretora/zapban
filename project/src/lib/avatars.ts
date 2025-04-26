// Professional avatars from Pexels
export const maleAvatars = [
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
  'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
  'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
];

export const femaleAvatars = [
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
  'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
  'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg',
];

const brazilianNames = {
  male: ['João', 'Pedro', 'Carlos', 'Lucas', 'Gabriel', 'Rafael', 'André', 'Marcos'],
  female: ['Maria', 'Ana', 'Juliana', 'Fernanda', 'Beatriz', 'Carla', 'Amanda', 'Isabela']
};

export const getGenderFromName = (name: string): 'male' | 'female' | null => {
  const firstName = name.split(' ')[0].toLowerCase();
  
  if (brazilianNames.male.some(n => n.toLowerCase() === firstName)) {
    return 'male';
  }
  if (brazilianNames.female.some(n => n.toLowerCase() === firstName)) {
    return 'female';
  }
  
  return null;
};

export const getRandomAvatar = (gender: 'male' | 'female' | null): string => {
  const avatars = gender === 'male' ? maleAvatars : 
                 gender === 'female' ? femaleAvatars :
                 [...maleAvatars, ...femaleAvatars];
  
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};