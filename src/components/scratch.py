import re

with open('HeaderNav.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "} from 'lucide-react';",
    "  PenTool,\n  Image as ImageIcon,\n  Award,\n  HelpCircle,\n  Truck,\n  ArrowRight\n} from 'lucide-react';"
)

content = content.replace(
    "  const [mounted, setMounted] = useState(false);\n\n  useEffect(() => {\n    setMounted(true);\n  }, []);\n\n  const {",
    "  const [mounted, setMounted] = useState(false);\n  const [isScrolled, setIsScrolled] = useState(false);\n\n  useEffect(() => {\n    setMounted(true);\n    const handleScroll = () => setIsScrolled(window.scrollY > 20);\n    window.addEventListener('scroll', handleScroll);\n    return () => window.removeEventListener('scroll', handleScroll);\n  }, []);\n\n  const {"
)

content = content.replace(
    "<header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>",
    "<header style={{ position: 'sticky', top: 0, zIndex: 1000, background: isScrolled ? 'rgba(255, 255, 255, 0.85)' : '#ffffff', backdropFilter: isScrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid var(--border-color)', transition: 'all 0.3s ease', boxShadow: isScrolled ? 'var(--shadow-sm)' : 'none' }}>"
)

with open('HeaderNav.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done step 1')
