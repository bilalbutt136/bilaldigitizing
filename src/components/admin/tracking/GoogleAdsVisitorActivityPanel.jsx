'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  BadgeDollarSign,
  Eye,
  Filter,
  MapPin,
  Search,
  Users
} from 'lucide-react';

const getTelemetry = (event) => event?.telemetry || {};

const isGoogleAdsEvent = (event) => {
  const tel = getTelemetry(event);
  const trafficText = [
    tel.trafficChannel,
    tel.trafficSource,
    event?.traffic_source
  ].filter(Boolean).join(' ');

  return event?.event_name === 'GoogleAdsPurchase' ||
    tel.trackingPlatform === 'google_ads' ||
    Boolean(tel.gclid) ||
    /google ad|paid search/i.test(trafficText);
};

const parseCurrencyValue = (value) => {
  const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  };
};

const shortVisitorId = (value) => {
  const text = String(value || '');
  if (!text) return 'Anonymous';
  return text.length > 18 ? text.slice(0, 10) + '…' + text.slice(-5) : text;
};

const countryNames = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  PK: 'Pakistan'
};

const formatLocation = (telemetry = {}) => {
  const city = String(telemetry.city || '').trim();
  const region = String(telemetry.region || '').trim();
  const countryCode = String(telemetry.country || '').trim().toUpperCase();
  const country = countryNames[countryCode] || countryCode;

  const locality = [city, region]
    .filter((value) => value && value.toLowerCase() !== 'unknown')
    .join(', ');

  if (locality && country && country.toLowerCase() !== 'unknown') {
    return { primary: locality, secondary: country };
  }

  if (country && country.toLowerCase() !== 'unknown') {
    return { primary: country, secondary: '' };
  }

  return { primary: 'Unknown', secondary: 'Location unavailable' };
};

