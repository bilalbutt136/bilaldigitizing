// Mock data for Embroidery Digitizing and Vector Artwork Platform

export const INITIAL_PRICING = {
  minOrderFee: 10.00,
  ratePerThousandStitches: 1.50,
  rushSurcharge: 10.00,
  vectorSimpleRate: 15.00,
  vectorComplexRate: 30.00,
  cap3dPuffSurcharge: 5.00,
};

export const MACHINE_FORMATS = [
  { id: 'dst', name: 'Tajima (.DST)', desc: 'Industry standard for commercial embroidery' },
  { id: 'pes', name: 'Brother / Baby Lock (.PES)', desc: 'Home & semi-pro embroidery machines' },
  { id: 'exp', name: 'Melco / Bernina (.EXP)', desc: 'Commercial & high-speed multi-needle' },
  { id: 'jef', name: 'Janome / Elna (.JEF)', desc: 'Janome format embroidery machines' },
  { id: 'hus', name: 'Husqvarna Viking (.HUS)', desc: 'Husqvarna embroidery machines' },
  { id: 'emb', name: 'Wilcom Master (.EMB)', desc: 'Native Wilcom vector embroidery source' },
  { id: 'ai', name: 'Adobe Illustrator (.AI)', desc: 'Vector artwork source file' },
  { id: 'svg', name: 'Scalable Vector (.SVG)', desc: 'Web & print vector graphics' },
  { id: 'eps', name: 'Encapsulated PostScript (.EPS)', desc: 'Screen printing & vector format' }
];

