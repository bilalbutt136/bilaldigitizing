'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, User, Tag } from 'lucide-react';
import { supabase } from '../../src/lib/supabase/client';

const MASTER_DEFAULT_BLOGS = [
  {
    id: '3d-puff-caps-master-guide',
    title: 'Mastering 3D Puff Embroidery on Caps: Density, Foam Capping & Pathing Secrets',
    category: 'Embroidery Digitizing',
    author: 'Master Bilal (25+ Years Lead Digitizer)',
    date: 'August 2026',
    readTime: '8 min read',
    imageGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    content: `3D Puff embroidery on structured headwear and snapbacks is one of the most profitable yet technically demanding services for commercial apparel decorators. After 25+ years on the production floor digitizing over 250,000 files, our studio has codified the exact formula required to eliminate exposed foam, broken needles, and distorted cap seams.

### 1. EVA Foam Selection & Hardness
Never use soft craft foam for commercial embroidery. Standard 2mm to 3mm high-density EVA embroidery foam (typically 40–45 Shore A hardness) is required. If the foam is too soft, it compresses under thread tension and loses definition; if it is too hard, needle perforation creates birdnesting and shredding.

### 2. Capping Stitches & End-Seals
The #1 failure in 3D puff digitizing is exposed foam sticking out of open satin column ends. Every satin stroke must terminate with specialized "capping" or "end-seal" stitches—a series of tight, perpendicular triangle or trapezoid stitches that cleanly slice the foam before the top satin column covers it.

### 3. Stitch Density & Column Width
- **Standard Flat Embroidery:** Typical satin density is 0.40mm spacing.
- **3D Puff Embroidery:** Density must be tightened to 0.18mm–0.22mm (nearly double density) to completely encase the foam without the backing substrate showing through.
- **Minimum Column Width:** Keep columns between 3.0mm and 8.0mm. Any column narrower than 2.5mm will slice the foam in half; columns wider than 9.0mm become loose and catch on washing cycles.

### 4. Pull Compensation & Cap Center-Out Pathing
Because 3D foam exerts massive outward lateral pressure, standard pull compensation will cause columns to appear skinny and uneven. Apply +0.35mm to +0.50mm pull compensation outward. Always program digitizing sequences starting from the cap bottom-center outward toward the ears to prevent the front buckram seam from puckering or pushing off-register.`
  },
  {
    id: 'vector-color-separation-screen-printing',
    title: 'Precision Vector Color Separation for Screen Printing & DTF: The Master Standard',
    category: 'Vector Art',
    author: 'Master Bilal (Studio Art Director)',
    date: 'August 2026',
    readTime: '6 min read',
    imageGradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
    content: `Screen printers and apparel decorators lose thousands of dollars each month due to messy auto-traced vectors that contain jagged bezier curves, overlapping transparent pixels, and incorrect color channels. True production-ready vector conversion requires master hand-drawn node engineering and clean spot color separations.

### 1. The Myth of "Auto-Trace"
Automated vectorizers generate thousands of unnecessary anchor points, micro-gaps, and jagged edges that cause vinyl cutters to stutter and laser cutters to burn hot spots. Professional vector artists manually construct every curve using smooth Bézier tangent handles with the absolute minimum number of nodes for razor-sharp press output.

### 2. Pantone (PMS) Solid Coated Matching
Never deliver RGB or generic CMYK files for commercial textile printing. We convert all artwork to exact Pantone Solid Coated (PMS) spot colors, enabling your press operators to mix plastisol and water-based inks with 100% color fidelity to client brand guidelines.

### 3. White Underbase & Choking
When printing on dark garments (black, navy, heather gray), an underbase white plate is essential:
- **Underbase Plate:** 100% solid white silhouette under all colored inks.
- **Choke (Trapping):** We choke the white underbase inward by 0.5pt–1.0pt so the top colored inks completely cover the base with zero white outline peeking around the edges during high-speed press runs.

### 4. Master Deliverable Suite
Every vector order includes the complete production package: Adobe Illustrator (.AI), Scalable Vector (.SVG), Encapsulated PostScript (.EPS), Print-Ready Vector (.PDF), and ultra-high-resolution 300 DPI transparent (.PNG).`
  },
  {
    id: 'custom-patch-types-and-backings-guide',
    title: 'Embroidered vs Woven vs PVC Rubber vs Leather Patches: Durability & Backing Comparison',
    category: 'Custom Patches',
    author: 'Master Bilal (Patch Manufacturing Lead)',
    date: 'August 2026',
    readTime: '9 min read',
    imageGradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
    content: `Custom patches are experiencing massive growth across tactical gear, outdoor lifestyle apparel, motorcycle clubs, and corporate workwear. Choosing the right patch medium and backing determines both production cost and field longevity.

### 1. Patch Material Styles
- **Embroidered Patches:** 100% classic textured twill with raised Rayon/Polyester threads. Best for bold logos, sports teams, and classic varsity aesthetics.
- **Woven Patches:** Uses micro-thin threads woven on high-speed jacquard looms for razor-sharp reproduction of fine lettering down to 2mm and gradient photographic detail.
- **3D Molded PVC Rubber:** Waterproof, weather-resistant, flexible silicone/rubber. Ideal for military, law enforcement, tactical gear, and outdoor outerwear.
- **Laser-Engraved Leather:** Genuine or premium faux leather with laser burnished branding. Perfect for modern lifestyle snapbacks and denim outerwear.

### 2. Backing Options & When to Use Them
- **Military Velcro (Hook & Loop):** Dual-sided male/female hook-and-loop backing. Designed for tactical uniforms, operator caps, and modular backpacks.
- **Heat-Seal Iron-On:** Industrial adhesive applied with a commercial heat press (320°F for 15 seconds at 40 PSI).
- **Peel & Stick Sticker:** Pressure-sensitive adhesive for instant one-time application on hats, trade show giveaways, or temporary event credentials.
- **Plain Sew-On:** Traditional bare backing with a perimeter border ready for industrial lockstitch garment sewing.

### 3. Border Finishes: Merrowed vs Laser Cut
Standard geometric shapes (circles, ovals, rectangles) receive a classic 1/8" sealed Merrowed overlock edge. Complex custom die-cut shapes receive a heat-sealed laser-cut border that prevents fabric fraying while preserving intricate contour silhouettes.`
  },
  {
    id: 'eliminating-thread-breaks-digitizing-underlay',
    title: 'Eliminating Thread Breaks at 1,000+ SPM: The Science of Underlay & Pull Compensation',
    category: 'Technical Engineering',
    author: 'Master Bilal (Senior Production Engineer)',
    date: 'August 2026',
    readTime: '7 min read',
    imageGradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    content: `A single thread break on a multi-head commercial embroidery machine (6-head, 12-head, 18-head) halts production across all heads simultaneously. In a production environment, 10 thread breaks an hour equates to thousands of dollars in lost shop throughput. Zero thread breaks start on the digitizing canvas.

### 1. The 3-Tier Underlay Architecture
Underlay is the hidden foundation that anchors fabric to the backing stabilizer before top cover stitches are placed:
- **Center Walk / Contour Walk:** Lays the skeleton boundary and prevents outline distortion.
- **Zig-Zag Underlay:** Provides vertical loft and bridges open fabric weave gaps.
- **Double Tatami Mesh Underlay:** Placed at 90-degree opposite angles under large fill areas to eliminate puckering and birdnesting.

### 2. Fabric-Specific Push-Pull Calculations
Fabric is elastic; thread has tension. Stitches pull inward along their length and push outward along their width:
- **Piqué Golf Polos:** High stretch requires +0.40mm pull compensation and dense mesh underlay.
- **Structured Twill Hats:** Low stretch, high resistance—requires sharp acute needle penetration angles.
- **Performance Polyester / Spandex:** Requires light top density (0.45mm) to prevent needle-hole cutting and puckering.

### 3. Pathing Efficiency & Trim Minimization
Every jump and trim takes 4 to 8 seconds on machine cycles. By pathing designs in continuous directional flow with subtle travelling runs hidden underneath top stitches, we reduce trim counts by up to 60%, drastically cutting overall machine run time.`
  },
  {
    id: 'commercial-embroidery-file-formats-dst-emb-pes',
    title: 'Commercial Embroidery File Formats Explained: DST vs EMB vs PES vs EXP Protocols',
    category: 'Production Standards',
    author: 'Master Bilal (Technical Systems Lead)',
    date: 'August 2026',
    readTime: '5 min read',
    imageGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    content: `Navigating commercial machine file formats is critical for smooth shop workflow. Understanding the distinction between native object-based source files and compiled stitch files ensures flawless color sequences and machine compatibility.

### 1. Native Object Files (.EMB)
Wilcom .EMB files contain master parametric objects, wireframe node geometry, thread brand charts (Madeira, Isacord, Gunold), and true stitch properties. This source file allows seamless resizing and density recalculation without degrading stitch quality.

### 2. Tajima Standard (.DST)
The universal standard for commercial embroidery across Tajima, Barudan, SWF, Brother, and Ricoma multi-head machines. .DST stores precise X/Y motor coordinates, jumps, and trims. Because .DST does not store embedded thread palette colors, our studio always includes a companion **PDF Production Worksheet** displaying the exact thread color run list and pantone references.

### 3. Brother & Baby Lock (.PES)
Designed for Brother single-head and multi-needle commercial machines (PR-680W, PR-1055X) as well as consumer machines. .PES contains native thread color assignments and hoop boundary coordinates.

### 4. Melco & Bernina (.EXP)
Expanded format utilized by Melco Amaya/EMT16X machines and Bernina commercial lines with high-speed automated thread tensioning protocols.`
  }
];

