export const ADJECTIVES = [
  'Notorious', 'Silent', 'Ancient', 'Bright', 'Calm', 'Daring', 'Eager', 'Fierce',
  'Gentle', 'Happy', 'Icy', 'Jolly', 'Kind', 'Lively', 'Mighty', 'Noble', 'Odd',
  'Proud', 'Quick', 'Rapid', 'Shiny', 'Tall', 'Urban', 'Vivid', 'Wild', 'Xenial',
  'Youthful', 'Zany', 'Brave', 'Clever', 'Dizzy', 'Epic', 'Fuzzy', 'Grumpy',
  'Hasty', 'Ironic', 'Jazzy', 'Keen', 'Lazy', 'Misty', 'Nervy', 'Oblique',
  'Peppy', 'Quirky', 'Rusty', 'Sassy', 'Trendy', 'Upbeat', 'Witty', 'Cosmic',
];

export const ANIMALS = [
  'Camel', 'Tiger', 'Eagle', 'Panda', 'Wolf', 'Fox', 'Bear', 'Hawk', 'Lion', 'Lynx',
  'Moose', 'Otter', 'Raven', 'Shark', 'Snake', 'Viper', 'Whale', 'Zebra', 'Bison', 'Crane',
  'Dingo', 'Falcon', 'Gecko', 'Heron', 'Iguana', 'Jaguar', 'Koala', 'Lemur', 'Manta', 'Narwhal',
  'Osprey', 'Parrot', 'Quail', 'Rhino', 'Sloth', 'Tapir', 'Uakari', 'Vulture', 'Walrus', 'Xerus',
  'Yak', 'Zorilla', 'Axolotl', 'Bobcat', 'Condor', 'Dugong', 'Ermine', 'Ferret', 'Gibbon', 'Hyena',
];

export function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

export const AVATARS = [
  '/avatars/CYB-01_Netrunner.png',
  '/avatars/CYB-02_Ghost.png',
  '/avatars/CYB-03_Soldier.png',
  '/avatars/CYB-04_Warbot.png',
  '/avatars/CYB-05_Wanderer.png',
  '/avatars/CYB-06_Enforcer.png',
  '/avatars/CYB-07_Phantom.png',
  '/avatars/CYB-08_Wraith.png',
  '/avatars/CYB-09_Ranger.png',
  '/avatars/CYB-10_City.png',
  '/avatars/CYB-11_Street.png',
  '/avatars/CYB-12_Sentinel.png',
];

export const DEFAULT_AVATAR = AVATARS[0];
