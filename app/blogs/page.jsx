'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, User, Tag } from 'lucide-react';
import { supabase } from '../../src/lib/supabase/client';

export default function BlogsPage() {
  // TODO: Fetch from public.blogs when the CMS endpoint is available
  const [blogPosts, setBlogPosts] = useState([]);

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