const eventBadgeStyle = (eventName) => {
  if (/purchase/i.test(eventName)) {
    return { background: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
  }
  if (/checkout|payment/i.test(eventName)) {
    return { background: '#fef3c7', color: '#b45309', border: '#fde68a' };
  }
  if (eventName === 'PageView') {
    return { background: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
  }
  return { background: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' };
};

export const GoogleAdsVisitorActivityPanel = ({
  events = [],
  siteSettings = {},
  loading = false,
  onSelectEvent
}) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [focusedVisitorId, setFocusedVisitorId] = useState('');

  const analytics = useMemo(() => {
    const googleAdsConversions = events.filter((event) => event?.event_name === 'GoogleAdsPurchase');
    const googleEvents = events.filter(isGoogleAdsEvent);
    const uniqueGoogleVisitors = new Set(
      googleEvents.map((event) => getTelemetry(event).visitorId).filter(Boolean)
    ).size;
    const uniqueVisitors = new Set(
      events.map((event) => getTelemetry(event).visitorId).filter(Boolean)
    ).size;
    const conversionValue = googleAdsConversions.reduce(
      (sum, event) => sum + parseCurrencyValue(event?.value),
      0
    );

    return {
      googleAdsConversions,
      uniqueGoogleVisitors,
      uniqueVisitors,
      conversionValue
    };
  }, [events]);

  const visibleEvents = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return events.filter((event) => {
      const tel = getTelemetry(event);
      const eventName = String(event?.event_name || 'PageView');

      if (focusedVisitorId && tel.visitorId !== focusedVisitorId) return false;

      const matchesFilter =
        filter === 'all' ||
        (filter === 'google_ads' && isGoogleAdsEvent(event)) ||
        (filter === 'purchases' && /purchase/i.test(eventName)) ||
        (filter === 'checkout' && ['InitiateCheckout', 'AddPaymentInfo'].includes(eventName)) ||
        (filter === 'pageviews' && eventName === 'PageView');

      if (!matchesFilter) return false;
      if (!needle) return true;

      return [
        eventName,
        event?.user_role,
        event?.user_email,
        event?.page_path,
        event?.value,
        tel.visitorId,
        tel.userEmail,
        tel.userName,
        tel.gclid,
        tel.utmCampaign,
        tel.trafficSource,
        tel.trafficChannel,
        tel.city,
        tel.region,
        tel.country,
        tel.transactionId
      ].some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [events, filter, focusedVisitorId, search]);

  const summaryCards = [
    {
      label: 'Google Ads',
      value: siteSettings?.googleAdsTagId ? 'Connected' : 'Not set',
      note: siteSettings?.googleAdsTagId || 'Google tag missing',
      icon: <BadgeDollarSign size={18} />,
      tone: '#2563eb'
    },
    {
      label: 'Ad Visitors',
      value: analytics.uniqueGoogleVisitors,
      note: 'Unique paid-search visitors',
      icon: <Users size={18} />,
      tone: '#7c3aed'
    },
    {
      label: 'Purchases Sent',
      value: analytics.googleAdsConversions.length,
      note: siteSettings?.googleAdsPurchaseLabel ? 'Conversion event active' : 'Conversion label missing',
      icon: <Activity size={18} />,
      tone: '#059669'
    },
    {
      label: 'Conversion Value',
      value: '$' + analytics.conversionValue.toFixed(2),
      note: analytics.uniqueVisitors + ' total unique visitors',
      icon: <BadgeDollarSign size={18} />,
      tone: '#ea580c'
    }
  ];

  const renderVisitor = (event) => {
    const tel = getTelemetry(event);
    const visitorId = tel.visitorId || '';

    return (
      <button
        type="button"
        disabled={!visitorId}
        onClick={() => visitorId && setFocusedVisitorId(visitorId)}
        title={visitorId || 'Anonymous visitor'}
        className="gav-visitor-button"
      >
        <span className="gav-visitor-name">
          {tel.userName || event?.user_role || 'Guest Visitor'}
        </span>
        <span className="gav-visitor-id">{shortVisitorId(visitorId)}</span>
      </button>
    );
  };

  const renderAttribution = (event) => {
    const tel = getTelemetry(event);
    const googleEvent = isGoogleAdsEvent(event);

    return (
      <div>
        <div className={googleEvent ? 'gav-source gav-source-google' : 'gav-source'}>
          {googleEvent ? 'Google Ads' : (tel.trafficChannel || 'Direct')}
        </div>
        {tel.gclid && (
          <div className="gav-subtext gav-green">
            gclid · {String(tel.gclid).slice(0, 14)}…
          </div>
        )}
        {!tel.gclid && tel.utmCampaign && (
          <div className="gav-subtext">{tel.utmCampaign}</div>
        )}
      </div>
    );
  };

  const renderLocation = (event) => {
    const location = formatLocation(getTelemetry(event));

    return (
      <div className="gav-location">
        <MapPin size={13} />
        <div>
          <div className="gav-location-primary">{location.primary}</div>
          {location.secondary && (
            <div className="gav-subtext">{location.secondary}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="gav-shell">
      <style dangerouslySetInnerHTML={{ __html: `
        .gav-shell {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          background: color-mix(in srgb, var(--bg-card, #ffffff) 94%, white 6%);
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        }
        .gav-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }
        .gav-stat {
          min-width: 0;
          padding: 0.9rem 1rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: color-mix(in srgb, var(--color-surface, #ffffff) 94%, white 6%);
        }
        .gav-stat-top {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.35rem;
        }
        .gav-stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, currentColor 9%, transparent);
        }
        .gav-stat-label {
          font-size: 0.67rem;
          font-weight: 900;
          letter-spacing: 0.055em;
          text-transform: uppercase;
          color: var(--color-text-muted, #64748b);
        }
        .gav-stat-value {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--color-text-primary, #0f172a);
          line-height: 1.15;
        }
        .gav-stat-note {
          margin-top: 0.22rem;
          font-size: 0.69rem;
          color: var(--color-text-muted, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gav-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          background: color-mix(in srgb, var(--color-subtle, #f8fafc) 82%, transparent);
        }
        .gav-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .gav-filter {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 9px;
          padding: 0.45rem 0.7rem;
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
          transition: all .18s ease;
        }
        .gav-filter:hover {
          border-color: #93c5fd;
          transform: translateY(-1px);
        }
        .gav-filter.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 4px 10px rgba(37, 99, 235, .18);
        }
        .gav-search {
          position: relative;
          min-width: 260px;
          flex: 0 1 360px;
        }
        .gav-search svg {
          position: absolute;
          left: .7rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .gav-search input {
          width: 100%;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 9px;
          padding: .55rem .75rem .55rem 2.05rem;
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: .76rem;
          outline: none;
        }
        .gav-search input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59,130,246,.10);
        }
        .gav-focus {
          margin: .75rem 1rem 0;
          padding: .6rem .75rem;
          border-radius: 9px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          font-size: .73rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .75rem;
        }
        .gav-focus button {
          border: 0;
          background: transparent;
          color: #2563eb;
          font-weight: 900;
          cursor: pointer;
          font-size: .7rem;
        }
        .gav-table-wrap {
          overflow-x: auto;
          scrollbar-width: thin;
        }
        .gav-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
          text-align: left;
        }
        .gav-table th {
          padding: .72rem .8rem;
          background: color-mix(in srgb, var(--color-subtle, #f8fafc) 88%, transparent);
          color: var(--color-text-muted, #64748b);
          font-size: .66rem;
          font-weight: 900;
          letter-spacing: .055em;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }
        .gav-table td {
          padding: .78rem .8rem;
          vertical-align: middle;
          border-bottom: 1px solid color-mix(in srgb, var(--border-color, #e2e8f0) 75%, transparent);
          font-size: .74rem;
        }
        .gav-table tbody tr {
          transition: background .15s ease;
        }
        .gav-table tbody tr:hover {
          background: color-mix(in srgb, #eff6ff 45%, transparent);
        }
        .gav-time-date {
          color: var(--color-text-primary, #0f172a);
          font-weight: 800;
          white-space: nowrap;
        }
        .gav-time-clock {
          color: var(--color-text-muted, #64748b);
          font-size: .65rem;
          margin-top: 2px;
          white-space: nowrap;
        }
        .gav-visitor-button {
          border: 0;
          background: transparent;
          padding: 0;
          text-align: left;
          cursor: pointer;
          max-width: 170px;
        }
        .gav-visitor-name {
          display: block;
          color: var(--color-text-primary, #0f172a);
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gav-visitor-id {
          display: block;
          margin-top: 2px;
          color: #2563eb;
          font-size: .63rem;
          font-family: monospace;
        }
        .gav-event {
          display: inline-flex;
          align-items: center;
          border: 1px solid;
          border-radius: 7px;
          padding: .28rem .48rem;
          font-size: .67rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .gav-source {
          font-weight: 800;
          color: var(--color-text-primary, #334155);
        }
        .gav-source-google,
        .gav-green {
          color: #15803d;
        }
        .gav-subtext {
          font-size: .62rem;
          color: var(--color-text-muted, #64748b);
          margin-top: 2px;
        }
        .gav-location {
          display: flex;
          align-items: flex-start;
          gap: .35rem;
          color: #2563eb;
          min-width: 135px;
        }
        .gav-location svg {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .gav-location-primary {
          color: var(--color-text-primary, #0f172a);
          font-weight: 800;
          line-height: 1.25;
        }
        .gav-page {
          max-width: 180px;
          color: var(--color-text-muted, #64748b);
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gav-value {
          color: #15803d;
          font-weight: 900;
          white-space: nowrap;
        }
        .gav-details {
          display: inline-flex;
          align-items: center;
          gap: .28rem;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 8px;
          padding: .38rem .55rem;
          font-size: .67rem;
          font-weight: 900;
          cursor: pointer;
        }
        .gav-state {
          display: grid;
          place-items: center;
          min-height: 180px;
          padding: 2rem;
          text-align: center;
          color: var(--color-text-muted, #64748b);
          font-size: .78rem;
        }
        .gav-mobile-list {
          display: none;
          padding: .75rem;
          gap: .65rem;
        }
        .gav-mobile-card {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: .85rem;
          background: var(--color-surface, #ffffff);
        }
        .gav-mobile-top {
          display: flex;
          justify-content: space-between;
          gap: .5rem;
          align-items: flex-start;
          margin-bottom: .7rem;
        }
        .gav-mobile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
          font-size: .7rem;
        }
        .gav-mobile-label {
          display: block;
          color: var(--color-text-muted, #64748b);
          font-size: .61rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: .18rem;
        }
        @media (max-width: 1100px) {
          .gav-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .gav-summary { grid-template-columns: 1fr 1fr; padding: .75rem; gap: .55rem; }
          .gav-stat { padding: .75rem; }
          .gav-stat-note { white-space: normal; }
          .gav-toolbar { padding: .75rem; align-items: stretch; }
          .gav-search { min-width: 100%; flex-basis: 100%; }
          .gav-filter-row { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
          .gav-filter { white-space: nowrap; }
          .gav-table-wrap { display: none; }
          .gav-mobile-list { display: grid; }
          .gav-focus { margin: .65rem .75rem 0; }
        }
        @media (max-width: 480px) {
          .gav-summary { grid-template-columns: 1fr; }
          .gav-mobile-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      <div className="gav-summary">
        {summaryCards.map((card) => (
          <div key={card.label} className="gav-stat">
            <div className="gav-stat-top">
              <div className="gav-stat-icon" style={{ color: card.tone }}>{card.icon}</div>
              <span className="gav-stat-label">{card.label}</span>
            </div>
            <div className="gav-stat-value">{card.value}</div>
            <div className="gav-stat-note" title={card.note}>{card.note}</div>
          </div>
        ))}
      </div>

      <div className="gav-toolbar">
        <div className="gav-filter-row">
          {[
            ['all', 'All'],
            ['google_ads', 'Google Ads'],
            ['purchases', 'Purchases'],
            ['checkout', 'Checkout'],
            ['pageviews', 'Page Views']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={'gav-filter' + (filter === id ? ' active' : '')}
            >
              {id === 'all' && <Filter size={12} />}
              {label}
            </button>
          ))}
        </div>

        <div className="gav-search">
          <Search size={14} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search visitor, gclid, location, page, order..."
          />
        </div>
      </div>

      {focusedVisitorId && (
        <div className="gav-focus">
          <span>Showing complete journey for visitor: {focusedVisitorId}</span>
          <button type="button" onClick={() => setFocusedVisitorId('')}>Clear</button>
        </div>
      )}

      {loading ? (
        <div className="gav-state">
          <div>
            <Activity size={26} style={{ margin: '0 auto .55rem', color: '#2563eb' }} />
            Loading visitor activity…
          </div>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="gav-state">
          <div>
            <Search size={26} style={{ margin: '0 auto .55rem', color: '#94a3b8' }} />
            <div style={{ fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', marginBottom: '.2rem' }}>
              No activity matches this view
            </div>
            <div>Try another filter or clear the search field.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="gav-table-wrap">
            <table className="gav-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Visitor</th>
                  <th>Activity</th>
                  <th>Source</th>
                  <th>Location</th>
                  <th>Page</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.slice(0, 100).map((event, index) => {
                  const tel = getTelemetry(event);
                  const eventName = event?.event_name || 'PageView';
                  const time = formatTime(event?.event_time || event?.created_at);
                  const badge = eventBadgeStyle(eventName);

                  return (
                    <tr key={event?.id || event?.event_id || index}>
                      <td>
                        <div className="gav-time-date">{time.date}</div>
                        <div className="gav-time-clock">{time.time}</div>
                      </td>
                      <td>{renderVisitor(event)}</td>
                      <td>
                        <span
                          className="gav-event"
                          style={{
                            background: badge.background,
                            color: badge.color,
                            borderColor: badge.border
                          }}
                        >
                          {eventName}
                        </span>
                      </td>
                      <td>{renderAttribution(event)}</td>
                      <td>{renderLocation(event)}</td>
                      <td>
                        <div className="gav-page" title={event?.page_path || tel.pagePath || '/'}>
                          {event?.page_path || tel.pagePath || '/'}
                        </div>
                      </td>
                      <td className="gav-value">
                        {event?.value && event.value !== '—' ? event.value : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="gav-details"
                          onClick={() => onSelectEvent?.(event)}
                        >
                          <Eye size={12} /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="gav-mobile-list">
            {visibleEvents.slice(0, 100).map((event, index) => {
              const tel = getTelemetry(event);
              const eventName = event?.event_name || 'PageView';
              const time = formatTime(event?.event_time || event?.created_at);
              const badge = eventBadgeStyle(eventName);

              return (
                <div key={event?.id || event?.event_id || index} className="gav-mobile-card">
                  <div className="gav-mobile-top">
                    <div>{renderVisitor(event)}</div>
                    <span
                      className="gav-event"
                      style={{
                        background: badge.background,
                        color: badge.color,
                        borderColor: badge.border
                      }}
                    >
                      {eventName}
                    </span>
                  </div>

                  <div className="gav-mobile-grid">
                    <div>
                      <span className="gav-mobile-label">When</span>
                      <div className="gav-time-date">{time.date} · {time.time}</div>
                    </div>
                    <div>
                      <span className="gav-mobile-label">Source</span>
                      {renderAttribution(event)}
                    </div>
                    <div>
                      <span className="gav-mobile-label">Location</span>
                      {renderLocation(event)}
                    </div>
                    <div>
                      <span className="gav-mobile-label">Page</span>
                      <div className="gav-page">{event?.page_path || tel.pagePath || '/'}</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '.75rem',
                    paddingTop: '.65rem',
                    borderTop: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '.75rem'
                  }}>
                    <div className="gav-value">
                      {event?.value && event.value !== '—' ? event.value : 'No value'}
                    </div>
                    <button
                      type="button"
                      className="gav-details"
                      onClick={() => onSelectEvent?.(event)}
                    >
                      <Eye size={12} /> Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
