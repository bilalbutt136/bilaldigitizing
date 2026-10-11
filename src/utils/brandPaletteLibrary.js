/**
 * BDigitizing curated brand identities. One palette feeds all semantic CSS roles;
 * dark colors use independent surfaces rather than inverted light mode.
 * All presets are available in Solid and Gradient treatments.
 */
export const CURATED_BRANDS = [
  { id: 'royal-cobalt', name: 'Royal Cobalt', category: 'Corporate', description: 'Deep cobalt, crisp porcelain and disciplined navy.', bestFor: 'Enterprise embroidery studios', primary: '#1947B6', secondary: '#303A93', accent: '#6731B6', lightBg: '#F5F8FF', darkBg: '#0B1428', darkPrimary: '#9BC0FF' },
  { id: 'heritage-emerald', name: 'Heritage Emerald', category: 'Premium', description: 'Confident forest green and subtle jade.', bestFor: 'Luxury uniform and textile brands', primary: '#146147', secondary: '#075B67', accent: '#286347', lightBg: '#F3FAF6', darkBg: '#081A16', darkPrimary: '#91DFC0' },
  { id: 'ocean-teal', name: 'Ocean Teal', category: 'Modern', description: 'Petrol teal with refreshing ocean depth.', bestFor: 'Modern production and print', primary: '#075F74', secondary: '#12518B', accent: '#12606E', lightBg: '#F2FAFB', darkBg: '#091923', darkPrimary: '#8CDEE3' },
  { id: 'royal-plum', name: 'Royal Plum', category: 'Creative', description: 'Royal amethyst and deep indigo elegance.', bestFor: 'Creative vector and design agencies', primary: '#66349D', secondary: '#45358D', accent: '#914081', lightBg: '#F9F6FE', darkBg: '#181023', darkPrimary: '#D2B6F4' },
  { id: 'signature-ruby', name: 'Signature Ruby', category: 'Bold', description: 'Rich ruby red with understated burgundy.', bestFor: 'Statement-making custom apparel', primary: '#A52647', secondary: '#782B57', accent: '#A74254', lightBg: '#FFF7F8', darkBg: '#210F1A', darkPrimary: '#FFAFBE' },
  { id: 'artisan-copper', name: 'Artisan Copper', category: 'Craft', description: 'Warm copper and refined walnut neutrals.', bestFor: 'Embroidery craftsmanship and patches', primary: '#92501F', secondary: '#6F4536', accent: '#9C592A', lightBg: '#FCF9F3', darkBg: '#1D1713', darkPrimary: '#EBC196' },
  { id: 'graphite-gold', name: 'Graphite Gold', category: 'Executive', description: 'Elegant graphite with controlled antique gold accents.', bestFor: 'Luxury B2B and executive merchandise', primary: '#313B4B', secondary: '#74531E', accent: '#866021', lightBg: '#F7F7F4', darkBg: '#101316', darkPrimary: '#D9DDE6' }
];

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0,2,4].map(i => parseInt(value.slice(i,i+2),16));
}
function rgba(hex, opacity) {
  return 'rgba(' + rgb(hex).join(',') + ',' + opacity + ')';
}
function mix(a,b,share=0.5) {
  const x=rgb(a),y=rgb(b);
  return '#' + x.map((v,i)=>Math.round(v*(1-share)+y[i]*share).toString(16).padStart(2,'0')).join('').toUpperCase();
}
export function buildCuratedTheme(brand, foundation) {
  const neutralText='#14243B';
  const mutedText='#536176';
  const light={
    ...foundation.light,
    '--color-primary':brand.primary,
    '--color-primary-hover':mix(brand.primary,'#000000',.18),
    '--color-primary-light':mix(brand.primary,'#FFFFFF',.91),
    '--color-primary-glow':rgba(brand.primary,.23),
    '--color-secondary':brand.secondary,
    '--color-secondary-hover':mix(brand.secondary,'#000000',.12),
    '--color-accent':brand.accent,
    '--color-accent-light':mix(brand.accent,'#FFFFFF',.90),
    '--color-action-start':brand.primary,
    '--color-action-end':brand.secondary,
    '--color-background':brand.lightBg,
    '--color-surface':'#FFFFFF',
    '--color-surface-elevated':mix(brand.lightBg,'#FFFFFF',.3),
    '--color-subtle':mix(brand.primary,'#FFFFFF',.94),
    '--color-input':mix(brand.lightBg,'#FFFFFF',.64),
    '--color-border':mix(brand.primary,'#FFFFFF',.79),
    '--color-border-hover':mix(brand.primary,'#FFFFFF',.64),
    '--color-border-focus':brand.primary,
    '--color-text-primary':neutralText,
    '--color-text-secondary':'#35445C',
    '--color-text-muted':mutedText,
    '--color-text-on-primary':'#FFFFFF',
    '--hero-bg':'radial-gradient(ellipse 72% 68% at 86% 0%, '+rgba(brand.secondary,.11)+', transparent 67%), radial-gradient(ellipse 78% 66% at 9% 0%, '+rgba(brand.primary,.09)+', transparent 70%), '+brand.lightBg,
    '--hero-tabs-bg':'#FFFFFF',
    '--hero-tabs-border':mix(brand.primary,'#FFFFFF',.79),
    '--hero-text-primary':neutralText,
    '--hero-text-secondary':'#35445C',
    '--hero-card-bg':'#FFFFFF',
    '--hero-card-border':mix(brand.primary,'#FFFFFF',.83),
    '--banner-bg':'linear-gradient(130deg,#FFFFFF,'+mix(brand.primary,'#FFFFFF',.96)+','+brand.lightBg+')',
    '--banner-title':neutralText,
    '--banner-desc':'#35445C',
    '--stats-card-bg':'#FFFFFF',
    '--stats-card-border':mix(brand.primary,'#FFFFFF',.80),
    '--stats-number-color':neutralText,
    '--stats-label-color':mutedText,
    '--cta-bg':'radial-gradient(ellipse 70% 65% at 50% 0%,'+rgba(brand.primary,.10)+',transparent 75%),'+brand.lightBg,
    '--cta-title':neutralText,
    '--cta-desc':'#35445C',
    '--cta-badge-bg':mix(brand.primary,'#FFFFFF',.90),
    '--cta-badge-border':mix(brand.primary,'#FFFFFF',.70),
    '--cta-badge-text':brand.primary,
    '--cta-btn-outline-color':brand.primary,
    '--cta-btn-outline-border':mix(brand.primary,'#FFFFFF',.66)
  };
  const dark={
    ...foundation.dark,
    '--color-primary':brand.darkPrimary,
    '--color-primary-hover':mix(brand.darkPrimary,'#FFFFFF',.2),
    '--color-primary-light':rgba(brand.darkPrimary,.15),
    '--color-primary-glow':rgba(brand.darkPrimary,.25),
    '--color-primary-text':brand.darkBg,
    '--color-secondary':mix(brand.darkPrimary,'#FFFFFF',.08),
    '--color-secondary-hover':mix(brand.darkPrimary,'#FFFFFF',.25),
    '--color-accent':mix(brand.darkPrimary,'#FFFFFF',.12),
    '--color-accent-light':rgba(brand.darkPrimary,.13),
    '--color-action-start':brand.primary,
    '--color-action-end':brand.secondary,
    '--color-background':brand.darkBg,
    '--color-surface':mix(brand.darkBg,'#FFFFFF',.055),
    '--color-surface-elevated':mix(brand.darkBg,'#FFFFFF',.11),
    '--color-subtle':mix(brand.darkBg,'#FFFFFF',.14),
    '--color-input':mix(brand.darkBg,'#FFFFFF',.085),
    '--color-border':rgba(brand.darkPrimary,.26),
    '--color-border-hover':rgba(brand.darkPrimary,.5),
    '--color-border-focus':brand.darkPrimary,
    '--color-text-primary':'#F5F7FF',
    '--color-text-secondary':'#CCD6E9',
    '--color-text-muted':'#A6B7CC',
    '--color-text-on-primary':brand.darkBg,
    '--hero-bg':'radial-gradient(ellipse 78% 70% at 85% 0%,'+rgba(brand.primary,.20)+',transparent 68%),'+brand.darkBg,
    '--hero-tabs-bg':mix(brand.darkBg,'#FFFFFF',.08),
    '--hero-tabs-border':rgba(brand.darkPrimary,.26),
    '--hero-text-primary':'#F5F7FF',
    '--hero-text-secondary':'#CCD6E9',
    '--hero-card-bg':mix(brand.darkBg,'#FFFFFF',.055),
    '--hero-card-border':rgba(brand.darkPrimary,.28),
    '--banner-bg':'linear-gradient(135deg,'+brand.darkBg+','+mix(brand.darkBg,brand.primary,.22)+','+brand.darkBg+')',
    '--banner-title':'#F5F7FF',
    '--banner-desc':'#CCD6E9',
    '--stats-card-bg':mix(brand.darkBg,'#FFFFFF',.055),
    '--stats-card-border':rgba(brand.darkPrimary,.26),
    '--stats-number-color':'#F5F7FF',
    '--stats-label-color':'#A6B7CC',
    '--cta-bg':'radial-gradient(ellipse 74% 72% at 52% 0%,'+rgba(brand.primary,.2)+',transparent 70%),'+brand.darkBg,
    '--cta-title':'#F5F7FF',
    '--cta-desc':'#CCD6E9',
    '--cta-badge-bg':rgba(brand.darkPrimary,.14),
    '--cta-badge-border':rgba(brand.darkPrimary,.38),
    '--cta-badge-text':brand.darkPrimary,
    '--cta-btn-outline-color':'#F5F7FF',
    '--cta-btn-outline-border':rgba(brand.darkPrimary,.36)
  };
  return {
    id:brand.id, name:brand.name, category:brand.category,
    description:brand.description, bestFor:brand.bestFor,
    palette:{primary:brand.primary,secondary:brand.secondary,accent:brand.accent,surface:'#FFFFFF'},
    tokens:{light,dark}
  };
}
