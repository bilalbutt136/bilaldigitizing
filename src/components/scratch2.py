import re

with open('HeaderNav.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Navigation Block
nav_replacement = """          <nav className="desktop-only" style={{ alignItems: 'center', gap: '1.75rem' }}>
            {/* Home Link */}
            <button 
              onClick={handleGoHome}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: currentPath === '/' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Home
            </button>

            {/* Services Dropdown Item */}
            <div 
              ref={servicesDropdownRef}
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button 
                onClick={() => {
                  handleNavClick('services');
                  setIsServicesOpen(!isServicesOpen);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: (currentPath.includes('/services') || currentPath === '/custom-patches') ? 'var(--orange-600)' : 'var(--navy-800)', 
                  fontWeight: (currentPath.includes('/services') || currentPath === '/custom-patches') ? 800 : 600, 
                  fontSize: '0.925rem', 
                  cursor: 'pointer', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'color 0.15s ease'
                }}
              >
                Services <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: isServicesOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {/* Services Dropdown Popup Card Menu */}
              {isServicesOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  paddingTop: '8px',
                  zIndex: 2000
                }}>
                  <div style={{
                    width: '240px',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    animation: 'fadeIn 0.15s ease-out'
                  }}>
                    {/* Option 1: Embroidery Digitizing */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/services/embroidery-digitizing');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                      }}
                    >
                      <PenTool size={16} /> Embroidery Digitizing
                    </button>

                    {/* Option 2: Vector Art */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/services/vector-tracing');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                      }}
                    >
                      <ImageIcon size={16} /> Vector Art
                    </button>
                    
                    {/* Option 3: Custom Patches */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('public');
                        navigate('/custom-patches');
                        setIsServicesOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.85rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.color = 'var(--orange-600)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--navy-900)';
                      }}
                    >
                      <Award size={16} /> Custom Patches
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/portfolio');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/portfolio' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: currentPath === '/portfolio' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Portfolio
            </button>
            
            {/* Pricing Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/pricing');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/pricing' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: currentPath === '/pricing' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Pricing
            </button>
            
            {/* FAQs Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/faqs');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/faqs' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: currentPath === '/faqs' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              FAQs
            </button>
            
            {/* Track Order Link */}
            <button 
              onClick={() => {
                setCurrentView('public');
                navigate('/track-order');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: currentPath === '/track-order' ? 'var(--orange-600)' : 'var(--navy-800)', 
                fontWeight: currentPath === '/track-order' ? 800 : 600, 
                fontSize: '0.925rem', 
                cursor: 'pointer', 
                padding: 0 
              }}
            >
              Track Order
            </button>
          </nav>"""

nav_regex = re.compile(r'<nav className="desktop-only" style={{ alignItems: \'center\', gap: \'1\.75rem\' }}>.*?</nav>', re.DOTALL)

if nav_regex.search(content):
    content = nav_regex.sub(nav_replacement, content)
    with open('HeaderNav.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Desktop Nav Replaced successfully")
else:
    print("Desktop Nav NOT FOUND!")
