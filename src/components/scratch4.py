import re

with open('HeaderNav.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

mobile_replacement = """      {/* Mobile Slide-Down / Overlay Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            padding: '5rem 1.5rem 2rem 1.5rem',
            gap: '1rem',
            animation: 'fadeIn 0.25s ease-out',
            overflowY: 'auto'
          }}
        >
          {/* Close button inside mobile menu */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1.2rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--navy-900)'
            }}
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={() => {
              handleGoHome();
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}
          >
            Home
          </button>

          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '1rem' }}>
            Services
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/services/embroidery-digitizing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <PenTool size={18} /> Embroidery Digitizing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/services/vector-tracing');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <ImageIcon size={18} /> Vector Art
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/custom-patches');
              setIsMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            <Award size={18} /> Custom Patches
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

          <button
            type="button"
            onClick={() => {
              navigate('/portfolio');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            Portfolio
          </button>
          
          <button
            type="button"
            onClick={() => {
              navigate('/pricing');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            Pricing
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/faqs');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            FAQs
          </button>
          
          <button
            type="button"
            onClick={() => {
              navigate('/track-order');
              setIsMobileMenuOpen(false);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy-900)', padding: '0.5rem 0' }}
          >
            Track Order
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!safeIsAuthenticated ? (
              <>
                <button
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (openOrderWizard) {
                      openOrderWizard();
                    } else {
                      protectedNavigate('customer', true);
                    }
                  }}
                  style={{ fontWeight: 800, justifyContent: 'center', width: '100%' }}
                >
                  Get Started <ArrowRight size={16} style={{marginLeft: '0.25rem'}}/>
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{ fontWeight: 700, justifyContent: 'center', width: '100%', borderColor: 'var(--navy-300)' }}
                >
                  <User size={16} /> Client Login
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary-orange btn-lg"
                onClick={() => {
                  protectedNavigate('customer', false);
                  setIsMobileMenuOpen(false);
                  navigate('/client-portal');
                }}
                style={{ fontWeight: 800, justifyContent: 'center', width: '100%' }}
              >
                <User size={16} /> Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>"""

mobile_regex = re.compile(r'\{\/\* Mobile Slide-Down Navigation Drawer \*\/\}.*?<\/header>', re.DOTALL)

if mobile_regex.search(content):
    content = mobile_regex.sub(mobile_replacement, content)
    with open('HeaderNav.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Mobile Menu Replaced successfully")
else:
    print("Mobile Menu NOT FOUND!")
