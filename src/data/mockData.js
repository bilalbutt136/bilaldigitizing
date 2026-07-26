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

export const INITIAL_CLIENTS = [
  { id: 'c-101', company: 'Apex Athletics Apparel', contact: 'Sarah Jenkins', email: 'sarah@apexapparel.com', totalOrders: 42, totalSpent: 890.50, tier: 'VIP Wholesale (15% Off)' },
  { id: 'c-102', company: 'Custom Cap Crafters', contact: 'Dave Miller', email: 'dave@customcaps.io', totalOrders: 18, totalSpent: 360.00, tier: 'Standard Client' },
  { id: 'c-103', company: 'Vintage Threads Co.', contact: 'Mia Thorne', email: 'mia@vintagethreads.com', totalOrders: 29, totalSpent: 620.00, tier: 'VIP Wholesale (15% Off)' },
  { id: 'c-104', company: 'Precision Promo Gear', contact: 'Robert Chen', email: 'rchen@precisionpromo.com', totalOrders: 12, totalSpent: 215.00, tier: 'Standard Client' }
];

export const INITIAL_ORDERS = [
  {
    id: '#9482',
    title: 'Golden Eagle Sports Club Logo',
    type: 'embroidery',
    serviceCategory: 'Left Chest / Polo',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: '2026-07-22T14:30:00Z',
    status: 'completed', // submitted | assigned | digitizing | qc | completed
    isRush: true,
    dimensions: { width: 3.5, height: 3.2, unit: 'inches' },
    fabricType: 'Pique Cotton Polo',
    colorsCount: 5,
    estimatedStitches: 11400,
    requestedFormats: ['dst', 'pes', 'emb', 'svg'],
    price: 27.10, // ($1.50 * 11.4) + $10 rush
    assignedDigitizerId: 'dig-1',
    notes: 'Please keep the yellow beak sharp and use underlay density suitable for pique cotton to prevent sinking.',
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: 'Golden_Eagle_Sports_Logo.dst',
    history: [
      { timestamp: '2026-07-22T14:30:00Z', label: 'Order Submitted by Client' },
      { timestamp: '2026-07-22T14:45:00Z', label: 'Assigned to Master Digitizer Alex Mercer' },
      { timestamp: '2026-07-22T16:20:00Z', label: 'Digitizing & Pathing Completed' },
      { timestamp: '2026-07-22T17:00:00Z', label: 'Quality Assurance Machine Simulation Passed' },
      { timestamp: '2026-07-22T17:15:00Z', label: 'Final DST & PES Files Released to Client' }
    ],
    revisions: []
  },
  {
    id: '#4419',
    title: 'Wildcat Firehouse Mascot - Raster to Vector',
    type: 'vector',
    serviceCategory: 'Vector Conversion / Color Sep',
    clientName: 'Custom Cap Crafters',
    clientEmail: 'dave@customcaps.io',
    createdAt: '2026-07-23T08:15:00Z',
    status: 'digitizing',
    isRush: false,
    dimensions: { width: 10.0, height: 8.5, unit: 'inches' },
    fabricType: 'Screen Print / Vinyl',
    colorsCount: 4,
    estimatedStitches: 0,
    requestedFormats: ['ai', 'eps', 'svg', 'pdf'],
    price: 25.00,
    assignedDigitizerId: 'dig-2',
    notes: 'Convert low-res JPG into clean line-art SVG/AI vector for 4-color screen printing.',
    artworkUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: null,
    history: [
      { timestamp: '2026-07-23T08:15:00Z', label: 'Order Submitted by Client' },
      { timestamp: '2026-07-23T08:30:00Z', label: 'Assigned to Vector Lead Elena Rostova' },
      { timestamp: '2026-07-23T09:00:00Z', label: 'Vector Tracing & Node Cleanup in Progress' }
    ],
    revisions: []
  },
  {
    id: '#9501',
    title: 'Titanium Motors 3D Puff Cap Logo',
    type: 'embroidery',
    serviceCategory: '3D Puff / Cap Front',
    clientName: 'Vintage Threads Co.',
    clientEmail: 'mia@vintagethreads.com',
    createdAt: '2026-07-23T09:45:00Z',
    status: 'assigned',
    isRush: true,
    dimensions: { width: 4.8, height: 2.2, unit: 'inches' },
    fabricType: 'Structured Snapback Cap',
    colorsCount: 2,
    estimatedStitches: 14200,
    requestedFormats: ['dst', 'exp', 'jef'],
    price: 36.30,
    assignedDigitizerId: 'dig-3',
    notes: 'Requires 3mm EVA foam compensation for 3D puff effect on letter "T". Center-out pathing for cap frame.',
    artworkUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: null,
    history: [
      { timestamp: '2026-07-23T09:45:00Z', label: 'Order Submitted by Client' },
      { timestamp: '2026-07-23T10:00:00Z', label: 'Assigned to Cap Specialist Marcus Vance' }
    ],
    revisions: []
  },
  {
    id: '#9515',
    title: 'Ironclad Biker Jacket Back Crest',
    type: 'embroidery',
    serviceCategory: 'Jacket Back / Large Crest',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: '2026-07-23T10:05:00Z',
    status: 'submitted',
    isRush: false,
    dimensions: { width: 11.5, height: 13.0, unit: 'inches' },
    fabricType: 'Heavy Denim Jacket',
    colorsCount: 7,
    estimatedStitches: 48500,
    requestedFormats: ['dst', 'pes', 'emb'],
    price: 72.75, // $1.50 * 48.5
    assignedDigitizerId: null,
    notes: 'Large jacket back design. High density fill with metallic gold thread simulation in center.',
    artworkUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: null,
    history: [
      { timestamp: '2026-07-23T10:05:00Z', label: 'Order Submitted by Client' }
    ],
    revisions: []
  }
];

