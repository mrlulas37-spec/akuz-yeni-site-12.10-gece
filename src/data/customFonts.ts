export interface CustomFontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: 'racing' | 'gothic' | 'script' | 'bold' | 'classic' | 'retro';
  tag?: string;
  previewSample?: string;
}

export const CUSTOM_FONTS: CustomFontOption[] = [
  {
    id: 'bebas-neue',
    name: 'Bebas Neue (Yarış & Spor)',
    fontFamily: "'Bebas Neue', sans-serif",
    category: 'racing',
    tag: 'Çok Popüler',
    previewSample: 'SPEED HUNTER',
  },
  {
    id: 'righteous',
    name: 'Righteous (Modern JDM)',
    fontFamily: "'Righteous', cursive",
    category: 'racing',
    tag: 'JDM Trend',
    previewSample: 'DRIFT KING',
  },
  {
    id: 'unifraktur',
    name: 'Gothic Old English',
    fontFamily: "'UnifrakturMaguntia', serif",
    category: 'gothic',
    tag: 'Klasik Gotik',
    previewSample: 'La Familia Es Todo',
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes (Zarif El Yazısı)',
    fontFamily: "'Great Vibes', cursive",
    category: 'script',
    tag: 'Zarif & Şık',
    previewSample: 'Signature Edition',
  },
  {
    id: 'permanent-marker',
    name: 'Street Marker (Sokak Stili)',
    fontFamily: "'Permanent Marker', cursive",
    category: 'bold',
    tag: 'Agresif',
    previewSample: 'OUTLAW 07',
  },
  {
    id: 'russo-one',
    name: 'Russo One (Güçlü Blok)',
    fontFamily: "'Russo One', sans-serif",
    category: 'bold',
    tag: '4x4 Off-Road',
    previewSample: 'TURBO 4x4',
  },
  {
    id: 'orbitron',
    name: 'Orbitron (Fütüristik / Siber)',
    fontFamily: "'Orbitron', sans-serif",
    category: 'racing',
    tag: 'Cyber Tech',
    previewSample: 'CYBER MOTORSPORT',
  },
  {
    id: 'pacifico',
    name: 'Pacifico (Retro Kaligrafik)',
    fontFamily: "'Pacifico', cursive",
    category: 'script',
    tag: 'Retro Vibe',
    previewSample: 'Custom Rides',
  },
  {
    id: 'cinzel',
    name: 'Cinzel (Lüks & Asil Roman)',
    fontFamily: "'Cinzel', serif",
    category: 'classic',
    tag: 'Lüks & Asil',
    previewSample: 'ROYAL CUSTOMS',
  },
  {
    id: 'black-ops',
    name: 'Black Ops One (Askeri Stencil)',
    fontFamily: "'Black Ops One', cursive",
    category: 'bold',
    tag: 'Askeri Şablon',
    previewSample: 'SPECIAL FORCES',
  },
  {
    id: 'alex-brush',
    name: 'Alex Brush (Akıcı Hat Sanatı)',
    fontFamily: "'Alex Brush', cursive",
    category: 'script',
    previewSample: 'Custom Edition',
  },
  {
    id: 'oswald',
    name: 'Oswald Bold (Dinamik Dik)',
    fontFamily: "'Oswald', sans-serif",
    category: 'racing',
    previewSample: 'MOTORSPORTS DIVISION',
  },
];
