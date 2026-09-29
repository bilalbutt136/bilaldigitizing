'use client';

import React from 'react';
import {
  Headphones,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Volume2,
  VolumeX
} from 'lucide-react';

function CustomerChatHeader({
  chatType = 'inbox',
  isAudioEnabled,
  onToggleSound,
  onRefresh
}) {
  const isSupport = chatType === 'support';

  return (
    <header className="customer-chat-header">
      <div className="customer-chat-header-identity">
        <div className="customer-chat-header-avatar" aria-hidden="true">
          {isSupport ? <Headphones size={20} /> : <MessageSquare size={20} />}
        </div>

        <div className="customer-chat-header-copy">
          <div className="customer-chat-header-title-row">
            <h3>{isSupport ? 'Studio Support' : 'Studio Inbox'}</h3>
            <ShieldCheck size={15} aria-label="Verified studio conversation" />
          </div>
          <p>
            {isSupport
              ? 'Private support for orders, files, and revisions'
              : 'Private workspace for quotes, artwork, and custom offers'}
          </p>
        </div>
      </div>

      <div className="customer-chat-header-actions">
        <button
          type="button"
          className={'customer-chat-icon-button' + (isAudioEnabled ? ' is-active' : '')}
          onClick={onToggleSound}
          aria-label={isAudioEnabled ? 'Mute message sounds' : 'Enable message sounds'}
          title={isAudioEnabled ? 'Mute message sounds' : 'Enable message sounds'}
        >
          {isAudioEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        <button
          type="button"
          className="customer-chat-icon-button"
          onClick={onRefresh}
          aria-label="Refresh conversation"
          title="Refresh conversation"
        >
          <RefreshCw size={17} />
        </button>
      </div>
    </header>
  );
}

export default React.memo(CustomerChatHeader);