export const PORTFOLIO_SAMPLES = [
  {
    id: 'port-1',
    title: 'Majestic Eagle Emblem',
    category: 'Left Chest & Polo',
    stitchCount: '12,450 Stitches',
    colors: '5 Thread Colors',
    originalImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    digitizedImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    description: 'Crisp satin stitch outline with dense fill underlay optimized for smooth pique knit fabric.'
  },
  {
    id: 'port-2',
    title: 'Cybernetics 3D Raised Cap Logo',
    category: '3D Puff Cap',
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
  }
];

export const SERVICES = [
  {
    id: 'left-chest',
    title: 'Left Chest & Polo Digitizing',
    price: 'Starting $10.00',
    stitches: 'Up to 10k Stitches',
    time: '12 - 24 Hours',
    icon: 'Shirt',
    desc: 'Perfect stitch density and underlay for polo shirts, corporate fleece, and dress shirts without puckering.'
  },
  {
    id: 'cap-3d-puff',
    title: 'Cap & 3D Puff Embroidery',
    price: 'Starting $12.00',
    stitches: 'Center-Out Pathing',
    time: '12 - 24 Hours',
    icon: 'HardHat',
    desc: 'Specialized curve distortion compensation, bottom-up pathing, and heavy foam capped ends for 3D raised caps.'
  },
  {
    id: 'jacket-back',
    title: 'Jacket Back & Large Crests',
    price: 'From $1.50 / 1k Stitches',
    stitches: '25,000 - 90,000+',
    time: '12 - 24 Hours',
    icon: 'Layers',
    desc: 'Intricate detail mapping for leather jackets, denim backs, and club crests with balanced thread tensions.'
  },
  {
    id: 'vector-conversion',
    title: 'Vector Artwork Conversion',
    price: 'Starting $15.00',
    stitches: 'Unlimited Resolution',
    time: '6 - 12 Hours',
    icon: 'PenTool',
    desc: 'Convert blurry images into ultra-crisp vector files (.AI, .EPS, .SVG, .PDF) ready for screen printing or vinyl.'
  },
  {
    id: 'applique-patches',
    title: 'Applique & Woven Patches',
    price: 'Starting $14.00',
    stitches: 'Cut-Line Included',
    time: '12 - 24 Hours',
    icon: 'Tag',
    desc: 'Precise fabric placement lines, tack-down stitches, and satin border edge locks for custom patches.'
  },
  {
    id: 'color-separation',
    title: 'Screen Print Separation',
    price: 'Starting $20.00',
    stitches: 'Spot / CMYK Color',
    time: '12 - 24 Hours',
    icon: 'Palette',
    desc: 'Professional spot color and simulated process color separations with registration marks for printers.'
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
