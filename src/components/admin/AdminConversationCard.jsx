'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const AdminConversationCard = ({
  conversation,
  isActive,
  unreadCount = 0,
  threadInfo,
  onSelect,
  formatTime
}) => {
  if (!conversation) return null;

  const isUnread = unreadCount > 0 && !isActive;
  const lastMsg = (conversation.messages || [])[(conversation.messages || []).length - 1] || {};
  const lastTimeFormatted = formatTime ? formatTime(lastMsg.timestamp || lastMsg.created_at) : 'Just now';

  // Customer display details
  const customerName = threadInfo?.customerName || conversation.clientName || 'Customer';
  const customerEmail = threadInfo?.customerEmail || conversation.clientEmail || '';
  const isOrder = Boolean(threadInfo?.isOrder);
  const orderNum = threadInfo?.orderNum || '';
  const orderCount = conversation.orders?.length || (isOrder ? 1 : 0);

  // Message preview logic
  let previewText = 'No messages yet';
  if (lastMsg.text) {
    previewText = lastMsg.text;
  } else if (lastMsg.attachment || lastMsg.attachment_name || lastMsg.attachment_url) {
    previewText = `📎 ${lastMsg.attachment_name || lastMsg.attachment || 'Attachment'}`;
  } else if (lastMsg.offer_data || lastMsg.offer_id) {
    previewText = '📋 Custom Design Offer';
  }

  const isLastMsgFromAdmin = lastMsg.sender === 'admin';

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(conversation.id);
        }
      }}
      className={`admin-conversation-card ${isUnread ? 'is-unread' : 'is-read'} ${isActive ? 'is-active' : ''}`}
      style={{
        padding: '0.85rem 0.95rem',
        marginBottom: '0.5rem',
        borderRadius: '12px',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        // VIP Border Styling
        border: isActive
          ? '2px solid var(--color-primary, #ea580c)'
          : (isUnread ? '1.5px solid #93c5fd' : '1px solid var(--color-border, #e2e8f0)'),
        borderLeft: isActive
          ? '5px solid var(--color-primary, #ea580c)'
          : (isUnread ? '5px solid #2563eb' : '1px solid var(--color-border, #e2e8f0)'),
        // VIP Background Styling
        background: isActive
          ? 'var(--color-surface, #ffffff)'
          : (isUnread 
              ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.98) 0%, rgba(219, 234, 254, 0.65) 100%)' 
              : 'var(--color-surface, #ffffff)'),
        // VIP Shadow & Elevation
        boxShadow: isActive
          ? '0 4px 16px rgba(234, 88, 12, 0.16)'
          : (isUnread 
              ? '0 3px 12px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
              : '0 1px 3px rgba(0, 0, 0, 0.02)')
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isUnread 
            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
            : 'var(--color-subtle, #f8fafc)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isUnread 
            ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.98) 0%, rgba(219, 234, 254, 0.65) 100%)' 
            : 'var(--color-surface, #ffffff)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {/* Avatar / Initials with status dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isOrder ? (
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isUnread ? '#1e3a8a' : 'var(--navy-900, #0f172a)',
              color: isUnread ? '#93c5fd' : 'var(--orange-400, #fb923c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.75rem',
              border: isUnread ? '2px solid #2563eb' : '1.5px solid var(--border-color, #cbd5e1)',
              boxShadow: isUnread ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}>
              {orderNum ? orderNum.replace('#', '').substring(0, 4).toUpperCase() : 'ORD'}
            </div>
          ) : (
            <img
              src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=${isUnread ? '1e3a8a' : '0f172a'}&color=fff&bold=true`}
              alt={customerName}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: isUnread ? '2.5px solid #2563eb' : '1.5px solid var(--border-color, #cbd5e1)',
                boxShadow: isUnread ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            />
          )}

          {/* Online status indicator */}
          <span style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: '11px',
            height: '11px',
            borderRadius: '50%',
            background: conversation.status === 'online' ? '#10b981' : '#94a3b8',
            border: '2px solid #ffffff'
          }} />
        </div>

        {/* Content Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row: Customer Name & Timestamp */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: isUnread ? 900 : 700,
              color: isUnread ? '#1e3a8a' : 'var(--color-text-primary, #0f172a)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              letterSpacing: isUnread ? '-0.01em' : 'normal'
            }}>
              <span>{customerName}</span>
              {isUnread && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    flexShrink: 0,
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.25)'
                  }}
                  title="Unread message"
                />
              )}
            </div>

            <span style={{
              fontSize: '0.7rem',
              color: isUnread ? '#2563eb' : 'var(--text-muted, #64748b)',
              fontWeight: isUnread ? 800 : 500,
              flexShrink: 0,
              marginLeft: '0.4rem'
            }}>
              {lastTimeFormatted}
            </span>
          </div>

          {/* Subtitle row: Customer Email & Orders Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            {customerEmail && (
              <span style={{
                fontSize: '0.725rem',
                color: isUnread ? '#1e40af' : 'var(--navy-700, #334155)',
                fontWeight: isUnread ? 700 : 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '140px'
              }}>
                {customerEmail}
              </span>
            )}
            {orderCount > 0 && (
              <span style={{
                fontSize: '0.65rem',
                background: isUnread ? '#dbeafe' : '#f1f5f9',
                color: isUnread ? '#1e40af' : '#475569',
                border: isUnread ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                fontWeight: 800,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <ShoppingBag size={10} />
                <span>{orderCount} {orderCount === 1 ? 'Job' : 'Jobs'}</span>
              </span>
            )}
          </div>

          {/* Bottom row: Message Snippet & Distinct Unread Pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{
              fontSize: '0.8rem',
              color: isUnread ? '#0f172a' : 'var(--text-muted, #64748b)',
              fontWeight: isUnread ? 800 : 400,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              lineHeight: 1.3
            }}>
              {isLastMsgFromAdmin && (
                <span style={{ color: 'var(--color-primary, #ea580c)', fontWeight: 700 }}>You: </span>
              )}
              {previewText}
            </p>

            {/* VIP UNREAD BADGE PILL */}
            {isUnread && (
              <span
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.45)',
                  letterSpacing: '0.02em'
                }}
              >
                {unreadCount > 9 ? '9+' : `${unreadCount} new`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConversationCard;
