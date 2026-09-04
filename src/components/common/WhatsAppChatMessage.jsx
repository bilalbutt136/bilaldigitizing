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
import { PdfPreviewModal } from './PdfPreviewModal';

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
  const [showPdfModal, setShowPdfModal] = useState(false);
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

  // Extract or construct offer object from all possible sources
  let offerObj = message.offer_data || message.offer || message.metadata?.offer || message.metadata?.offer_data || (message.type === 'custom_offer' && message.metadata ? message.metadata : null);
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
  if (!offerObj && message.attachment && typeof message.attachment === 'string' && message.attachment.trim().startsWith('{') && (message.attachment.includes('"title"') || message.attachment.includes('"price"'))) {
    try {
      offerObj = JSON.parse(message.attachment);
    } catch {}
  }

  // 3. Fallback: If message.type is custom_offer or starts with 📋 Custom Offer: or has offer_id
  if (!offerObj && (message.type === 'custom_offer' || message.type === 'offer' || message.offer_id || (message.text && message.text.includes('Custom Offer:')))) {
    const rawText = message.text || '';
    const titleMatch = rawText.match(/Custom Offer:\s*([^(]+)/i);
    const priceMatch = rawText.match(/\(\$([0-9.]+)\)/);
    
    const parsedTitle = titleMatch ? titleMatch[1].trim() : (message.metadata?.title || 'Custom Design Offer');
    const parsedPrice = priceMatch ? parseFloat(priceMatch[1]) : (parseFloat(message.metadata?.price) || 25.00);
    const isVector = parsedTitle.toLowerCase().includes('vector');
    const isPatch = parsedTitle.toLowerCase().includes('patch');
    const serviceType = isVector ? 'Vector Artwork Conversion' : (isPatch ? 'Custom Patches' : 'Embroidery Digitizing');

    offerObj = {
      id: message.offer_id || message.metadata?.id || message.metadata?.offer_id || `off-${message.id || Date.now()}`,
      title: parsedTitle,
      description: message.metadata?.description || 'Production-ready embroidery or vector artwork files crafted to exact technical specifications.',
      service_type: message.metadata?.service_type || serviceType,
      price: parsedPrice,
      final_price: parsedPrice,
      discount_amount: 0,
      delivery_time_text: message.metadata?.delivery_time_text || `${message.metadata?.delivery_days || 1} Day`,
      delivery_days: parseInt(message.metadata?.delivery_days, 10) || 1,
      revisions_allowed: String(message.metadata?.revisions || message.metadata?.revisions_allowed || '2'),
      status: message.metadata?.status || 'pending',
      expires_at: message.metadata?.expires_at || new Date(Date.now() + 86400000).toISOString()
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

  let parsedAttach = null;
  const rawCandidate = message.attachment || (typeof message.attachment_name === 'string' && message.attachment_name.trim().startsWith('{') ? message.attachment_name : null);
  if (rawCandidate && typeof rawCandidate === 'string') {
    const trimmed = rawCandidate.trim();
    if (trimmed.startsWith('{')) {
      try { parsedAttach = JSON.parse(trimmed); } catch {}
    }
  } else if (rawCandidate && typeof rawCandidate === 'object') {
    parsedAttach = rawCandidate;
  }

  let fileName = '';
  if (message.attachment_name && typeof message.attachment_name === 'string' && !message.attachment_name.trim().startsWith('{')) {
    fileName = message.attachment_name;
  } else if (parsedAttach?.file_name || parsedAttach?.name || parsedAttach?.filename) {
    fileName = parsedAttach.file_name || parsedAttach.name || parsedAttach.filename;
  } else if (typeof message.attachment === 'string' && message.attachment.startsWith('http')) {
    fileName = decodeURIComponent(message.attachment.split('/').pop()?.split('?')[0] || '');
  } else if (typeof message.attachment === 'string' && !message.attachment.trim().startsWith('{')) {
    fileName = message.attachment;
  } else {
    fileName = 'document.pdf';
  }

  fileName = String(fileName || 'document.pdf').replace(/[/\\?%*:|"<>]/g, '_').trim();

  let fileUrl = 
    message.attachment_url || 
    parsedAttach?.file_url || 
    parsedAttach?.url || 
    (typeof message.attachment === 'string' && !message.attachment.trim().startsWith('{') ? message.attachment.trim() : null);

  const rawSize = message.attachment_size || parsedAttach?.file_size || parsedAttach?.size;
  const fileSize = rawSize ? (typeof rawSize === 'number' ? `${Math.round(rawSize / 1024)} KB` : (String(rawSize).match(/^\d+$/) ? `${Math.round(Number(rawSize) / 1024)} KB` : rawSize)) : 'PDF Document';
  const fileCategory = getFileCategory(fileName, fileUrl);
  const replyTo = message.reply_to;

  const effectiveUrl = fileUrl || null;

  const handleDownload = (e, customUrl, customName) => {
    e?.stopPropagation();
    const targetUrl = customUrl || effectiveUrl;
    const targetName = customName || fileName || 'download.pdf';
    if (!targetUrl) return;
    downloadFileDirectly(targetUrl, targetName);
  };

  const handleOpenPdf = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!effectiveUrl) return;
    setShowPdfModal(true);
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
        <span>
          {senderDisplayName || (resolvedIsMe ? 'You' : (message.sender_name || (message.sender === 'admin' ? 'Support' : (clientName || 'Customer'))))}
        </span>
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
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
            : '#ffffff',
          color: resolvedIsMe ? '#ffffff' : '#0f172a',
          border: resolvedIsMe 
            ? 'none' 
            : (!isMessageRead 
                ? '1.5px solid #86efac' 
                : '1.5px solid #e2e8f0'),
          borderLeft: (!resolvedIsMe && !isMessageRead)
            ? '4.5px solid #059669'
            : (resolvedIsMe ? 'none' : '1.5px solid #e2e8f0'),
          boxShadow: resolvedIsMe
            ? '0 3px 10px rgba(5, 150, 105, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)',
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
              background: resolvedIsMe ? 'rgba(0, 0, 0, 0.15)' : 'var(--color-primary-light)',
              borderLeft: `4px solid ${resolvedIsMe ? '#ffffff' : 'var(--color-primary)'}`,
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
              color: resolvedIsMe ? '#ffffff' : 'var(--color-primary)',
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
              background: resolvedIsMe ? 'rgba(0, 0, 0, 0.12)' : 'var(--bg-subtle, #f8fafc)',
              border: `1.5px solid ${resolvedIsMe ? 'rgba(255,255,255,0.2)' : 'var(--color-border, #e2e8f0)'}`,
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
                  color: resolvedIsMe ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {fileName || 'Document.pdf'}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: resolvedIsMe ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted, #64748b)',
                  marginTop: '0.1rem'
                }}>
                  {fileSize || 'PDF Document'}
                </div>
              </div>
            </div>

            {/* Actions for PDF */}
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              {effectiveUrl && (
                <button
                  type="button"
                  onClick={handleOpenPdf}
                  title="Open PDF preview"
                  style={{
                    background: resolvedIsMe ? 'rgba(255,255,255,0.2)' : '#ffffff',
                    color: resolvedIsMe ? '#ffffff' : 'var(--color-primary, #ea580c)',
                    border: `1px solid ${resolvedIsMe ? 'rgba(255,255,255,0.3)' : 'var(--color-border, #e2e8f0)'}`,
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
                  background: resolvedIsMe ? '#ffffff' : 'var(--color-primary, #ff7a00)',
                  color: resolvedIsMe ? 'var(--color-primary, #ea580c)' : '#ffffff',
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
              background: resolvedIsMe ? 'rgba(0, 0, 0, 0.12)' : 'var(--bg-subtle, #f8fafc)',
              border: `1.5px solid ${resolvedIsMe ? 'rgba(255,255,255,0.2)' : 'var(--color-border, #e2e8f0)'}`,
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

            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              {(fileCategory === 'document' || fileName.toLowerCase().endsWith('.pdf') || (fileUrl && fileUrl.toLowerCase().includes('.pdf'))) && (
                <button
                  type="button"
                  onClick={(e) => handleOpenPdf(e)}
                  title="View PDF"
                  style={{
                    background: isMe ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    color: isMe ? '#ffffff' : '#0f172a',
                    border: isMe ? '1px solid rgba(255,255,255,0.4)' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  👁️ View
                </button>
              )}

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
          justifyContent: (message.is_autopilot || message.auto_pilot) ? 'space-between' : 'flex-end',
          gap: '0.35rem',
          fontSize: '0.65rem',
          color: resolvedIsMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted, #94a3b8)',
          marginTop: '0.35rem'
        }}>
          {(message.is_autopilot || message.auto_pilot) && (
            <span 
              title="Generated and sent automatically by Auto-Pilot AI"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.6rem',
                fontWeight: 800,
                background: resolvedIsMe ? 'rgba(255, 255, 255, 0.22)' : 'rgba(16, 185, 129, 0.15)',
                color: resolvedIsMe ? '#ffffff' : '#059669',
                border: resolvedIsMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>🤖 Auto-Pilot AI</span>
            </span>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
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

      {showPdfModal && effectiveUrl && (
        <PdfPreviewModal
          isOpen={showPdfModal}
          fileUrl={effectiveUrl}
          fileName={fileName || 'Document.pdf'}
          fileSize={fileSize}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
