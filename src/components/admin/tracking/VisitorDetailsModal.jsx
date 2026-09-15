'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Activity, 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Clock,
  Radio,
  Tag,
  Share2,
  Layers
} from 'lucide-react';

export const VisitorDetailsModal = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attribution' | 'device' | 'geo' | 'raw'

  if (!event) return null;

  // Extract synthesized telemetry
  const telemetry = event.telemetry || {};
  const isReturning = Boolean(telemetry.isReturningVisitor || (telemetry.visitCount && telemetry.visitCount > 1));
  const visitCount = telemetry.visitCount || 1;
  const eventName = event.event_name || 'PageView';
  const role = event.user_role || telemetry.userRole || 'Guest Visitor';
  const pagePath = event.page_path || telemetry.pagePath || '/';
  const eventTime = event.event_time ? new Date(event.event_time).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  }) : 'Just now';

  const handleCopyRaw = () => {
    const rawString = JSON.stringify({
      ...event,
      telemetry
    }, null, 2);
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeviceIcon = () => {
    const dev = (telemetry.deviceType || '').toLowerCase();
    if (dev === 'mobile') return <Smartphone size={18} className="text-amber-500" />;
    if (dev === 'tablet') return <Tablet size={18} className="text-purple-500" />;
    return <Monitor size={18} className="text-blue-500" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Visitor & Event Telemetry</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {eventName}
                </span>
                {isReturning ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    Returning Visitor ({visitCount} visits)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    First-Time Visitor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recorded at {eventTime}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Identity', icon: <User size={15} /> },
            { id: 'attribution', label: 'Attribution & Ads', icon: <Share2 size={15} /> },
            { id: 'device', label: 'Device & Screen', icon: <Monitor size={15} /> },
            { id: 'geo', label: 'Geo & Network', icon: <MapPin size={15} /> },
            { id: 'raw', label: 'Raw Telemetry JSON', icon: <Code size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-3 font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          
          {/* TAB 1: OVERVIEW & IDENTITY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Visitor Status</div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {role}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isReturning ? `Visit #${visitCount}` : 'New visitor'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Traffic Channel</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {telemetry.trafficChannel || 'Direct'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {telemetry.trafficSource || 'Direct Navigation'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Device & OS</div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {getDeviceIcon()}
                    <span>{telemetry.os || 'Unknown OS'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {telemetry.browser || 'Unknown Browser'}
                  </div>
                </div>
              </div>

              {/* Detailed Identity Block */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300">
                  Identity & Session Keys
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Persistent Visitor ID</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {telemetry.visitorId || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Session ID</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {telemetry.sessionId || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Meta Pixel Event ID</span>
                    <span className="sm:col-span-2 font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all font-semibold">
                      {telemetry.eventId || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Authenticated Customer</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.userEmail ? (
                        <div>
                          <div className="font-semibold">{telemetry.userName || 'Customer'}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">{telemetry.userEmail}</div>
                          {telemetry.userId && <div className="text-[11px] text-slate-400 font-mono">UID: {telemetry.userId}</div>}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Anonymous Visitor (Not Logged In)</span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Target Page & Value</span>
                    <div className="sm:col-span-2 space-y-1">
                      <div className="font-mono text-xs text-slate-800 dark:text-slate-200">{pagePath}</div>
                      {telemetry.pageTitle && (
                        <div className="text-xs text-slate-500 font-sans">{telemetry.pageTitle}</div>
                      )}
                      {event.value && event.value !== '—' && (
                        <span className="inline-block px-2 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded mt-1">
                          Conversion Value: {event.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Pixel Health */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-0.5">
                    Meta Pixel Delivery Status
                  </strong>
                  {telemetry.metaPixelActive ? (
                    <span>Active and verified. Standard <strong>{eventName}</strong> was delivered directly to Meta Pixel script with Advanced Matching and event ID deduplication.</span>
                  ) : (
                    <span>Logged in telemetry stream. Active Meta Pixel ID: {telemetry.metaPixelId || 'Not configured in site settings'}.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTRIBUTION & MARKETING */}
          {activeTab === 'attribution' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300">
                  Traffic Origin & Click Identifiers
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Traffic Channel</span>
                    <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200">
                      {telemetry.trafficChannel || 'Direct'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Traffic Source Domain</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.trafficSource || 'Direct'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Full Referrer URL</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {telemetry.referrer || telemetry.serverReferer || 'Direct (No Referrer Header)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Search Engine</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.searchEngine || 'None'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Social Network</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.socialNetwork || 'None'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Facebook Click ID (fbclid)</span>
                    <span className="sm:col-span-2 font-mono text-xs text-blue-600 dark:text-blue-400 break-all select-all font-semibold">
                      {telemetry.fbclid || 'None (Organic/Direct)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Google Click ID (gclid)</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {telemetry.gclid || 'None'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">TikTok Click ID (ttclid)</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {telemetry.ttclid || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* UTM Campaign Parameters */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300">
                  UTM Campaign Parameters
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {[
                    { label: 'utm_source', val: telemetry.utmSource },
                    { label: 'utm_medium', val: telemetry.utmMedium },
                    { label: 'utm_campaign', val: telemetry.utmCampaign },
                    { label: 'utm_term', val: telemetry.utmTerm },
                    { label: 'utm_content', val: telemetry.utmContent }
                  ].map(utm => (
                    <div key={utm.label} className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-500">{utm.label}</span>
                      <span className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200">
                        {utm.val ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-mono text-xs font-bold">
                            {utm.val}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVICE & SCREEN */}
          {activeTab === 'device' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300">
                  Client Hardware & Browser Specifications
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Device Category</span>
                    <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {getDeviceIcon()}
                      {telemetry.deviceType || 'Desktop'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Operating System</span>
                    <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200">
                      {telemetry.os || 'Unknown OS'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Web Browser</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.browser || 'Unknown Browser'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Screen Resolution</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {telemetry.screenResolution || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Viewport Size</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {telemetry.viewportSize || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Locale & Language</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.language || 'en-US'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Client Timezone</span>
                    <span className="sm:col-span-2 text-slate-800 dark:text-slate-200">
                      {telemetry.timezone || 'UTC'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Raw User-Agent</span>
                    <span className="sm:col-span-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-all">
                      {telemetry.serverUserAgent || telemetry.userAgent || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GEO & NETWORK */}
          {activeTab === 'geo' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300">
                  Geolocation & IP Network Details
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Client IP Address</span>
                    <span className="sm:col-span-2 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 select-all">
                      {telemetry.ip || 'Unknown IP'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">City</span>
                    <span className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200">
                      {telemetry.city || 'Unknown City'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Region / State</span>
                    <span className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200">
                      {telemetry.region || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Country</span>
                    <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200">
                      {telemetry.country || 'Unknown Country'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Edge Coordinates</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {telemetry.latitude && telemetry.longitude ? `${telemetry.latitude}, ${telemetry.longitude}` : 'Not provided by edge proxy'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5">
                    <span className="font-medium text-slate-500">Server Edge Timestamp</span>
                    <span className="sm:col-span-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {telemetry.serverReceivedAt || event.event_time || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RAW TELEMETRY JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Structured Payload
                </span>
                <button
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 select-all max-h-[450px]">
                {JSON.stringify({
                  id: event.id,
                  event_name: event.event_name,
                  user_role: event.user_role,
                  source: event.source,
                  traffic_source: event.traffic_source,
                  value: event.value,
                  page_path: event.page_path,
                  event_time: event.event_time,
                  telemetry: telemetry
                }, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            {copied ? 'Copied to Clipboard' : 'Copy All Telemetry'}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
