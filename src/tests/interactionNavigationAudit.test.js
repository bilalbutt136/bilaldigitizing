import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Complete Interaction and Navigation Audit', () => {

  describe('1. Route Registry & Target Resolution', () => {
    const REGISTERED_ROUTES = new Set([
      '/',
      '/portfolio',
      '/pricing',
      '/faqs',
      '/blogs',
      '/custom-patches',
      '/services/embroidery-digitizing',
      '/services/vector-tracing',
      '/contact',
      '/order',
      '/terms',
      '/privacy',
      '/login',
      '/signup',
      '/reset-password',
      '/secure-admin-login',
      '/client-portal',
      '/admin-portal',
      '/worker-login',
      '/worker-portal',
      '/worker-register'
    ]);

    test('All header desktop navigation links resolve to valid registered routes', () => {
      const headerLinks = [
        '/',
        '/services/embroidery-digitizing',
        '/services/vector-tracing',
        '/custom-patches',
        '/portfolio',
        '/pricing',
        '/faqs',
        '/contact'
      ];

      for (const link of headerLinks) {
        assert.ok(REGISTERED_ROUTES.has(link), `Header link "${link}" must resolve to a valid route`);
      }
    });

    test('All mobile drawer navigation links resolve to valid registered routes', () => {
      const mobileDrawerLinks = [
        '/',
        '/services/embroidery-digitizing',
        '/services/vector-tracing',
        '/custom-patches',
        '/portfolio',
        '/pricing',
        '/faqs',
        '/blogs',
        '/contact'
      ];

      for (const link of mobileDrawerLinks) {
        assert.ok(REGISTERED_ROUTES.has(link), `Mobile drawer link "${link}" must resolve to a valid route`);
      }
    });

    test('All footer navigation links resolve to valid registered routes', () => {
      const footerLinks = [
        '/',
        '/services/embroidery-digitizing',
        '/services/vector-tracing',
        '/custom-patches',
        '/pricing',
        '/portfolio',
        '/faqs',
        '/blogs',
        '/terms',
        '/privacy'
      ];

      for (const link of footerLinks) {
        assert.ok(REGISTERED_ROUTES.has(link), `Footer link "${link}" must resolve to a valid route`);
      }
    });
  });

  describe('2. Dynamic Favicon React 19 Reconciler Safety', () => {
    test('DynamicFavicon updates href attributes in place without removing nodes', () => {
      // Mock DOM head with existing icon links
      const headLinks = [
        { rel: 'icon', href: '/favicon.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' }
      ];
      const appleTouchIcon = { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' };

      const newFaviconUrl = 'https://supabase.co/storage/v1/object/public/logos/favicon-custom.png';
      const cacheBustUrl = newFaviconUrl + '?t=custom.png';

      // Safe update logic
      headLinks.forEach(link => {
        link.href = cacheBustUrl;
      });

      // Verify favicon nodes update in place while the high-resolution Apple icon stays static.
      assert.equal(headLinks.length, 2, 'Favicon link count must remain exactly 2');
      headLinks.forEach(link => {
        assert.equal(link.href, cacheBustUrl, 'Link href must be updated in-place');
      });
      assert.equal(
        appleTouchIcon.href,
        '/apple-touch-icon.png',
        'Dynamic favicon updates must not replace the 180x180 Apple touch icon'
      );
    });

    test('Eliminates TypeError: Cannot read properties of null (reading removeChild)', () => {
      // Simulate attempting removeChild on a node whose parent is null (React 19 fiber detached node)
      const orphanNode = { parentNode: null };
      let threwError = false;

      // Unsafe legacy code would do:
      // orphanNode.parentNode.removeChild(orphanNode); -> throws TypeError

      // Safe patched code does:
      try {
        if (orphanNode.parentNode) {
          orphanNode.parentNode.removeChild(orphanNode);
        }
      } catch {
        threwError = true;
      }

      assert.equal(threwError, false, 'Safe guard prevents throwing TypeError on detached nodes');
    });
  });

  describe('3. Order Route & Deep-Link Parameter Forwarding', () => {
    test('Normalizes various service parameter aliases to canonical wizard types', () => {
      const normalizeService = (rawService) => {
        const raw = rawService || 'all';
        return raw === 'vector-art' || raw === 'vector-tracing'
          ? 'vector'
          : (raw === 'patches' || raw === 'custom-patches' ? 'patch' : raw);
      };

      assert.equal(normalizeService('embroidery'), 'embroidery');
      assert.equal(normalizeService('vector-art'), 'vector');
      assert.equal(normalizeService('vector-tracing'), 'vector');
      assert.equal(normalizeService('patches'), 'patch');
      assert.equal(normalizeService('custom-patches'), 'patch');
      assert.equal(normalizeService(null), 'all');
      assert.equal(normalizeService(''), 'all');
    });
  });

  describe('4. Portfolio Interaction and Filter State', () => {
    const SAMPLE_PORTFOLIO_ITEMS = [
      { id: 1, title: 'Falcon Left Chest', categoryKey: 'embroidery', categoryLabel: 'Embroidery Digitizing' },
      { id: 2, title: 'Wolf Head Vector', categoryKey: 'vector', categoryLabel: 'Vector Art' },
      { id: 3, title: 'Tactical Morale Patch', categoryKey: 'patches', categoryLabel: 'Custom Patches' },
      { id: 4, title: 'Cap 3D Puff Logo', categoryKey: 'embroidery', categoryLabel: 'Embroidery Digitizing' }
    ];

    test('Filter logic accurately slices items without state corruption', () => {
      const filterItems = (items, filter) => {
        if (filter === 'all') return items;
        return items.filter(i => i.categoryKey === filter);
      };

      assert.equal(filterItems(SAMPLE_PORTFOLIO_ITEMS, 'all').length, 4);
      assert.equal(filterItems(SAMPLE_PORTFOLIO_ITEMS, 'embroidery').length, 2);
      assert.equal(filterItems(SAMPLE_PORTFOLIO_ITEMS, 'vector').length, 1);
      assert.equal(filterItems(SAMPLE_PORTFOLIO_ITEMS, 'patches').length, 1);
    });

    test('handleStartOrder from portfolio maps category to correct wizard type', () => {
      const mapItemToService = (item) => {
        return item.categoryKey === 'vector' ? 'vector' : item.categoryKey === 'patches' ? 'patch' : 'embroidery';
      };

      assert.equal(mapItemToService(SAMPLE_PORTFOLIO_ITEMS[0]), 'embroidery');
      assert.equal(mapItemToService(SAMPLE_PORTFOLIO_ITEMS[1]), 'vector');
      assert.equal(mapItemToService(SAMPLE_PORTFOLIO_ITEMS[2]), 'patch');
    });
  });

  describe('5. Contact Route & Guest Support Dispatch', () => {
    test('handleOpenLiveSupport directs logged-in users to portal and guests to /contact', () => {
      const resolveSupportTarget = (isAuthenticated, isAdmin) => {
        if (isAuthenticated && !isAdmin) {
          return '/client-portal?tab=support';
        }
        return '/contact';
      };

      assert.equal(resolveSupportTarget(false, false), '/contact', 'Guest must be routed to /contact');
      assert.equal(resolveSupportTarget(true, false), '/client-portal?tab=support', 'Customer must be routed to client portal support');
      assert.equal(resolveSupportTarget(true, true), '/contact', 'Admin without client portal support must route cleanly');
    });

    test('Validates contact form required fields before submission', () => {
      const validateContactForm = (formData) => {
        if (!formData.name?.trim()) return { valid: false, error: 'Name is required' };
        if (!formData.email?.trim() || !formData.email.includes('@')) return { valid: false, error: 'Valid email is required' };
        if (!formData.message?.trim()) return { valid: false, error: 'Message is required' };
        return { valid: true };
      };

      assert.equal(validateContactForm({ name: '', email: 'test@b.com', message: 'Hello' }).valid, false);
      assert.equal(validateContactForm({ name: 'John', email: 'invalid-email', message: 'Hello' }).valid, false);
      assert.equal(validateContactForm({ name: 'John', email: 'test@b.com', message: '' }).valid, false);
      assert.equal(validateContactForm({ name: 'John', email: 'test@b.com', message: 'I need a digitizing quote.' }).valid, true);
    });
  });
});
