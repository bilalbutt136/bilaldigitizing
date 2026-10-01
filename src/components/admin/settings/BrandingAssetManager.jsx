'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Palette,
  Save,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useAppState } from '../../../context/StateContext';
import {
  getAuthHeaders,
  uploadFileToCloudinaryFull
} from '../../../services/supabaseService';

const DEFAULT_BRANDING = {
  app_icon_url: '/icon-512x512.png',
  favicon_url: '/favicon.png',
  header_logo_url: '/logo.png',
  footer_logo_url: '/logo.png',
  og_image_url: '/icon-512x512.png',
  theme_color: '#ffffff'
};

const ASSETS = [
  {
    field: 'app_icon_url',
    label: 'Mobile App / PWA Icon',
    recommended: '512 × 512 px · PNG',
    tip: 'Keep at least 20% safe padding around the logo so circle/squircle masks never clip it. Use white (#FFFFFF) or transparent background.',
    accept: '.png,image/png',
    allowed: ['image/png'],
    folder: 'branding/app-icon',
    preview: { width: 112, height: 112, background: '#ffffff', borderRadius: 24 },
    strictSquare: true,
    minWidth: 512,
    minHeight: 512
  },
  {
    field: 'favicon_url',
    label: 'Browser Favicon',
    recommended: '48 × 48 px or 64 × 64 px · PNG / ICO',
    tip: 'Use a clean, simple symbol without tiny text so it remains readable in browser tabs.',
    accept: '.png,.ico,image/png,image/x-icon,image/vnd.microsoft.icon',
    allowed: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    folder: 'branding/favicon',
    preview: { width: 64, height: 64, background: '#ffffff', borderRadius: 14 },
    strictSquare: false
  },
  {
    field: 'header_logo_url',
    label: 'Header Navigation Logo',
    recommended: '250 × 60 px · Transparent PNG / SVG',
    tip: 'Use a horizontal logo with comfortable side padding. It will scale by height in desktop and mobile navigation.',
    accept: '.png,.svg,image/png,image/svg+xml',
    allowed: ['image/png', 'image/svg+xml'],
    folder: 'branding/header-logo',
    preview: { width: 220, height: 72, background: '#ffffff', borderRadius: 12 }
  },
  {
    field: 'footer_logo_url',
    label: 'Footer Logo',
    recommended: '250 × 60 px · Transparent PNG / SVG',
    tip: 'Upload a light or dark-safe variant that stays readable on the footer background.',
    accept: '.png,.svg,image/png,image/svg+xml',
    allowed: ['image/png', 'image/svg+xml'],
    folder: 'branding/footer-logo',
    preview: { width: 220, height: 72, background: '#090d16', borderRadius: 12 }
  },
  {
    field: 'og_image_url',
    label: 'Social Share / OG Image',
    recommended: '1200 × 630 px · PNG / JPG',
    tip: 'Use a wide social preview with clear branding and safe text margins for Facebook, LinkedIn, X, WhatsApp, and messaging previews.',
    accept: '.png,.jpg,.jpeg,image/png,image/jpeg',
    allowed: ['image/png', 'image/jpeg'],
    folder: 'branding/social-share',
    preview: { width: 250, height: 131, background: '#ffffff', borderRadius: 12 }
  }
];

function toClientSettings(branding) {
  return {
    appIconUrl: branding.app_icon_url,
    faviconUrl: branding.favicon_url,
    headerLogoUrl: branding.header_logo_url,
    footerLogoUrl: branding.footer_logo_url,
    ogImageUrl: branding.og_image_url,
    themeColor: branding.theme_color,
    logoUrl: branding.header_logo_url
  };
}

async function getRasterDimensions(file) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml' || file.type.includes('icon')) {
    return null;
  }

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions.'));
    };
    image.src = url;
  });
}

