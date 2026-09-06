'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { useChatInbox } from '../../hooks/useChatInbox';
import { 
  Search, 
  Send, 
  Paperclip, 
  CheckCheck, 
  Clock, 
  User, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Zap,
  Tag,
  CornerDownRight
} from 'lucide-react';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';

export const AdminChatInbox = () => {
  const { authUser, showToast, setSelectedOrderForDrawer, setActiveAdminTab } = useAppState();

  const currentUser = useMemo(() => ({
    id: authUser?.id || 'admin-master',
    email: authUser?.email || 'admin@bdigitizing-pro.com',
    name: authUser?.user_metadata?.full_name || 'Studio Support',
    role: 'admin'
  }), [authUser]);

  const {
    conversations,
    messages,
    activeChatId,
    setActiveChatId,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    isTypingRemote,
    typingUser,
    messagesEndRef,
    loadInbox,
    loadMessages,
    sendMessage,
    sendTyping
  } = useChatInbox({
    currentUser,
    showToast
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'orders' | 'support' | 'unread'
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingDebounceRef = useRef(null);

  // Active Conversation Object
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return (conversations || []).filter(c => {
      // Tab filter
      if (filterTab === 'orders' && c.type !== 'order' && !c.order_id) return false;
      if (filterTab === 'support' && c.type !== 'support' && c.order_id) return false;
      if (filterTab === 'unread' && (!c.unread_count || c.unread_count <= 0)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (c.title || '').toLowerCase();
        const clientName = (c.client_name || '').toLowerCase();
        const clientEmail = (c.client_email || '').toLowerCase();
        const preview = (c.last_message_preview || '').toLowerCase();
        const orderId = (c.order_id || '').toLowerCase();
        return title.includes(q) || clientName.includes(q) || clientEmail.includes(q) || preview.includes(q) || orderId.includes(q);
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  // Handle Input Change & Typing Broadcast
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Send typing broadcast
    sendTyping(true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  // File Upload Handler (Cloudinary / Supabase Storage)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      for (let file of Array.from(files)) {
        if (file.size > 25 * 1024 * 1024) {
          if (showToast) showToast('File size exceeds 25MB limit', 'error');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'client-uploads');

        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          const fileUrl = data.url || data.secure_url || data.public_url;
          if (fileUrl) {
            setAttachments(prev => [...prev, {
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              url: fileUrl,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              size: file.size
            }]);
          }
        } else {
          // Fallback direct upload signature
          if (showToast) showToast(`Uploaded ${file.name}`, 'info');
        }
      }
    } catch (err) {
      console.warn('[handleFileUpload error]:', err);
      if (showToast) showToast('File upload failed', 'error');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send Message Handler
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (isSending || (!inputText.trim() && attachments.length === 0)) return;

    const draftText = inputText;
    const draftAttachments = [...attachments];
    const draftReply = replyingTo;

    setInputText('');
    setAttachments([]);
    setReplyingTo(null);

    const success = await sendMessage({
      content: draftText,
      attachments: draftAttachments,
      replyTo: draftReply ? {
        id: draftReply.id,
        sender_name: draftReply.sender_name,
        sender_role: draftReply.sender_role,
        content: draftReply.content
      } : null
    });

    if (!success) {
      // Restore draft if failed
      setInputText(draftText);
      setAttachments(draftAttachments);
      setReplyingTo(draftReply);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick Preset Replies
  const quickReplies = [
    "Hi! Welcome to Bilal Digitizing. How can we assist you today?",
    "We've received your request and our design team is working on your file.",
    "Your digitized file is complete and ready for download!",
    "Could you please clarify the target dimensions and fabric type for this design?"
  ];

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const isToday = now.toDateString() === d.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="flex h-full w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT PANEL: CONVERSATION LIST (SIDEBAR) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-80 md:w-96 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-md">
        
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20 text-white">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 leading-tight tracking-tight">Studio Inbox</h2>
              <span className="text-[11px] font-semibold text-slate-400">Live 24/7 Dispatch Hub</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => loadInbox(false)}
            title="Refresh Inbox"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw size={14} className={isLoadingConversations ? "animate-spin text-orange-400" : ""} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'orders', label: 'Orders' },
              { id: 'support', label: 'Support' },
              { id: 'unread', label: 'Unread' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  filterTab === tab.id 
                    ? 'bg-orange-600 text-white shadow-sm' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 custom-scrollbar">
          {isLoadingConversations && filteredConversations.length === 0 ? (
            <div className="p-3 space-y-2.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-xl animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-800 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-800 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.id === activeChatId;
              const hasUnread = (conv.unread_count || 0) > 0;
              const isOrderThread = Boolean(conv.order_id);

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  role="button"
                  tabIndex={0}
                  className={`p-3 cursor-pointer transition flex gap-3 items-start relative ${
                    isActive 
                      ? 'bg-orange-600/10 border-l-4 border-orange-500 text-slate-100' 
                      : 'hover:bg-slate-900/70 text-slate-300'
                  }`}
                >
                  {/* Customer Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 uppercase shadow-md ${
                    isOrderThread 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' 
                      : 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                  }`}>
                    {(conv.client_name || 'C').charAt(0)}
                  </div>

                  {/* Body Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={`text-xs truncate ${hasUnread ? 'font-black text-white' : 'font-bold text-slate-200'}`}>
                        {conv.client_name || 'Customer'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>

                    {isOrderThread && (
                      <span className="inline-block px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800/60 rounded text-[9px] font-extrabold mb-1">
                        Order #{conv.order_id?.replace(/^#+/, '')}
                      </span>
                    )}

                    <p className={`text-xs truncate leading-relaxed ${hasUnread ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
                      {conv.last_message_preview || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread Badge Counter */}
                  {hasUnread && (
                    <span className="px-1.5 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL: ACTIVE CHAT CONVERSATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-950/40 min-w-0 relative">
        
        {activeConversation ? (
          <>
            {/* Active Thread Top Bar */}
            <div className="p-3.5 px-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                  {(activeConversation.client_name || 'C').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{activeConversation.client_name || 'Customer Inquiry'}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      Live
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {activeConversation.client_email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} /> {activeConversation.client_email}
                      </span>
                    )}
                    {activeConversation.order_id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (setSelectedOrderForDrawer) setSelectedOrderForDrawer({ id: activeConversation.order_id });
                        }}
                        className="text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                      >
                        Order #{activeConversation.order_id.replace(/^#+/, '')} <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadMessages(activeChatId)}
                  className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                  title="Reload Messages"
                >
                  <RefreshCw size={14} className={isLoadingMessages ? "animate-spin text-orange-400" : ""} />
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                  <span className="text-xs font-semibold">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                    <MessageSquare size={24} className="text-slate-400 opacity-40" />
                  </div>
                  <span className="text-xs font-semibold">This conversation is fresh and ready for messages.</span>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdminMsg = msg.sender_role === 'admin' || msg.sender_role === 'staff';
                  const isOpt = msg.is_optimistic;
                  const hasError = Boolean(msg.error);

                  return (
                    <div 
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender Meta Tag */}
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-slate-400">
                        <span>{isAdminMsg ? 'Studio Support' : msg.sender_name || 'Customer'}</span>
                        <span>•</span>
                        <span>{formatTime(msg.created_at)}</span>
                      </div>

                      {/* Reply Reference Quote */}
                      {msg.reply_to && (
                        <div className={`mb-1 p-2 rounded-lg text-xs border-l-2 bg-slate-900/90 text-slate-300 max-w-md ${
                          isAdminMsg ? 'border-orange-500' : 'border-blue-500'
                        }`}>
                          <span className="text-[10px] font-bold text-slate-400 block">
                            Replying to {msg.reply_to.sender_name}:
                          </span>
                          <span className="truncate block opacity-80">{msg.reply_to.content}</span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div className={`relative max-w-lg md:max-w-xl rounded-2xl p-3.5 text-xs shadow-md leading-relaxed ${
                        isAdminMsg 
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none' 
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments List */}
                        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/10">
                            {msg.attachments.map((att, aIdx) => {
                              const isImg = att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
                              return isImg ? (
                                <div 
                                  key={aIdx} 
                                  onClick={() => setLightboxImg(att.url)}
                                  className="cursor-pointer rounded-xl overflow-hidden border border-white/20 max-w-xs hover:opacity-90 transition"
                                >
                                  <img src={att.url} alt={att.name || 'attachment'} className="max-h-48 w-full object-cover" />
                                </div>
                              ) : (
                                <a 
                                  key={aIdx} 
                                  href={att.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white text-[11px] font-bold transition"
                                >
                                  <FileText size={14} />
                                  <span className="truncate flex-1">{att.name || 'Attached File'}</span>
                                  <ExternalLink size={12} />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Status Check / Error / Loading */}
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-75 text-[10px]">
                          {hasError ? (
                            <span className="text-red-300 font-bold flex items-center gap-0.5">
                              <AlertCircle size={10} /> Failed to send
                            </span>
                          ) : isOpt ? (
                            <Clock size={10} className="animate-spin" />
                          ) : (
                            <CheckCheck size={12} />
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons (Reply) */}
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 mt-1 text-[10px] font-bold text-slate-400 hover:text-orange-400 flex items-center gap-1 transition"
                      >
                        <CornerDownRight size={10} /> Reply
                      </button>
                    </div>
                  );
                })
              )}
              
              {/* Typing Indicator */}
              {isTypingRemote && (
                <div className="flex items-center gap-2 text-xs text-orange-400 font-bold animate-pulse px-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{typingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Replying Banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <CornerDownRight size={13} className="text-orange-400 flex-shrink-0" />
                  <span className="font-bold text-orange-400">{replyingTo.sender_name}:</span>
                  <span className="truncate opacity-80">{replyingTo.content}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Attachments Staging Bar */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700">
                    <FileText size={12} className="text-orange-400" />
                    <span className="truncate max-w-[120px] font-semibold">{att.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Preset Replies Toolbar */}
            <div className="px-4 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                <Sparkles size={11} /> Quick Replies:
              </span>
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(qr)}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-semibold rounded-md truncate max-w-[200px] whitespace-nowrap transition"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-end gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                className="p-2 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-xl transition"
                title="Attach Files"
              >
                {isUploadingFile ? <Loader2 size={18} className="animate-spin text-orange-400" /> : <Paperclip size={18} />}
              </button>

              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none max-h-32 custom-scrollbar"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && attachments.length === 0)}
                className="p-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition flex items-center justify-center flex-shrink-0"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="p-5 bg-slate-900/80 rounded-3xl border border-slate-800 mb-3 shadow-inner">
              <MessageSquare size={36} className="text-orange-500/50" />
            </div>
            <h3 className="text-sm font-black text-slate-200 mb-1">Select a Conversation</h3>
            <p className="text-xs max-w-sm text-slate-400">
              Choose an active thread from the left inbox sidebar to respond to customer inquiries and order discussions.
            </p>
          </div>
        )}
      </div>

      {/* Artwork Lightbox Modal */}
      {lightboxImg && (
        <ArtworkLightboxModal
          isOpen={true}
          onClose={() => setLightboxImg(null)}
          imageUrl={lightboxImg}
          title="Attached Image Preview"
        />
      )}
    </div>
  );
};
