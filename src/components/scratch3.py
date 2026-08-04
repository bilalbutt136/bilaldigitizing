import re

with open('HeaderNav.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

cta_replacement = """        {/* Right Action CTAs */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem',
          flexShrink: 0
        }}>
          {/* Primary Get Started Button */}
          {safeCurrentView !== 'admin' && safeCurrentView !== 'customer' && !currentPath.includes('admin') && (
            <button 
              className="btn btn-primary-orange"
              onClick={() => {
                if (openOrderWizard) {
                  openOrderWizard();
                } else {
                  protectedNavigate('customer', true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--navy-900)',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Dynamic Authentication Controls */}
          {!safeIsAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  borderColor: 'var(--navy-300)',
                  color: 'var(--navy-800)',
                  background: 'transparent',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px'
                }}
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                  navigate('/login');
                }}
              >
                <User size={14} /> Client Login
              </button>
            </div>
          ) : ("""

cta_regex = re.compile(r'\{\/\* Right Action CTAs \*\/\}.*?\{!safeIsAuthenticated \? \(\s*<div style=\{\{ display: \'flex\', alignItems: \'center\', gap: \'0\.5rem\' \}\}>\s*<button.*?<LogIn size=\{14\} \/> Sign In\s*<\/button>\s*<\/div>\s*\) : \(', re.DOTALL)

if cta_regex.search(content):
    content = cta_regex.sub(cta_replacement, content)
    with open('HeaderNav.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("CTAs Replaced successfully")
else:
    print("CTAs NOT FOUND!")
