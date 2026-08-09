'use client';

import React from 'react';
import { ChevronRight, Clock, User, Tag } from 'lucide-react';


const blogPosts = [
  {
    id: 1,
    title: 'The Art of Embroidery Digitizing: From Stitch to Perfection',
    category: 'Embroidery',
    author: 'Bilal Studio Team',
    date: 'August 10, 2026',
    readTime: '5 min read',
    content: `
      Embroidery digitizing is much more than just converting an image into a machine file. It is a highly skilled art form that requires an intimate understanding of thread types, fabric tension, and machine mechanics. 

      At its core, digitizing is the process of mapping out the exact path a needle will take to recreate your artwork. A poor digitizer relies heavily on auto-tracing software, which often results in excessive thread breaks, puckered fabric, and muddy details. At Bilal Digitizing, our process is 100% manual.

      ### Understanding Stitch Types
      There are three primary stitch types used in commercial embroidery:
      - **Run Stitches:** Used for outlines, fine details, and connecting elements without trimming the thread.
      - **Satin Stitches:** Used for text, borders, and narrow columns (typically between 1mm and 8mm wide). They create a smooth, raised, and shiny effect.
      - **Fill Stitches (Tatami):** Used for filling large areas of color. The angle and density of the fill stitch dramatically affect how light hits the final embroidery.

      ### The Importance of Push and Pull Compensation
      When a machine embroiders, the fabric inevitably shifts. Stitches push out horizontally and pull in vertically. A master digitizer proactively compensates for this distortion in the software, ensuring that circles stay perfectly round and outlines align flawlessly on the final garment. 

      ### Machine Formats
      Whether you run a single-head home machine or a massive 15-head commercial Tajima, we provide native files optimized for your exact setup. The most common format is .DST (Tajima), but we also supply .PES (Brother), .EXP (Melco), .HUS (Husqvarna), and many others.
    `,
    imageGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
  },
  {
    id: 2,
    title: 'Why Vector Art is Essential for Scalable Printing',
    category: 'Vector Art',
    author: 'Bilal Studio Team',
    date: 'August 8, 2026',
    readTime: '4 min read',
    content: `
      Have you ever tried to print a small logo onto a large banner, only to find it turns into a blurry, pixelated mess? This is the fundamental flaw of raster images (like JPGs and PNGs). Raster images are built using a fixed grid of colored squares (pixels). If you enlarge them, you just get bigger squares.

      This is where **Vector Art** saves the day.

      ### The Math Behind the Magic
      Vector files (such as .AI, .EPS, and .SVG) are fundamentally different. Instead of a grid of pixels, vectors use mathematical equations to define lines, curves, and shapes. Because it's math-based, a vector logo can be scaled up to fit a billboard or scaled down to fit a business card—and it will remain 100% razor-sharp with absolutely zero loss in quality.

      ### Screen Printing & Color Separation
      If you are in the screen printing or promotional products industry, vector art is mandatory. Screen printers require solid, distinct shapes to burn their screens. 
      
      At Bilal Digitizing, our vector conversion service doesn't just trace your image; we manually redraw it point-by-point. We ensure proper color separation, closed paths, and Pantone color matching so your design is perfectly prepped for DTG, screen printing, or vinyl cutting.

      ### Common Vector Formats
      - **.AI (Adobe Illustrator):** The industry standard working file.
      - **.EPS:** The most universal vector format, accepted by almost all print shops.
      - **.SVG:** Perfect for crisp, scalable web graphics.
      - **.PDF:** A versatile format that can contain vector data while being easily viewable by clients.
    `,
    imageGradient: 'linear-gradient(135deg, #ff7a00 0%, #ff9d40 100%)'
  },
  {
    id: 3,
    title: 'Custom Patches 101: PVC, Embroidered, and Leather Options',
    category: 'Custom Patches',
    author: 'Bilal Studio Team',
    date: 'August 5, 2026',
    readTime: '6 min read',
    content: `
      Custom patches are the ultimate branding tool. They add a premium, tactile element to apparel, bags, and hats that flat printing simply cannot match. But with so many manufacturing options available, how do you choose the right patch for your brand?

      Here is a breakdown of the three most popular patch types we manufacture:

      ### 1. Traditional Embroidered Patches
      The classic choice. Embroidered patches offer a traditional, textured look with high durability. They are perfect for military units, fire departments, scout troops, and vintage fashion brands. 
      - **Pros:** Classic look, cost-effective at scale, highly durable.
      - **Cons:** Cannot replicate extremely tiny text or photorealistic gradients.

      ### 2. PVC (Rubber) Patches
      If you want a rugged, modern, and tactical look, PVC is the answer. Made from soft, flexible rubber, these patches can be molded in 2D or 3D. They are entirely waterproof and will never fade, fray, or crack.
      - **Pros:** Unmatched durability, waterproof, modern 3D aesthetic, crisp text.
      - **Cons:** Slightly higher setup cost (requires a metal mold), heavier than woven patches.

      ### 3. Custom Leather Patches
      Nothing says "premium" quite like a debossed leather patch. Widely used on high-end trucker hats, denim, and outdoor gear. We offer both genuine top-grain leather and cruelty-free faux leather (leatherette). Designs are typically laser-engraved or heat-stamped (debossed) into the surface.
      - **Pros:** High-end rustic aesthetic, excellent for subtle branding.
      - **Cons:** Limited to monochromatic (single color) designs; not ideal for washing machines.

      ### Choosing the Right Backing
      The patch itself is only half the equation. You must also choose how to attach it:
      - **Sew-On:** The most permanent solution.
      - **Iron-On (Heat Seal):** Quick and easy application for casual wear.
      - **Velcro (Hook & Loop):** Perfect for tactical gear, uniforms, and modular fashion where patches need to be swapped frequently.
    `,
    imageGradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
  }
];

export default function BlogsPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* Blog Header Hero */}
      <div style={{ background: 'var(--navy-950)', padding: '6rem 1.5rem', textAlign: 'center', color: '#ffffff' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          Industry <span style={{ color: 'var(--orange-500)' }}>Insights</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--navy-200)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
          Expert guides, technical deep-dives, and creative inspiration covering everything from commercial embroidery digitizing to scalable vector art and custom patch manufacturing.
        </p>
      </div>

      <div className="container" style={{ maxWidth: '1000px', margin: '-3rem auto 0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {blogPosts.map((post) => (
            <article 
              key={post.id} 
              style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 12px 35px rgba(15, 23, 42, 0.06)',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              {/* Decorative Image/Color Banner */}
              <div style={{ height: '180px', width: '100%', background: post.imageGradient, position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-20px', 
                  left: '2rem', 
                  background: 'var(--orange-500)', 
                  color: '#ffffff',
                  padding: '0.4rem 1.2rem',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
                }}>
                  {post.category}
                </div>
              </div>

              <div style={{ padding: '3rem 2.5rem 2.5rem 2.5rem' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h2>
                
                {/* Meta Information */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} /> {post.author}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} /> {post.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--orange-600)' }}>
                    <Tag size={16} /> {post.readTime}
                  </span>
                </div>

                {/* Article Content Rendered Safely */}
                <div 
                  style={{ 
                    color: 'var(--navy-800)', 
                    fontSize: '1.1rem', 
                    lineHeight: 1.8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
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
