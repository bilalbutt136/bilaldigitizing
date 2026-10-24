'use client';

import React, { useMemo, useState } from 'react';
import { Activity, BadgeDollarSign, Eye, Filter, MapPin, Search, Users } from 'lucide-react';

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
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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
    return {
      primary: locality,
      secondary: country
    };
  }

  if (country && country.toLowerCase() !== 'unknown') {
    return {
      primary: country,
      secondary: ''
    };
  }

  return {
    primary: 'Unknown',
    secondary: 'Location unavailable'
  };
};

export const GoogleAdsVisitorActivityPanel = ({
  events = [],
  siteSettings = {},
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
      label: 'Google Ads Tag',
      value: siteSettings?.googleAdsTagId ? 'Connected' : 'Not Configured',
      note: siteSettings?.googleAdsTagId || 'No AW tag saved',
      icon: <BadgeDollarSign size={18} />
    },
    {
      label: 'Google Ads Visitors',
      value: analytics.uniqueGoogleVisitors,
      note: 'Unique visitors with Google Ads attribution',
      icon: <Users size={18} />
    },
    {
      label: 'Ads Purchases Sent',
      value: analytics.googleAdsConversions.length,
      note: siteSettings?.googleAdsPurchaseLabel ? 'Purchase conversion active' : 'Conversion label missing',
      icon: <Activity size={18} />
    },
    {
      label: 'Ads Conversion Value',
      value: '$' + analytics.conversionValue.toFixed(2),
      note: analytics.uniqueVisitors + ' unique website visitors recorded',
      icon: <BadgeDollarSign size={18} />
    }
  ];

  return (
    <section style={{
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '16px',
      background: 'var(--bg-card, #ffffff)',
      padding: '1rem',
      marginBottom: '1.25rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <BadgeDollarSign size={20} style={{ color: '#2563eb' }} />
            <h4 style={{
              margin: 0,
              color: 'var(--color-text-primary, #0f172a)',
              fontSize: '1.05rem',
              fontWeight: 900
            }}>
              Google Ads & Visitor Activity
            </h4>
          </div>
          <p style={{
            margin: '0.25rem 0 0',
            color: 'var(--color-text-muted, #64748b)',
            fontSize: '0.78rem'
          }}>
            Follow paid-ad visitors from landing page through checkout and successful purchase.
          </p>
        </div>

        {focusedVisitorId && (
          <button
            type="button"
            onClick={() => setFocusedVisitorId('')}
            style={{
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '9px',
              padding: '0.45rem 0.7rem',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Clear visitor focus
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        {summaryCards.map((card) => (
          <div key={card.label} style={{
            padding: '0.9rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            background: 'var(--color-subtle, #f8fafc)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#2563eb',
              marginBottom: '0.3rem'
            }}>
              {card.icon}
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {card.label}
              </span>
            </div>
            <div style={{
              color: 'var(--color-text-primary, #0f172a)',
              fontSize: '1.2rem',
              fontWeight: 900
            }}>
              {card.value}
            </div>
            <div style={{
              color: 'var(--color-text-muted, #64748b)',
              fontSize: '0.7rem',
              marginTop: '0.15rem',
              lineHeight: 1.35
            }}>
              {card.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '0.55rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '8px',
                padding: '0.42rem 0.65rem',
                background: filter === id ? '#2563eb' : 'var(--color-surface, #ffffff)',
                color: filter === id ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                fontSize: '0.73rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {id === 'all' && <Filter size={12} />}
              {label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: '0 1 340px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search visitor, gclid, page, order..."
            style={{
              width: '100%',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '9px',
              padding: '0.52rem 0.7rem 0.52rem 1.95rem',
              background: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              fontSize: '0.76rem'
            }}
          />
        </div>
      </div>

      {focusedVisitorId && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.55rem 0.75rem',
          borderRadius: '9px',
          background: '#eff6ff',
          color: '#1e40af',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          Showing full journey for visitor: {focusedVisitorId}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1020px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              {['When', 'Visitor', 'Activity', 'Attribution', 'Location', 'Page', 'Value', ''].map((heading) => (
                <th key={heading} style={{
                  padding: '0.65rem 0.7rem',
                  color: '#64748b',
                  fontSize: '0.67rem',
                  fontWeight: 900,
                  textTransform: 'uppercase'
                }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleEvents.slice(0, 100).map((event, index) => {
              const tel = getTelemetry(event);
              const visitorId = tel.visitorId || '';
              const googleEvent = isGoogleAdsEvent(event);
              const eventName = event?.event_name || 'PageView';
              const location = formatLocation(tel);

              return (
                <tr
                  key={event?.id || event?.event_id || index}
                  style={{ borderBottom: '1px solid var(--border-color, #eef2f7)' }}
                >
                  <td style={{ padding: '0.7rem', fontSize: '0.73rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatTime(event?.event_time || event?.created_at)}
                  </td>
                  <td style={{ padding: '0.7rem' }}>
                    <button
                      type="button"
                      disabled={!visitorId}
                      onClick={() => visitorId && setFocusedVisitorId(visitorId)}
                      title={visitorId || 'Anonymous visitor'}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        textAlign: 'left',
                        cursor: visitorId ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                        {tel.userName || event?.user_role || 'Guest Visitor'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: visitorId ? '#2563eb' : '#94a3b8', fontFamily: 'monospace' }}>
                        {shortVisitorId(visitorId)}
                      </div>
                    </button>
                  </td>
                  <td style={{ padding: '0.7rem' }}>
                    <span style={{
                      display: 'inline-block',
                      borderRadius: '6px',
                      padding: '0.25rem 0.45rem',
                      background: /purchase/i.test(eventName) ? '#dcfce7' : (eventName === 'PageView' ? '#e0f2fe' : '#f3e8ff'),
                      color: /purchase/i.test(eventName) ? '#15803d' : (eventName === 'PageView' ? '#0369a1' : '#7e22ce'),
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>
                      {eventName}
                    </span>
                  </td>
                  <td style={{ padding: '0.7rem', fontSize: '0.72rem' }}>
                    <div style={{ fontWeight: 800, color: googleEvent ? '#15803d' : 'var(--color-text-primary, #334155)' }}>
                      {googleEvent ? 'Google Ads' : (tel.trafficChannel || 'Direct')}
                    </div>
                    {tel.gclid && (
                      <div style={{ fontSize: '0.62rem', color: '#15803d' }}>
                        gclid: {String(tel.gclid).slice(0, 18)}…
                      </div>
                    )}
                    {!tel.gclid && tel.utmCampaign && (
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                        {tel.utmCampaign}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.7rem', fontSize: '0.72rem', color: '#475569', minWidth: '150px' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                      <MapPin size={13} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.25 }}>
                          {location.primary}
                        </div>
                        {location.secondary && (
                          <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '1px' }}>
                            {location.secondary}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.7rem', fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {event?.page_path || tel.pagePath || '/'}
                  </td>
                  <td style={{ padding: '0.7rem', fontSize: '0.73rem', fontWeight: 800, color: '#15803d' }}>
                    {event?.value && event.value !== '—' ? event.value : '—'}
                  </td>
                  <td style={{ padding: '0.7rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent?.(event)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        background: 'var(--color-surface, #ffffff)',
                        borderRadius: '7px',
                        padding: '0.35rem 0.5rem',
                        color: '#2563eb',
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
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

      {visibleEvents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          color: 'var(--color-text-muted, #64748b)',
          fontSize: '0.78rem'
        }}>
          No visitor activity matches the current filter.
        </div>
      )}
    </section>
  );
};
