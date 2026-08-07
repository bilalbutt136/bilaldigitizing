'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Maximize2, 
  X, 
  Filter,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';

const PORTFOLIO_ITEMS = [
  {
    id: 'port-1',
    category: 'embroidery',
    categoryLabel: 'Embroidery Digitizing',
    title: 'Golden Eagle Sports Club Crest',
    description: 'Precision satin stitching with density compensation for cotton pique knit polos. Clean pathing eliminates fabric puckering.',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '12,450 Stitches',
    colors: '5 Thread Colors',
    formats: 'DST, PES, EMB, EXP',
    clientType: 'Apparel Decorator'
  },
  {
    id: 'port-2',
    category: 'embroidery',
    categoryLabel: 'Embroidery Digitizing',
    title: 'Cybernetics 3D Raised Cap Logo',
    description: '3mm EVA foam pathing with sharp corner perforations. Center-out sequencing engineered specifically for structured cap frames.',
    beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '15,800 Stitches',
    colors: '2 Thread Colors (3mm Foam)',
    formats: 'DST, PES, JEF, EXP',
    clientType: 'Headwear Brand'
  },
  {
    id: 'port-5',
    category: 'embroidery',
    categoryLabel: 'Embroidery Digitizing',
    title: 'Ironclad Biker Jacket Back Crest',
    description: 'High stitch count jacket back design. Metallic thread underlay pathing with optimized jump cuts for smooth production.',
    beforeImg: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '48,500 Stitches',
    colors: '7 Metallic & Rayon Colors',
    formats: 'DST, PES, EMB, VP3',
    clientType: 'Custom Motorcycle Apparel'
  },
  {
    id: 'port-7',
    category: 'embroidery',
    categoryLabel: 'Embroidery Digitizing',
    title: 'Titanium Motors 3D Foam Snapback',
    description: 'Heavy 3D foam caps engineered for multi-needle Tajima machines with zero thread breaks during high-speed runs.',
    beforeImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    stitchCount: '14,200 Stitches',
    colors: '3 Thread Colors + 3mm EVA',
    formats: 'DST, EXP, HUS',
    clientType: 'Motorsports Shop'
  },
  {
    id: 'port-9',
    category: 'embroidery',
    categoryLabel: 'Embroidery Digitizing',
    title: 'High-Detail Floral Monogram Left Chest',
    description: 'Micro satin stitching and delicate shading density mapped for high-end corporate softshell jackets and dress shirts.',
    beforeImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    stitchCount: '9,800 Stitches',
    colors: '4 Madeira Thread Colors',
    formats: 'DST, PES, EMB, ART',
    clientType: 'Corporate Uniform Client'
  },
  {
    id: 'port-3',
    category: 'vector',
    categoryLabel: 'Vector Conversion',
    title: 'Vintage Skull & Rose Vector Redraw',
    description: 'Hand-traced raster JPG converted to resolution-independent vector graphics with Pantone spot color separation.',
    beforeImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'N/A (Scalable Vector)',
    colors: '4 Spot Color Separations',
    formats: 'AI, EPS, SVG, PDF',
    clientType: 'Screen Printer'
  },
  {
    id: 'port-6',
    category: 'vector',
    categoryLabel: 'Vector Conversion',
    title: 'Wildcat Firehouse Mascot Raster Cleanup',
    description: 'Pixelated low-resolution logo rebuilt into crisp, smooth nodes ready for large-format banner printing and embroidery.',
    beforeImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'N/A (Vector Master)',
    colors: 'Full CMYK + Spot Vector',
    formats: 'AI, EPS, SVG, CDR',
    clientType: 'Promo Merchandise Co.'
  },
  {
    id: 'port-10',
    category: 'vector',
    categoryLabel: 'Vector Conversion',
    title: 'Automotive Racing Team Emblem Vectorization',
    description: 'Low-res cell phone camera photo transformed into razor-sharp Illustrator vector paths with gradient mesh color fills.',
    beforeImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'N/A (Vector Master)',
    colors: 'CMYK + Pantone Spot Separations',
    formats: 'AI, EPS, SVG, PDF',
    clientType: 'Vinyl & Decal Manufacturer'
  },
  {
    id: 'port-11',
    category: 'vector',
    categoryLabel: 'Vector Conversion',
    title: 'Hand-Drawn Mascot Sketch to Vinyl Print Vector',
    description: 'Pencil drawing scanned and hand-traced node-by-node with perfectly closed anchor points for plotters and vinyl cutters.',
    beforeImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'N/A (Vector Master)',
    colors: 'Single Color Cut Paths',
    formats: 'AI, SVG, DXF, EPS',
    clientType: 'Signage & Apparel Printer'
  },
  {
    id: 'port-4',
    category: 'patches',
    categoryLabel: 'Custom Patches',
    title: 'Tactical Merrowed Border Embroidered Patch',
    description: 'High-density rayon thread embroidery with classic overlock merrowed border edges and heavy-duty velcro backing.',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '18,200 Stitches',
    colors: '6 Rayon Thread Colors',
    formats: 'Velcro / Iron-On Backing',
    clientType: 'Uniform Outfitters'
  },
  {
    id: 'port-8',
    category: 'patches',
    categoryLabel: 'Custom Patches',
    title: 'Tactical 3D Molded Rubber PVC Patch',
    description: '100% waterproof molded PVC patch with deep dimensional layers, laser-cut border edges, and tactical hook-and-loop velcro.',
    beforeImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    stitchCount: '3D Molded PVC',
    colors: '3 Color Molded Rubber',
    formats: 'Tactical Hook & Loop',
    clientType: 'Outdoor & Tactical Gear'
  },
  {
    id: 'port-12',
    category: 'patches',
    categoryLabel: 'Custom Patches',
    title: 'Vintage Laser-Engraved Genuine Leather Patch',
    description: 'Rustic genuine tan leather patch with precision laser-etched debossing and stitched border channel for denim & beanies.',
    beforeImg: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'Laser Etched Leather',
    colors: 'Natural Tan & Dark Burnish',
    formats: 'Heat Seal / Sew-On Groove',
    clientType: 'Lifestyle & Denim Apparel'
  },
  {
    id: 'port-13',
    category: 'patches',
    categoryLabel: 'Custom Patches',
    title: 'Custom Chenille Varsity Letterman Patch',
    description: 'Plush high-loft chenille loop yarn combined with gold embroidery underlay and felt backing for high school varsity jackets.',
    beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'High-Loft Chenille Yarn',
    colors: '3 Chenille Colors + Metallic',
    formats: 'Heavy Felt Sew-On Backing',
    clientType: 'Varsity & Athletics Brand'
  },
  {
    id: 'port-14',
    category: 'patches',
    categoryLabel: 'Custom Patches',
    title: 'Sublimated HD Printed Patch with Overlock Edge',
    description: 'Photographic resolution dye-sublimation patch for complex artwork with gradient fills, trimmed with a merrowed border.',
    beforeImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'Dye-Sublimated + Satin Border',
    colors: 'Full Color Photographic HD',
    formats: 'Iron-On & Adhesive Backing',
    clientType: 'Event & Festival Merchandise'
  }
];

