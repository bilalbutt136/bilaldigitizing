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
import OfferCardMessage from './OfferCardMessage';

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

const defaultFormatTime = (raw) => {
  if (!raw) return 'Just now';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Just now';
  }
};

/**
 * Reusable WhatsApp-style Chat Message Bubble with:
 * - Rich media previews (Images, PDFs, Vector/Embroidery files)
 * - Quoted replies (WhatsApp style)
 * - Direct download actions
 * - Interactive lightbox preview modal
 * - Hover toolbar (Reply, Zoom, Download)
 * - Custom Offer Cards
 * - Distinct Read vs Unread color boxes on both Customer & Admin sides
 */
export default function WhatsAppChatMessage({
  message,
  isMe,
  isClient,
  senderDisplayName = '',
  clientName = '',
  onReply = () => {},
  formatTime,
  themePreset = null,
  onOrderClick = () => {}
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!message) return null;

  const displayTime = (formatTime && typeof formatTime === 'function') 
    ? formatTime(message.timestamp || message.created_at) 
    : defaultFormatTime(message.timestamp || message.created_at);

  const resolvedIsMe = isMe !== undefined && isMe !== null
    ? Boolean(isMe)
    : (isClient !== undefined && isClient !== null 
        ? Boolean(isClient) 
        : (message.sender === 'client' ? themePreset !== 'admin' : themePreset === 'admin'));

  const isMessageRead = message.is_read === true || message.is_read === 'true';

  // Extract or construct offer object
  let offerObj = message.offer_data || message.offer || null;
  if (typeof offerObj === 'string') {
    try {
      offerObj = JSON.parse(offerObj);
    } catch {
      offerObj = null;
    }
  }

  // 1. Check embedded [OFFER_DATA:...] in text
  if (!offerObj && message.text && message.text.includes('[OFFER_DATA:')) {
    try {
      const match = message.text.match(/\[OFFER_DATA:(\{.*?\})\]/s);
      if (match && match[1]) {
        offerObj = JSON.parse(match[1]);
      }
    } catch {}
  }

  // 2. Check JSON in attachment
  if (!offerObj && message.attachment && typeof message.attachment === 'string' && message.attachment.trim().startsWith('{') && message.attachment.includes('"title"')) {
    try {
      offerObj = JSON.parse(message.attachment);
    } catch {}
  }

  // 3. Fallback: If offer_data wasn't attached, but message is a Custom Offer (starts with 📋 Custom Offer: or has offer_id)
  if (!offerObj && (message.offer_id || (message.text && message.text.includes('Custom Offer:')))) {
    const rawText = message.text || '';
    const titleMatch = rawText.match(/Custom Offer:\s*([^(]+)/i);
    const priceMatch = rawText.match(/\(\$([0-9.]+)\)/);
    
    const parsedTitle = titleMatch ? titleMatch[1].trim() : 'Custom Design Offer';
    const parsedPrice = priceMatch ? parseFloat(priceMatch[1]) : 25.00;
    const isVector = parsedTitle.toLowerCase().includes('vector');
    const isPatch = parsedTitle.toLowerCase().includes('patch');
    const serviceType = isVector ? 'Vector Artwork Conversion' : (isPatch ? 'Custom Patches' : 'Embroidery Digitizing');

    offerObj = {
      id: message.offer_id || `off-${message.id || Date.now()}`,
      title: parsedTitle,
      description: 'Production-ready embroidery or vector artwork files crafted to exact technical specifications.',
      service_type: serviceType,
      price: parsedPrice,
      final_price: parsedPrice,
      discount_amount: 0,
      delivery_time_text: '1 Day',
      delivery_days: 1,
      revisions_allowed: '2',
      status: 'sent',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    };
  }

  // Render Custom Offer Card
  if (offerObj) {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: resolvedIsMe ? 'flex-end' : 'flex-start',
          maxWidth: '92%',
          alignSelf: resolvedIsMe ? 'flex-end' : 'flex-start',
          position: 'relative',
          margin: '0.4rem 0'
        }}
      >
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
          <span>{senderDisplayName || (resolvedIsMe ? 'You' : (message.sender_name || 'Studio Support'))}</span>
          <span>•</span>
          <span>{displayTime}</span>
        </div>
        <OfferCardMessage
          offer={offerObj}
          messageId={message.id}
          isMe={resolvedIsMe}
          isAdmin={themePreset === 'admin'}
          onOrderClick={onOrderClick}
        />
      </div>
    );
  }

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
        alignItems: resolvedIsMe ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        alignSelf: resolvedIsMe ? 'flex-end' : 'flex-start',
        position: 'relative',
        margin: '0.25rem 0'
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
        <span style={{ fontWeight: (!resolvedIsMe && !isMessageRead) ? 900 : 700, color: (!resolvedIsMe && !isMessageRead) ? 'var(--orange-600, #ea580c)' : undefined }}>
          {senderDisplayName || (resolvedIsMe ? 'You' : (message.sender_name || (message.sender === 'admin' ? 'Support' : (clientName || 'Customer'))))}
        </span>
        {!resolvedIsMe && !isMessageRead && (
          <span style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
            color: '#ffffff',
            fontSize: '0.58rem',
            fontWeight: 900,
            padding: '0.05rem 0.4rem',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            ● UNREAD
          </span>
        )}
        <span>•</span>
        <span>{displayTime}</span>
      </div>

      {/* Main Message Bubble */}
      <div
        style={{
          position: 'relative',
          padding: (fileCategory === 'image' && fileUrl && !message.text) ? '0.35rem' : '0.75rem 1rem',
          borderRadius: resolvedIsMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: resolvedIsMe 
            ? (isMessageRead
                ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' 
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)')
            : (!isMessageRead 
                ? '#fffbf5' 
                : 'var(--color-surface, #ffffff)'),
          color: resolvedIsMe ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary, #0f172a)',
          border: resolvedIsMe 
            ? 'none' 
            : (!isMessageRead 
                ? '1.5px solid #fed7aa' 
                : '1.5px solid var(--color-border, #e2e8f0)'),
          borderLeft: (!resolvedIsMe && !isMessageRead)
            ? '4.5px solid #ea580c'
            : (resolvedIsMe ? 'none' : '1.5px solid var(--color-border, #e2e8f0)'),
          boxShadow: resolvedIsMe
            ? '0 3px 10px rgba(234, 88, 12, 0.22)'
            : (!isMessageRead 
                ? '0 4px 14px rgba(234, 88, 12, 0.12)' 
                : 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.04))'),
          fontSize: '0.88rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          minWidth: replyTo ? '220px' : 'auto',
          transition: 'all 0.2s ease'
        }}
      >
        {/* 1. WHATSAPP-STYLE QUOTED REPLY BOX */}
        {replyTo && (
          <div
            style={{
              background: resolvedIsMe ? 'rgba(0, 0, 0, 0.15)' : 'var(--bg-subtle, #f1f5f9)',
              borderLeft: `4px solid ${resolvedIsMe ? '#ffffff' : 'var(--color-primary, #ff7a00)'}`,
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
              color: resolvedIsMe ? '#ffffff' : 'var(--color-primary, #ea580c)',
              marginBottom: '0.15rem'
            }}>
              {replyTo.sender_name || 'Original Message'}
            </div>
            <div style={{
              color: resolvedIsMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted, #64748b)',
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
        {fileCategory !== 'image' && fileCategory !== 'pdf' && fileName && !fileName.trim().startsWith('{') && (!fileUrl || !fileUrl.startsWith('{')) && (
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
        {message.text && Boolean(message.text.replace(/\[OFFER_DATA:.*?\]/gs, '').trim()) && (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.text.replace(/\[OFFER_DATA:.*?\]/gs, '').trim()}
          </div>
        )}

        {/* Read Receipt & Clock Footer inside Bubble */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.35rem',
          fontSize: '0.65rem',
          color: resolvedIsMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted, #94a3b8)',
          marginTop: '0.35rem'
        }}>
          <Clock size={10} />
          <span>{displayTime}</span>
          {resolvedIsMe && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '0.2rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: isMessageRead ? '#7dd3fc' : 'rgba(255, 255, 255, 0.75)' }}>
                {isMessageRead ? 'Read' : 'Delivered'}
              </span>
              <CheckCheck size={13} style={{ color: isMessageRead ? '#38bdf8' : 'rgba(255,255,255,0.7)' }} />
            </span>
          )}
        </div>

        {/* 5. HOVER ACTION TOOLBAR (WhatsApp Style Reply button) */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              [resolvedIsMe ? 'left' : 'right']: '-10px',
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