export default function BlogsPage() {
  const [blogPosts, setBlogPosts] = useState(MASTER_DEFAULT_BLOGS);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setBlogPosts(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBlogs();
  }, []);
  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--color-text-primary)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* Blog Header Hero */}
      <div style={{ background: 'var(--bg-surface, #0f172a)', padding: 'clamp(4rem, 6vw, 6rem) 1.25rem', textAlign: 'center', color: '#ffffff' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          Industry <span style={{ color: 'var(--orange-500)' }}>Insights</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
          Expert guides, technical deep-dives, and creative inspiration covering everything from commercial embroidery digitizing to scalable vector art and custom patch manufacturing.
        </p>
      </div>

      <div className="container" style={{ maxWidth: '1000px', margin: '-2.5rem auto 0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {blogPosts.map((post) => (
            <article 
              key={post.id} 
              style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              {/* Decorative Image/Color Banner */}
              <div style={{ height: '160px', width: '100%', background: post.imageGradient, position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-16px', 
                  left: '1.25rem', 
                  background: 'var(--orange-500)', 
                  color: '#ffffff',
                  padding: '0.35rem 1rem',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
                }}>
                  {post.category}
                </div>
              </div>

              <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)' }}>
                <h2 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2.1rem)', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.85rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h2>
                
                {/* Meta Information */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={15} /> {post.author}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} /> {post.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary, #ea580c)' }}>
                    <Tag size={15} /> {post.readTime}
                  </span>
                </div>

                {/* Article Content Rendered Safely */}
                <div 
                  style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', 
                    lineHeight: 1.75,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.15rem'
                  }}
                >
                  {post.content.split('\n\n').map((paragraph, index) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;
                    
                    if (trimmed.startsWith('###')) {
                      return (
                        <h3 key={index} style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                          {trimmed.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith('-')) {
                      return (
                        <ul key={index} style={{ paddingLeft: '1.5rem', listStyleType: 'disc', margin: '0.5rem 0' }}>
                          {trimmed.split('\n').map((li, i) => (
                            <li key={i} style={{ marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: li.replace('- **', '<strong>').replace(':**', '</strong>:') }} />
                          ))}
                        </ul>
                      );
                    }

                    return <p key={index}>{trimmed}</p>;
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
        
        {/* Support CTA at bottom */}
        <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', background: 'var(--navy-900)', borderRadius: '16px', color: '#ffffff' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>Need personalized advice?</h3>
          <p style={{ color: 'var(--navy-200)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
            Our industry experts are available 24/7 to review your artwork and recommend the best digitizing or manufacturing approach.
          </p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('bdigi_open_chat'));
                setTimeout(() => {
                  const chatBtn = document.querySelector('.live-chat-floating-button') || document.querySelector('[data-chat-trigger="true"]');
                  if (chatBtn) chatBtn.click();
                }, 100);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #ff7a00, #ff9d40)',
              color: '#ffffff',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '999px',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(255, 122, 0, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Chat with an Expert <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