export const PortfolioPage = () => {
  const navigate = useNavigate();
  const { portfolioSamples = [] } = useAppState();

  const [activeFilter, setActiveFilter] = useState('embroidery');
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [comparisonPositions, setComparisonPositions] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const combinedItems = portfolioSamples && portfolioSamples.length > 0
    ? portfolioSamples.map((s, idx) => ({
        id: s.id || `sample-${idx}`,
        category: (s.category || '').toLowerCase().includes('vector') ? 'vector' : (s.category || '').toLowerCase().includes('patch') ? 'patches' : 'embroidery',
        categoryLabel: s.category || 'Embroidery Digitizing',
        title: s.title || 'Custom Digitized Design',
        description: s.description || 'Commercial machine file pathing with smooth underlay foundation.',
        beforeImg: s.originalImage || s.beforeImg || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        afterImg: s.digitizedImage || s.afterImg || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        stitchCount: s.stitchCount || '10,500 Stitches',
        colors: s.colors || 'Multi-Color Thread',
        formats: 'DST, PES, EMB, SVG',
        clientType: 'Commercial Studio Client'
      }))
    : PORTFOLIO_ITEMS;

  const filteredItems = combinedItems.filter(item => item.category === activeFilter);

  const filterTabs = [
    { key: 'embroidery', label: 'Embroidery Digitizing' },
    { key: 'vector', label: 'Vector Art Conversion' },
    { key: 'patches', label: 'Custom Patches' }
  ];

  const handleSliderMove = (id, posPercent) => {
    setComparisonPositions(prev => ({ ...prev, [id]: posPercent }));
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Page Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
        color: '#ffffff',
        padding: '3.75rem 0 3.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '350px',
          height: '350px',
          background: 'rgba(249, 115, 22, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div className="container">
          {/* Breadcrumbs */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            color: '#94a3b8', 
            marginBottom: '1.25rem' 
          }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>Portfolio Showcase</span>
          </div>

          <div style={{ maxWidth: '820px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              color: 'var(--orange-400)',
              fontWeight: 800,
              fontSize: '0.825rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <Sparkles size={15} /> Commercial Stitch & Vector Gallery
            </div>

            <h1 style={{ 
              fontSize: '2.85rem', 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 800, 
              color: '#ffffff', 
              marginBottom: '1rem',
              lineHeight: 1.15,
              letterSpacing: '-0.02em'
            }}>
              Stitchout & Vector Portfolio
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '2.25rem' }}>
              Explore our real digitized sew-outs, 3D puff cap pathing, clean vector restorations, and physical embroidered patch samples delivered to 1,200+ commercial embroidery shops.
            </p>

            {/* Quick Stat Badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.9rem',
              color: '#e2e8f0',
              fontWeight: 700
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> 10,000+ Completed Designs
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> 99.8% Zero Thread Break Rate
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> 4-Hour Express Turnaround
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Portfolio Section */}
      <section style={{ padding: '4rem 0 5.5rem', flex: 1 }}>
        <div className="container">

          {/* Filter Category Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '3.5rem'
          }}>
            {filterTabs.map(tab => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    background: isActive ? 'var(--orange-500)' : '#ffffff',
                    color: isActive ? '#ffffff' : 'var(--navy-800)',
                    border: isActive ? '1.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                    padding: '0.65rem 1.35rem',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 14px rgba(249, 115, 22, 0.35)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {tab.key === 'all' && <Filter size={15} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Portfolio Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
            gap: '2.25rem',
            marginBottom: '4rem'
          }}>
            {filteredItems.map((item) => {
              const posPercent = comparisonPositions[item.id] !== undefined ? comparisonPositions[item.id] : 50;

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div>
                    {/* Interactive Image Preview */}
                    <div 
                      style={{ 
                        position: 'relative', 
                        height: '240px', 
                        overflow: 'hidden', 
                        background: '#0f172a',
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveItemModal(item)}
                    >
                      {/* Final Finished Image */}
                      <img 
                        src={item.afterImg || item.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'} 
                        alt={`${item.title || 'Portfolio'} Finished Artwork`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';
                        }}
                      />

                      {/* Category Pill */}
                      <span style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.88)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--orange-400)',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        pointerEvents: 'none'
                      }}>
                        {item.categoryLabel}
                      </span>

                      {/* Interactive Zoom Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        pointerEvents: 'none'
                      }}>
                        <Maximize2 size={13} /> Inspect
                      </div>
                    </div>

                    {/* Clean Card Body Caption */}
                    <div style={{ padding: '1.25rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>
                          {item.title}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {item.categoryLabel} • {item.formats}
                        </div>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fff7ed', color: 'var(--orange-600)', border: '1px solid #ffedd5', padding: '0.3rem 0.7rem', borderRadius: '9999px', flexShrink: 0 }}>
                        ⚡ {item.stitchCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Bottom Conversion CTA Banner */}
          {(() => {
            const getCtaConfig = (filter) => {
              switch (filter) {
                case 'patches':
                  return {
                    badge: '📦 CUSTOM PATCH MANUFACTURE',
                    heading: 'Ready to Order Custom Patches?',
                    subtext: 'Configure custom manufactured patches with velcro, iron-on, or sew-on backing, merrowed border options, and fast 3-5 day studio production.',
                    btnText: 'Order Custom Patches Now',
                    route: '/custom-patches'
                  };
                case 'vector':
                  return {
                    badge: '📐 VECTOR TRACING & REDRAW',
                    heading: 'Ready to Convert Your Vector Artwork?',
                    subtext: 'Transform low-res logos, raster JPGs, and sketches into clean, 100% hand-drawn scalable vector files (.AI, .EPS, .SVG, .PDF) in 6-12 hours.',
                    btnText: 'Order Vector Tracing Now',
                    route: '/services/vector-tracing'
                  };
                case 'embroidery':
                case 'all':
                default:
                  return {
                    badge: '⚡ COMMERCIAL QUALITY GUARANTEE',
                    heading: 'Ready to Digitize Your Logo?',
                    subtext: 'Submit your logo today and receive commercial machine-ready files (.DST, .PES, .EMB) in as fast as 4 hours with unlimited free revisions.',
                    btnText: 'Upload Your Artwork Now',
                    route: '/services/embroidery-digitizing'
                  };
              }
            };

            const cta = getCtaConfig(activeFilter);

            return (
              <div style={{
                background: 'linear-gradient(135deg, var(--navy-900) 0%, #ff7a00 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '3.5rem 2.5rem',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.35rem 0.95rem',
                    borderRadius: '9999px',
                    marginBottom: '1rem'
                  }}>
                    <Zap size={16} /> {cta.badge}
                  </div>

                  <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
                    {cta.heading}
                  </h2>

                  <p style={{ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.6, marginBottom: '2.25rem' }}>
                    {cta.subtext}
                  </p>

                  <button
                    type="button"
                    className="btn btn-navy btn-lg"
                    style={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      padding: '0.95rem 2.25rem',
                      background: '#0f172a',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '2px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      boxShadow: '0 8px 25px rgba(15, 23, 42, 0.4)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      navigate(cta.route);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <UploadCloud size={20} style={{ color: 'var(--orange-400)' }} /> {cta.btnText} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* Lightbox Preview Modal */}
      {activeItemModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setActiveItemModal(null)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '850px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              background: 'var(--navy-900)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {activeItemModal.categoryLabel}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {activeItemModal.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0.4rem' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Image Previews Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', background: '#0f172a' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Original Artwork (Before)
                </div>
                <img 
                  src={activeItemModal.beforeImg} 
                  alt="Original" 
                  style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-400)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Digitized Sew-Out (After)
                </div>
                <img 
                  src={activeItemModal.afterImg} 
                  alt="Digitized" 
                  style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid var(--orange-500)' }}
                />
              </div>
            </div>

            {/* Modal Footer Info */}
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--text-muted)', maxWidth: '550px' }}>
                {activeItemModal.description}
              </p>
              <button
                type="button"
                className="btn btn-primary-orange"
                onClick={() => {
                  setActiveItemModal(null);
                  navigate('/services/embroidery-digitizing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ fontWeight: 800, padding: '0.65rem 1.35rem' }}
              >
                Order This Style <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
