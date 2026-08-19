'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Reply, 
  ExternalLink, 
  CheckCheck, 
  Clock, 
  ZoomIn, 
  X, 
  Paperclip,
  Maximize2,
  FileCode,
  Layers,
  Archive,
  Image as ImageIcon
} from 'lucide-react';
import { downloadFileDirectly, openPdfInNewTab } from '../../utils/fileDownloader';

/**
 * Determines file category from URL or filename
 */
export function getFileCategory(fileName = '', fileUrl = '') {
  const combined = (fileName || fileUrl || '').toLowerCase();
  const ext = combined.split('?')[0].split('.').pop();

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['dst', 'pes', 'exp', 'emb', 'jef', 'xxx', 'hus', 'vp3'].includes(ext)) return 'embroidery';
  if (['ai', 'eps', 'svg', 'cdr', 'psd'].includes(ext)) return 'vector';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'document';
}

/**
 * Reusable WhatsApp-style Chat Message Bubble with:
 * - Rich media previews (Images, PDFs, Vector/Embroidery files)
 * - Quoted replies (WhatsApp style)
 * - Direct download actions
 * - Interactive lightbox preview modal
 * - Hover toolbar (Reply, Zoom, Download)
 */
export default function WhatsAppChatMessage({
  message,
  isMe = false,
  senderDisplayName = '',
  onReply = () => {},
  formatTime = (t) => t || 'Just now',
  themePreset = null
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!message) return null;

  const fileName = message.attachment_name || message.attachment || '';
  const fileUrl = message.attachment_url || (typeof message.attachment === 'string' && message.attachment.startsWith('http') ? message.attachment : null);
  const fileCategory = getFileCategory(fileName, fileUrl);
  const replyTo = message.reply_to;

  const handleDownload = (e, customUrl, customName) => {
    e?.stopPropagation();
    const targetUrl = customUrl || fileUrl;
    const targetName = customName || fileName || 'download';
    if (!targetUrl) return;
    downloadFileDirectly(targetUrl, targetName);
  };

  const handleOpenPdf = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!fileUrl) return;
    openPdfInNewTab(fileUrl, fileName || 'document.pdf');
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        position: 'relative',
        margin: '0.2rem 0'
      }}
    >
      {/* Sender Label & Timestamp Top Header */}
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'var(--text-muted, #64748b)',
        marginBottom: '0.25rem',
        padding: '0 0.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <span>{senderDisplayName || (isMe ? 'You' : (message.sender_name || 'Studio Support'))}</span>
        <span>•</span>
        <span>{formatTime(message.timestamp || message.created_at)}</span>
      </div>

      {/* Main Message Bubble */}
      <div
        style={{
          position: 'relative',
          padding: (fileCategory === 'image' && fileUrl && !message.text) ? '0.35rem' : '0.75rem 1rem',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isMe 
            ? 'linear-gradient(135deg, var(--color-secondary, #ff7a00) 0%, var(--color-primary, #ea580c) 100%)' 
            : 'var(--color-surface, #ffffff)',
          color: isMe ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary, #0f172a)',
          border: isMe ? 'none' : '1.5px solid var(--color-border, #e2e8f0)',
          boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.04))',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          minWidth: replyTo ? '220px' : 'auto'
        }}
      >
        {/* 1. WHATSAPP-STYLE QUOTED REPLY BOX */}
        {replyTo && (
          <div
            style={{
              background: isMe ? 'rgba(0, 0, 0, 0.15)' : 'var(--bg-subtle, #f1f5f9)',
              borderLeft: `4px solid ${isMe ? '#ffffff' : 'var(--color-primary, #ff7a00)'}`,
              borderRadius: '8px',
              padding: '0.4rem 0.65rem',
              marginBottom: '0.55rem',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontWeight: 800,
              fontSize: '0.72rem',
              color: isMe ? '#ffffff' : 'var(--color-primary, #ea580c)',
              marginBottom: '0.15rem'
            }}>
              {replyTo.sender_name || 'Original Message'}
            </div>
            <div style={{
              color: isMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted, #64748b)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '280px'
            }}>
              {replyTo.text || (replyTo.attachment ? `📎 ${replyTo.attachment}` : 'Message')}
            </div>
          </div>
        )}

        {/* 2. INLINE IMAGE PREVIEW (WhatsApp Style) */}
        {fileCategory === 'image' && fileUrl && (
          <div style={{ marginBottom: message.text ? '0.6rem' : '0' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '260px',
                cursor: 'pointer',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={fileUrl}
                alt={fileName || 'Image attachment'}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  display: 'block',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />

              {/* Overlay Hover Icon for Zoom & Download */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                display: 'flex',
                gap: '0.35rem'
              }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                  title="View full image"
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e)}
                  title="Download image"
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. DEDICATED PDF CARD PREVIEW (WhatsApp Style) */}
        {fileCategory === 'pdf' && (
          <div
            style={{
              background: isMe ? 'rgba(0, 0, 0, 0.12)' : 'var(--bg-subtle, #f8fafc)',
              border: `1.5px solid ${isMe ? 'rgba(255,255,255,0.2)' : 'var(--color-border, #e2e8f0)'}`,
              borderRadius: '12px',
              padding: '0.65rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: message.text ? '0.6rem' : '0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: isMe ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {fileName || 'Document.pdf'}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted, #64748b)',
                  marginTop: '0.1rem'
                }}>
                  {message.attachment_size || 'PDF Document'}
                </div>
              </div>
            </div>

            {/* Actions for PDF */}
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              {fileUrl && (
                <button
                  type="button"
                  onClick={handleOpenPdf}
                  title="Open PDF in new tab"
                  style={{
                    background: isMe ? 'rgba(255,255,255,0.2)' : '#ffffff',
                    color: isMe ? '#ffffff' : 'var(--color-primary, #ea580c)',
                    border: `1px solid ${isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-border, #e2e8f0)'}`,
                    borderRadius: '6px',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Eye size={12} /> Open
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleDownload(e)}
                title="Download PDF"
                style={{
                  background: isMe ? '#ffffff' : 'var(--color-primary, #ff7a00)',
                  color: isMe ? 'var(--color-primary, #ea580c)' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.55rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        )}

        {/* 4. OTHER ATTACHMENT TYPES (Embroidery, Vector, Zip, etc.) */}
        {fileCategory !== 'image' && fileCategory !== 'pdf' && fileName && (
          <div
            style={{
              background: isMe ? 'rgba(0, 0, 0, 0.12)' : 'var(--bg-subtle, #f8fafc)',
              border: `1.5px solid ${isMe ? 'rgba(255,255,255,0.2)' : 'var(--color-border, #e2e8f0)'}`,
              borderRadius: '12px',
              padding: '0.65rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: message.text ? '0.6rem' : '0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: fileCategory === 'embroidery' ? '#fae8ff' : (fileCategory === 'vector' ? '#e0f2fe' : '#f1f5f9'),
                color: fileCategory === 'embroidery' ? '#86198f' : (fileCategory === 'vector' ? '#0369a1' : '#475569'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.68rem',
                flexShrink: 0,
                textTransform: 'uppercase'
              }}>
                {fileName.split('.').pop() || 'FILE'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: isMe ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {fileName}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted, #64748b)',
                  marginTop: '0.1rem'
                }}>
                  {message.attachment_size || 'Production Asset'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleDownload(e)}
              title="Download file"
              style={{
                background: isMe ? '#ffffff' : 'var(--color-primary, #ff7a00)',
                color: isMe ? 'var(--color-primary, #ea580c)' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Download size={13} />
            </button>
          </div>
        )}

        {/* Message Text */}
        {message.text && (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </div>
        )}

        {/* Read Receipt & Clock Footer inside Bubble */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.25rem',
          fontSize: '0.65rem',
          color: isMe ? 'rgba(255, 255, 255, 0.75)' : 'var(--color-text-muted, #94a3b8)',
          marginTop: '0.35rem'
        }}>
          <Clock size={10} />
          <span>{formatTime(message.timestamp || message.created_at)}</span>
          {isMe && (
            <CheckCheck size={13} style={{ color: message.is_read ? '#60a5fa' : 'rgba(255,255,255,0.7)', marginLeft: '0.2rem' }} />
          )}
        </div>

        {/* 5. HOVER ACTION TOOLBAR (WhatsApp Style Reply button) */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              [isMe ? 'left' : 'right']: '-10px',
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: '20px',
              padding: '0.2rem 0.4rem',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              zIndex: 10
            }}
          >
            <button
              type="button"
              onClick={() => onReply(message)}
              title="Reply to this message"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-primary, #0f172a)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                borderRadius: '4px'
              }}
            >
              <Reply size={13} style={{ color: 'var(--color-primary, #ff7a00)' }} />
            </button>

            {fileUrl && (
              <button
                type="button"
                onClick={(e) => handleDownload(e)}
                title="Download Attachment"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-primary, #0f172a)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                  borderRadius: '4px'
                }}
              >
                <Download size={13} />
              </button>
            )}
          </div>
        )}

      </div>

      {/* LIGHTBOX ZOOM MODAL FOR IMAGES */}
      {isLightboxOpen && fileUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute',
              top: '-45px',
              right: 0,
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={(e) => handleDownload(e)}
                className="btn btn-primary-orange btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}
              >
                <Download size={14} /> Download Image
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <img
              src={fileUrl}
              alt={fileName || 'Image preview'}
              style={{
                maxWidth: '90vw',
                maxHeight: '82vh',
                borderRadius: '16px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                objectFit: 'contain'
              }}
            />
            {fileName && (
              <div style={{ color: '#ffffff', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                {fileName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
