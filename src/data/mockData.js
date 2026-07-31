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
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    turnaroundHours: 12,
    status: 'completed',
    isRush: true,
    dimensions: { width: 3.5, height: 3.2, unit: 'inches' },
    fabricType: 'Pique Cotton Polo',
    colorsCount: 5,
    estimatedStitches: 11400,
    requestedFormats: ['dst', 'pes', 'emb', 'svg'],
    price: 27.10,
    assignedDigitizerId: 'dig-1',
    notes: 'Please keep the yellow beak sharp and use underlay density suitable for pique cotton to prevent sinking.',
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: 'Golden_Eagle_Sports_Logo.dst',
    uploadedMachineFiles: [
      { name: 'Golden_Eagle_Sports_Logo.dst', format: 'dst', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { name: 'Golden_Eagle_Sports_Logo.pes', format: 'pes', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { name: 'Golden_Eagle_Sports_Logo_Worksheet.pdf', format: 'pdf', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString() }
    ],
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), label: 'Order Placement Confirmed by Sarah Jenkins' },
      { timestamp: new Date(Date.now() - 3600000 * 16).toISOString(), label: 'Assigned to Master Digitizer Alex Mercer' },
      { timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), label: 'Digitizing & Machine Pathing Completed' },
      { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), label: 'Files Uploaded: .DST, .PES, and PDF Production Worksheet' },
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), label: 'Order Marked Completed by Client' }
    ],
    messages: [
      { id: 'm-1', sender: 'Sarah Jenkins', senderRole: 'client', text: 'Hi Alex, please ensure the yellow beak stitch line is extra sharp!', timestamp: new Date(Date.now() - 3600000 * 17).toISOString() },
      { id: 'm-2', sender: 'Alex Mercer', senderRole: 'admin', text: 'Noted Sarah! Added double zig-zag underlay for pique fabric stability.', timestamp: new Date(Date.now() - 3600000 * 15).toISOString() }
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
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    turnaroundHours: 12,
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
      { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), label: 'Order Submitted by Client Dave Miller' },
      { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), label: 'Assigned to Lead Vector Artist Elena Rostova' },
      { timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), label: 'Vector Tracing & Pantone Color Separation in Progress' }
    ],
    messages: [
      { id: 'm-3', sender: 'Dave Miller', senderRole: 'client', text: 'Can we get color separation for white, red, yellow, and black inks?', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString() },
      { id: 'm-4', sender: 'Elena Rostova', senderRole: 'admin', text: 'Working on clean node vector traces right now! Will upload .AI and .SVG shortly.', timestamp: new Date(Date.now() - 3600000 * 1).toISOString() }
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
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    turnaroundHours: 4,
    status: 'revision',
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
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), label: 'Express Order Placed (4-Hour Turnaround)' },
      { timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), label: 'Assigned to Cap Specialist Marcus Vance' },
      { timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), label: 'Client Requested Revision for Foam Density' }
    ],
    messages: [
      { id: 'm-5', sender: 'Mia Thorne', senderRole: 'client', text: 'Please increase the puff density around the outer edges so the foam does not show through.', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() }
    ],
    revisions: [
      { id: 'rev-1', requestedBy: 'Mia Thorne', notes: 'Please increase the puff density around the outer edges so foam does not show through.', createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString() }
    ]
  },
  {
    id: '#9515',
    title: 'Ironclad Biker Jacket Back Crest',
    type: 'embroidery',
    serviceCategory: 'Jacket Back / Large Crest',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    turnaroundHours: 12,
    status: 'submitted',
    isRush: false,
    dimensions: { width: 11.5, height: 13.0, unit: 'inches' },
    fabricType: 'Heavy Denim Jacket',
    colorsCount: 7,
    estimatedStitches: 48500,
    requestedFormats: ['dst', 'pes', 'emb'],
    price: 72.75,
    assignedDigitizerId: null,
    notes: 'Large jacket back design. High density fill with metallic gold thread simulation in center.',
    artworkUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: null,
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), label: 'New Brief Submitted by Client' }
    ],
    messages: [],
    revisions: []
  },
  {
    id: '#9530',
    title: 'Precision Crest Delivered Package',
    type: 'embroidery',
    serviceCategory: 'Left Chest / Crest',
    clientName: 'Precision Promo Gear',
    clientEmail: 'rchen@precisionpromo.com',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    turnaroundHours: 12,
    status: 'delivered',
    isRush: false,
    dimensions: { width: 3.8, height: 3.5, unit: 'inches' },
    fabricType: 'Soft Shell Jacket',
    colorsCount: 3,
    estimatedStitches: 9800,
    requestedFormats: ['dst', 'pes', 'emb', 'pdf'],
    price: 15.00,
    assignedDigitizerId: 'dig-1',
    notes: 'Soft shell jacket underlay to prevent puckering.',
    artworkUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: 'Precision_Crest_Master.dst',
    uploadedMachineFiles: [
      { name: 'Precision_Crest_Master.dst', format: 'dst', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
      { name: 'Precision_Crest_Master.emb', format: 'emb', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
      { name: 'Precision_Crest_Worksheet.pdf', format: 'pdf', type: 'finished_machine_file', uploadedAt: new Date(Date.now() - 3600000 * 1.5).toISOString() }
    ],
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), label: 'Order Placement Confirmed' },
      { timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), label: 'Finished Machine Files Delivered to Client for Review' }
    ],
    messages: [
      { id: 'm-6', sender: 'Master Admin', senderRole: 'admin', text: 'Your completed files (.DST, .EMB, .PDF) have been uploaded! Please inspect the stitch-out sheet.', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() }
    ],
    revisions: []
  },
  {
    id: '#P-8820',
    title: 'Apex Tactical Embroidered Patches (100 Pcs)',
    type: 'patch',
    serviceCategory: 'Custom Embroidered Patch',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    turnaroundHours: 48,
    status: 'digitizing',
    isRush: false,
    quantity: 100,
    backing: 'Velcro Hook & Loop',
    borderType: 'Merrowed Die-Cut Border',
    dimensions: { width: 3.5, height: 3.5, unit: 'inches' },
    price: 185.00,
    artworkUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), label: 'Patch Order Confirmed & In Production' }
    ],
    messages: [],
    revisions: []
  },
  {
    id: '#S-3104',
    title: 'Master Monogram Embroidery Font Pack (25 DST/PES Styles)',
    type: 'store',
    serviceCategory: 'Digital Store Download',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    turnaroundHours: 1,
    status: 'completed',
    isStoreItem: true,
    fileFormats: ['DST', 'PES', 'EXP', 'EMB', 'AI'],
    price: 39.00,
    artworkUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: 'Master_Monogram_Font_Pack_v2.zip',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), label: 'Instant License Purchase Completed' }
    ],
    messages: [],
    revisions: []
  }
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
    title: 'Embroidery Digitizing',
    price: 'Starting $10.00',
    stitches: 'DST, PES, EMB, EXP Files',
    time: '8 - 12 Hours',
    icon: 'Layers',
    route: '/services/embroidery-digitizing',
    desc: 'Commercial machine-ready files for polos, jackets, caps, and left chest logos with zero thread breaks.'
  },
  {
    id: 'vector-tracing',
    title: 'Vector Tracing & Redrawing',
    price: 'Starting $15.00',
    stitches: 'AI, EPS, SVG, PDF, CDR',
    time: '6 - 12 Hours',
    icon: 'PenTool',
    route: '/services/vector-tracing',
    desc: 'Transform pixelated JPEGs, PNGs, and sketches into 100% hand-drawn scalable vector files for printing & embroidery.'
  },
  {
    id: 'custom-patches',
    title: 'Physical Custom Patches & Emblems',
    price: 'Starting $1.50 / patch',
    stitches: 'Iron-On, Velcro & Sew-On',
    time: '3 - 5 Days + Express Ship',
    icon: 'Tag',
    route: '/custom-patches',
    desc: 'High-density embroidered, leather, and PVC custom patches with merrowed borders and physical worldwide shipping.'
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