export const DIGITIZERS = [
  { id: 'dig-1', name: 'Alex Mercer', role: 'Master Embroidery Digitizer', rating: 4.9, activeJobs: 3, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'dig-2', name: 'Elena Rostova', role: 'Lead Vector Artist & Separation', rating: 5.0, activeJobs: 2, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
  { id: 'dig-3', name: 'Marcus Vance', role: '3D Puff & Cap Specialist', rating: 4.8, activeJobs: 4, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
];

export const PORTFOLIO_SAMPLES = [
  {
    id: 'port-1',
    title: 'Majestic Eagle Emblem',
    category: 'Embroidery Digitizing',
    stitchCount: '12,450 Stitches',
    colors: '5 Thread Colors',
    originalImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    description: 'Crisp satin stitch outline with dense fill underlay optimized for smooth pique knit fabric.'
  },
  {
    id: 'port-2',
    title: 'Cybernetics 3D Raised Cap Logo',
    category: 'Embroidery Digitizing',
    stitchCount: '15,800 Stitches',
    colors: '2 Thread Colors (3mm Foam)',
    originalImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    description: 'Precision capped ends for foam perforations with zero thread breaks on cap frames.'
  },
  {
    id: 'port-3',
    title: 'Vintage Skull & Rose Vector',
    category: 'Vector Art Conversion',
    stitchCount: 'N/A (Clean Vector)',
    colors: '4 Screen Separation Colors',
    originalImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    description: 'Raster JPG transformed into resolution-independent AI/SVG vector with pantone color matching.'
  },
  {
    id: 'port-4',
    title: 'Tactical Merrowed Border Patch',
    category: 'Custom Patches',
    stitchCount: '18,200 Stitches',
    colors: '6 Rayon Thread Colors',
    originalImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    description: 'High-density rayon thread embroidery with classic overlock merrowed border edges and heavy-duty velcro backing.'
  },
  {
    id: 'port-8',
    title: 'Tactical 3D Molded Rubber PVC Patch',
    category: 'Custom Patches',
    stitchCount: '3D Molded PVC',
    colors: '3 Color Molded Rubber',
    originalImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: '100% waterproof molded PVC patch with deep dimensional layers, laser-cut border edges, and tactical hook-and-loop velcro.'
  }
];

export const SERVICES = [
  {
    id: 'embroidery-digitizing',
    title: 'Commercial Embroidery Digitizing',
    price: 'Starting $10.00',
    stitches: 'DST, PES, EMB, EXP, VP3, JEF',
    time: '4 - 12 Hours',
    icon: 'Layers',
    route: '/services/embroidery-digitizing',
    desc: 'Production-ready embroidery machine files engineered for Tajima, Brother, Melco, Janome & Barudan machines with zero thread breaks.'
  },
  {
    id: 'vector-tracing',
    title: 'Raster to Scalable Vector Redraw',
    price: 'Starting $15.00',
    stitches: 'AI, EPS, SVG, PDF, CDR',
    time: '4 - 12 Hours',
    icon: 'PenTool',
    route: '/services/vector-tracing',
    desc: 'Transform pixelated JPEGs, PNGs, and sketches into 100% hand-drawn scalable vector files with Pantone color separation.'
  },
  {
    id: 'custom-patches',
    title: 'Physical Custom Patches & Emblems',
    price: 'Starting $1.50 / patch',
    stitches: 'Iron-On, Velcro & Sew-On',
    time: '3 - 5 Days + Express Ship',
    icon: 'Tag',
    route: '/custom-patches',
    desc: 'High-density embroidered, 3D molded waterproof PVC, woven, and laser-engraved leather patches with physical worldwide shipping.'
  }
];

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    serviceKey: 'embroidery',
    badge: 'COMMERCIAL DIGITIZING • STARTS $10.00',
    title: 'Commercial Embroidery Digitizing',
    highlight: '100% Machine Ready',
    description: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.',
    rateLabel: 'Starting from $10.00 / logo',
    primaryCta: 'Upload Embroidery Design',
    secondaryCta: 'View Digitizing Rates',
    bannerImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    trustPoints: [
      { title: '100% Manual Digitizing', sub: 'Wilcom master pathing, zero auto-trace' },
      { title: 'Free Revisions Included', sub: '100% satisfaction guaranteed' },
      { title: 'Machine-Ready Formats', sub: 'DST, PES, EXP, EMB, JEF, VP3' },
      { title: 'Super Fast 4-12 Hrs Delivery', sub: '24/7 express rush processing' }
    ]
  },
  {
    id: 'slide-2',
    serviceKey: 'vector',
    badge: 'VECTOR ART TRACING • STARTS $15.00',
    title: 'Raster to Scalable Vector Redraw',
    highlight: '100% Hand-Drawn Node Tracing',
    description: 'Transform low-resolution JPEGs, PNGs, and sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF, .CDR) with Pantone spot color separation for screen printing & vinyl cutting.',
    rateLabel: 'Starting from $15.00 flat',
    primaryCta: 'Upload Artwork for Vectoring',
    secondaryCta: 'View Vector Rates',
    bannerImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    trustPoints: [
      { title: 'Hand-Drawn Node Paths', sub: 'Clean curves & sharp vectors' },
      { title: 'Pantone Color Separation', sub: 'Screen printing & vinyl cut ready' },
      { title: 'Master Source Files Included', sub: 'AI, EPS, SVG, PDF, CDR' },
      { title: '4-8 Hour Delivery', sub: 'Same-day express delivery' }
    ]
  },
  {
    id: 'slide-3',
    serviceKey: 'patches',
    badge: 'CUSTOM PATCHES • STARTS $1.50 / PATCH',
    title: 'Physical Custom Patches & Emblems',
    highlight: 'Worldwide Physical Shipping',
    description: 'Order high-density embroidered patches, 3D molded waterproof PVC emblems, woven labels, and genuine laser-engraved leather patches with physical shipping worldwide.',
    rateLabel: 'Starting from $1.50 / patch',
    primaryCta: 'Order Custom Patches',
    secondaryCta: 'Explore Patch Tiers',
    bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    trustPoints: [
      { title: 'Velcro & Iron-On Backing', sub: 'Hook & loop, heat seal or sew-on' },
      { title: 'Classic Merrowed Borders', sub: 'Overlock edges & die-cut shapes' },
      { title: 'Waterproof 3D Molded PVC', sub: 'High-durability tactical rubber' },
      { title: '3-5 Days Production', sub: 'Express physical delivery' }
    ]
  }
];

export const FAQS = [
  {
    q: 'What machine format files will I receive?',
    a: 'You will receive your digitized design in all standard commercial and home formats including Tajima (.DST), Brother (.PES), Melco (.EXP), Janome (.JEF), Husqvarna (.HUS), Barudan, and native Wilcom (.EMB). We can also provide custom formats upon request.'
  },
  {
    q: 'What is your turnaround time for digitizing and vector conversion?',
    a: 'Our standard turnaround time is 12 to 24 hours. If you need urgent delivery, we offer Rush Service (delivered within 4 to 8 hours) for a nominal fee.'
  },
  {
    q: 'How do you ensure stitch quality and prevent fabric puckering?',
    a: 'Every design is custom pathing-mapped by experienced master digitizers. We tailor the stitch underlay, pull compensation, and density specifically to your target fabric (e.g., Pique, Performance Poly, Denim, Cap Frame).'
  },
  {
    q: 'What if I need revisions or minor edits to my digitized file?',
    a: 'We offer FREE unlimited revisions on all orders! If you need size adjustments, color edits, or density tweaks, simply click "Request Revision" in your Client Portal and our team will update it within 4-6 hours.'
  },
  {
    q: 'How is the pricing calculated for custom digitizing?',
    a: 'Our pricing starts at $10.00 for standard left-chest logos up to 10,000 stitches. Larger designs are priced at a transparent $1.50 per 1,000 stitches. Vector artwork starts at $15.00 flat depending on complexity.'
  }
];