const AssetCard = ({
  config,
  value,
  uploading,
  dragging,
  onDragState,
  onFile,
  onChangeUrl,
  onReset
}) => {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    onDragState(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      style={{
        background: 'var(--color-subtle, var(--bg-subtle))',
        border: dragging ? '2px solid #059669' : '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '1.25rem',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: dragging ? '0 0 0 4px rgba(5,150,105,0.08)' : 'none'
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragState(true);
      }}
      onDragLeave={() => onDragState(false)}
      onDrop={handleDrop}
    >
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
          {config.label}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, marginTop: '0.2rem' }}>
          Recommended: {config.recommended}
        </div>
      </div>

      <div
        style={{
          minHeight: 150,
          borderRadius: 14,
          border: '2px dashed var(--border-color)',
          background: config.preview.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={config.label}
              style={{
                width: config.preview.width,
                height: config.preview.height,
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: config.preview.borderRadius,
                display: 'block'
              }}
            />
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${config.label}`}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 0,
                borderRadius: 8,
                padding: '0.35rem',
                color: '#ffffff',
                background: 'rgba(15,23,42,0.78)',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <ImageIcon size={30} style={{ opacity: 0.45, marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '0.78rem' }}>Drop an image here</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        style={{
          marginTop: '0.85rem',
          width: '100%',
          border: '1.5px solid var(--border-color)',
          borderRadius: 10,
          background: 'var(--bg-card)',
          color: 'var(--color-text-primary)',
          padding: '0.7rem 0.9rem',
          fontWeight: 800,
          fontSize: '0.82rem',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          display: 'flex',
          gap: '0.45rem',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
        {uploading ? 'Uploading…' : 'Choose or Drop File'}
      </button>

      <div style={{ marginTop: '0.8rem' }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
          Asset URL
        </label>
        <input
          type="url"
          value={value || ''}
          onChange={(event) => onChangeUrl(event.target.value)}
          placeholder="https://..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            background: 'var(--bg-card)',
            color: 'var(--color-text-primary)',
            padding: '0.55rem 0.7rem',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
      </div>

      <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
        {config.tip}
      </p>
    </div>
  );
};

export const BrandingAssetManager = () => {
  const { showToast, siteSettings = {} } = useAppState();
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const initialBranding = useMemo(() => ({
    ...DEFAULT_BRANDING,
    app_icon_url: siteSettings.appIconUrl || DEFAULT_BRANDING.app_icon_url,
    favicon_url: siteSettings.faviconUrl || DEFAULT_BRANDING.favicon_url,
    header_logo_url: siteSettings.headerLogoUrl || siteSettings.logoUrl || DEFAULT_BRANDING.header_logo_url,
    footer_logo_url: siteSettings.footerLogoUrl || siteSettings.logoUrl || DEFAULT_BRANDING.footer_logo_url,
    og_image_url: siteSettings.ogImageUrl || DEFAULT_BRANDING.og_image_url,
    theme_color: siteSettings.themeColor || DEFAULT_BRANDING.theme_color
  }), [
    siteSettings.appIconUrl,
    siteSettings.faviconUrl,
    siteSettings.headerLogoUrl,
    siteSettings.footerLogoUrl,
    siteSettings.logoUrl,
    siteSettings.ogImageUrl,
    siteSettings.themeColor
  ]);

  const [branding, setBranding] = useState(initialBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [draggingField, setDraggingField] = useState(null);

  useEffect(() => {
    let active = true;

    const loadBranding = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/branding', {
          headers,
          cache: 'no-store'
        });
        const json = await response.json();

        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Could not load branding settings.');
        }

        if (active && json.branding) {
          setBranding({ ...DEFAULT_BRANDING, ...json.branding });
        }
      } catch (error) {
        if (active) {
          showToastRef.current?.(error?.message || 'Could not load branding settings.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBranding();
    return () => {
      active = false;
    };
  }, []);

  const validateAndUpload = async (config, file) => {
    if (!file) return;

    if (!config.allowed.includes(file.type)) {
      showToast?.(`Invalid file type for ${config.label}. Use ${config.recommended}.`, 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast?.('Branding files must be 10 MB or smaller.', 'error');
      return;
    }

    try {
      const dimensions = await getRasterDimensions(file);

      if (config.strictSquare && dimensions) {
        if (dimensions.width !== dimensions.height) {
          throw new Error('PWA icon must be square.');
        }
        if (dimensions.width < config.minWidth || dimensions.height < config.minHeight) {
          throw new Error('PWA icon must be at least 512 × 512 px.');
        }
      }

      if (config.field === 'favicon_url' && dimensions && dimensions.width !== dimensions.height) {
        showToast?.('Favicon is not square. A square 48×48 or 64×64 image is strongly recommended.', 'warning');
      }

      if (config.field === 'og_image_url' && dimensions) {
        const ratio = dimensions.width / dimensions.height;
        if (dimensions.width < 1200 || dimensions.height < 630 || Math.abs(ratio - (1200 / 630)) > 0.08) {
          showToast?.('Social image uploaded, but 1200×630 px is recommended for the cleanest previews.', 'warning');
        }
      }

      setUploadingField(config.field);
      const result = await uploadFileToCloudinaryFull(
        file,
        'media-gallery',
        config.folder
      );

      const url = result?.secure_url || result?.url;
      if (!url) throw new Error('Upload completed without a public URL.');

      setBranding(prev => ({ ...prev, [config.field]: url }));
      showToast?.(`${config.label} uploaded. Save changes to publish it.`, 'success');
    } catch (error) {
      showToast?.(error?.message || `${config.label} upload failed.`, 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const saveBranding = async () => {
    if (!/^#[0-9a-f]{6}$/i.test(branding.theme_color || '')) {
      showToast?.('Theme color must be a six-digit hex value such as #ffffff.', 'error');
      return;
    }

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers,
        body: JSON.stringify(branding)
      });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to save branding settings.');
      }

      const saved = { ...DEFAULT_BRANDING, ...json.branding };
      setBranding(saved);

      const clientSettings = toClientSettings(saved);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site_settings_updated', {
          detail: clientSettings
        }));
        localStorage.setItem('site_settings_live', JSON.stringify(clientSettings));
      }

      showToast?.('Branding saved. Header, footer, favicon, PWA manifest, and social metadata are now updated.', 'success');
    } catch (error) {
      showToast?.(error?.message || 'Failed to save branding settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{ background: 'rgba(5,150,105,0.12)', color: '#059669', padding: '0.5rem', borderRadius: 10 }}>
              <ImageIcon size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>
              Branding & Logo Management
            </h3>
          </div>
          <p style={{ margin: 0, maxWidth: 760, fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--color-text-muted)' }}>
            Upload production branding once and publish it without redeploying. Changes feed the website navigation, footer, browser favicon, Apple/PWA metadata, install manifest, and social share cards.
          </p>
        </div>
        {!loading && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '0.35rem 0.65rem' }}>
            <CheckCircle2 size={13} /> Database-backed
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={20} className="animate-spin" /> Loading branding settings…
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
            {ASSETS.map(config => (
              <AssetCard
                key={config.field}
                config={config}
                value={branding[config.field]}
                uploading={uploadingField === config.field}
                dragging={draggingField === config.field}
                onDragState={(active) => setDraggingField(active ? config.field : null)}
                onFile={(file) => validateAndUpload(config, file)}
                onChangeUrl={(value) => setBranding(prev => ({ ...prev, [config.field]: value }))}
                onReset={() => setBranding(prev => ({ ...prev, [config.field]: DEFAULT_BRANDING[config.field] }))}
              />
            ))}
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem 1.1rem', border: '1px solid var(--border-color)', borderRadius: 14, background: 'var(--color-subtle, var(--bg-subtle))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Palette size={18} style={{ color: '#059669' }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>PWA Theme Color</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>Used by the dynamic manifest and browser UI.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="color"
                value={branding.theme_color}
                onChange={(event) => setBranding(prev => ({ ...prev, theme_color: event.target.value }))}
                style={{ width: 42, height: 36, border: '1px solid var(--border-color)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={branding.theme_color}
                onChange={(event) => setBranding(prev => ({ ...prev, theme_color: event.target.value }))}
                maxLength={7}
                style={{ width: 100, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--color-text-primary)', padding: '0.55rem 0.65rem', fontSize: '0.8rem', fontWeight: 800 }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={saveBranding}
              disabled={saving || Boolean(uploadingField)}
              className="btn btn-primary-orange"
              style={{ minWidth: 190, justifyContent: 'center', padding: '0.75rem 1.25rem', fontWeight: 900 }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BrandingAssetManager;
