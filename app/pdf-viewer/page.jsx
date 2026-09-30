'use client';

import React, { useEffect, useState } from 'react';
import PdfPreviewModal from '../../src/components/common/PdfPreviewModal';

export default function StandalonePdfViewerPage() {
  const [source, setSource] = useState('');
  const [name, setName] = useState('Document.pdf');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSource(params.get('url') || '');
    setName(params.get('filename') || 'Document.pdf');
    setReady(true);
  }, []);

  const closeViewer = () => {
    if (window.opener) {
      window.close();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign('/');
  };

  if (!ready) {
    return (
      <main style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading PDF viewer...
      </main>
    );
  }

  if (!source) {
    return (
      <main style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: '#0f172a',
        color: '#f8fafc',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        No PDF file was provided.
      </main>
    );
  }

  return (
    <PdfPreviewModal
      isOpen
      fileUrl={source}
      fileName={name}
      onClose={closeViewer}
    />
  );
}
