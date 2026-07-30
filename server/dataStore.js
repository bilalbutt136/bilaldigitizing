// In-memory & Persistent Data Store for Express Server

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
  { id: 'c-101', company: 'Apex Athletics Apparel', contact: 'Sarah Jenkins', email: 'sarah@apexapparel.com', totalOrders: 42, totalSpent: 890.50, tier: 'VIP Wholesale (15% Off)', walletBalance: 125.00 },
  { id: 'c-102', company: 'Custom Cap Crafters', contact: 'Dave Miller', email: 'dave@customcaps.io', totalOrders: 18, totalSpent: 360.00, tier: 'Standard Client', walletBalance: 45.00 },
  { id: 'c-103', company: 'Vintage Threads Co.', contact: 'Mia Thorne', email: 'mia@vintagethreads.com', totalOrders: 29, totalSpent: 620.00, tier: 'VIP Wholesale (15% Off)', walletBalance: 210.00 },
  { id: 'c-104', company: 'Precision Promo Gear', contact: 'Robert Chen', email: 'rchen@precisionpromo.com', totalOrders: 12, totalSpent: 215.00, tier: 'Standard Client', walletBalance: 0.00 }
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
    price: 72.75,
    assignedDigitizerId: null,
    notes: 'Large jacket back design. High density fill with metallic gold thread simulation in center.',
    artworkUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: null,
    history: [
      { timestamp: '2026-07-23T10:05:00Z', label: 'Order Submitted by Client' }
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
    createdAt: '2026-07-24T11:20:00Z',
    status: 'digitizing',
    isRush: false,
    quantity: 100,
    backing: 'Velcro Hook & Loop',
    borderType: 'Merrowed Die-Cut Border',
    dimensions: { width: 3.5, height: 3.5, unit: 'inches' },
    price: 185.00,
    artworkUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    history: [
      { timestamp: '2026-07-24T11:20:00Z', label: 'Patch Order Confirmed & In Production' }
    ],
    revisions: []
  },
  {
    id: '#S-3104',
    title: 'Master Monogram Embroidery Font Pack (25 DST/PES Styles)',
    type: 'store',
    serviceCategory: 'Digital Store Download',
    clientName: 'Apex Athletics Apparel',
    clientEmail: 'sarah@apexapparel.com',
    createdAt: '2026-07-25T16:45:00Z',
    status: 'completed',
    isStoreItem: true,
    fileFormats: ['DST', 'PES', 'EXP', 'EMB', 'AI'],
    price: 39.00,
    artworkUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    outputFileUrl: 'Master_Monogram_Font_Pack_v2.zip',
    history: [
      { timestamp: '2026-07-25T16:45:00Z', label: 'Instant License Purchase Completed' }
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

export const DEFAULT_SITE_SETTINGS = {
  siteTitle: 'B Digitizing & Vector Studio',
  supportEmail: 'orders@bdigitizing.pro',
  contactPhone: '+1 (800) 555-DIGI',
  bannerNotice: '⚡ 4-Hour Express Turnaround Available | Guaranteed Commercial Quality',
  operationalStatus: 'Online & Processing',
  currencySymbol: '$',
  adminEmail: 'shahidbutt59191@gmail.com'
};

export const STORE_ITEMS = [
  {
    id: 'store-1',
    title: 'Master Monogram Embroidery Font Pack',
    category: 'Fonts & Alphabets',
    price: 39.00,
    originalPrice: 79.00,
    badge: 'BESTSELLER',
    rating: 5.0,
    reviews: 48,
    formats: ['DST', 'PES', 'EXP', 'EMB', 'JEF'],
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    description: '25 high-precision serif and script monogram fonts pre-digitized for commercial embroidery machines.'
  },
  {
    id: 'store-2',
    title: 'Tactical Skull & Military Badge Vector Set',
    category: 'Vector Bundles',
    price: 29.00,
    originalPrice: 59.00,
    badge: 'POPULAR',
    rating: 4.9,
    reviews: 32,
    formats: ['AI', 'EPS', 'SVG', 'PNG', 'PDF'],
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    description: '100% clean hand-drawn vector elements ready for screen printing, laser engraving & embroidery.'
  },
  {
    id: 'store-3',
    title: '3D Puff Athletic Numbers (0-9)',
    category: 'Digitized Packs',
    price: 24.00,
    originalPrice: 45.00,
    badge: '3D PUFF',
    rating: 4.8,
    reviews: 19,
    formats: ['DST', 'PES', 'EXP', 'EMB'],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    description: 'Pre-punched 3D puff sports jersey numbers with foam perforation underlays.'
  }
];

class DataStore {
  constructor() {
    this.pricing = { ...INITIAL_PRICING };
    this.clients = [...INITIAL_CLIENTS];
    this.orders = [...INITIAL_ORDERS];
    this.digitizers = [...DIGITIZERS];
    this.portfolio = [...PORTFOLIO_SAMPLES];
    this.storeItems = [...STORE_ITEMS];
    this.siteSettings = { ...DEFAULT_SITE_SETTINGS };
    this.users = [
      {
        id: 'u-admin-1',
        email: 'shahidbutt59191@gmail.com',
        role: 'admin',
        name: 'Shahid Butt (Master Admin)',
        company: 'B Digitizing Studio'
      },
      {
        id: 'u-client-1',
        email: 'sarah@apexapparel.com',
        role: 'client',
        name: 'Sarah Jenkins',
        company: 'Apex Athletics Apparel'
      }
    ];
  }

  // Auth Methods
  login(email, password, role = 'client') {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (cleanEmail === this.siteSettings.adminEmail.toLowerCase() || cleanEmail === 'shahidbutt59191@gmail.com' || role === 'admin') {
      return {
        user: {
          id: 'u-admin-1',
          email: cleanEmail,
          role: 'admin',
          name: 'Studio Master Admin',
          company: 'B Digitizing & Vector Studio'
        },
        token: `mock-jwt-admin-${Date.now()}`
      };
    }

    let existingClient = this.clients.find(c => c.email.toLowerCase() === cleanEmail);
    if (!existingClient) {
      existingClient = {
        id: `c-${Date.now()}`,
        company: cleanEmail.split('@')[0] + ' Enterprise',
        contact: cleanEmail.split('@')[0],
        email: cleanEmail,
        totalOrders: 0,
        totalSpent: 0,
        tier: 'Standard Client',
        walletBalance: 0.00
      };
      this.clients.push(existingClient);
    }

    return {
      user: {
        id: existingClient.id,
        email: existingClient.email,
        role: 'client',
        name: existingClient.contact,
        company: existingClient.company
      },
      token: `mock-jwt-client-${Date.now()}`
    };
  }

  signup(email, name, company) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    let existingClient = this.clients.find(c => c.email.toLowerCase() === cleanEmail);
    if (!existingClient) {
      existingClient = {
        id: `c-${Date.now()}`,
        company: company || (cleanEmail.split('@')[0] + ' Enterprise'),
        contact: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        totalOrders: 0,
        totalSpent: 0,
        tier: 'Standard Client',
        walletBalance: 0.00
      };
      this.clients.push(existingClient);
    }
    return {
      user: {
        id: existingClient.id,
        email: existingClient.email,
        role: 'client',
        name: existingClient.contact,
        company: existingClient.company
      },
      token: `mock-jwt-client-${Date.now()}`
    };
  }

  // Dynamic Pricing Calculation logic
  calculatePrice({ type, estimatedStitches = 0, isRush = false, serviceCategory = '', quantity = 1, complexity = 'simple', patchSize = 3.5 }) {
    let basePrice = 0;
    const config = this.pricing;

    if (type === 'embroidery') {
      const thousands = Math.max(1, Math.ceil(estimatedStitches / 1000));
      basePrice = thousands * config.ratePerThousandStitches;
      if (basePrice < config.minOrderFee) {
        basePrice = config.minOrderFee;
      }
      if (serviceCategory.toLowerCase().includes('3d') || serviceCategory.toLowerCase().includes('cap')) {
        basePrice += config.cap3dPuffSurcharge;
      }
    } else if (type === 'vector') {
      basePrice = complexity === 'complex' ? config.vectorComplexRate : config.vectorSimpleRate;
    } else if (type === 'patch') {
      const unitRate = patchSize > 4 ? 2.50 : 1.50;
      basePrice = Math.max(1, quantity) * unitRate;
    } else if (type === 'store') {
      basePrice = 29.00;
    }

    if (isRush) {
      basePrice += config.rushSurcharge;
    }

    return parseFloat(basePrice.toFixed(2));
  }

  // Orders
  getOrders(clientEmail = null) {
    if (clientEmail) {
      return this.orders.filter(o => o.clientEmail.toLowerCase() === clientEmail.toLowerCase());
    }
    return this.orders;
  }

  createOrder(orderData) {
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = orderData.type === 'patch' ? '#P-' : orderData.type === 'store' ? '#S-' : '#';
    const newId = `${prefix}${idNum}`;

    const calculatedPrice = this.calculatePrice({
      type: orderData.type || 'embroidery',
      estimatedStitches: orderData.estimatedStitches || 0,
      isRush: orderData.isRush || false,
      serviceCategory: orderData.serviceCategory || '',
      quantity: orderData.quantity || 1
    });

    const newOrder = {
      id: newId,
      title: orderData.title || 'Custom Order Design',
      type: orderData.type || 'embroidery',
      serviceCategory: orderData.serviceCategory || 'Embroidery Digitizing',
      clientName: orderData.clientName || 'Valued Client',
      clientEmail: orderData.clientEmail || 'client@bdigitizing.pro',
      createdAt: new Date().toISOString(),
      status: 'submitted',
      isRush: !!orderData.isRush,
      dimensions: orderData.dimensions || { width: 4.0, height: 4.0, unit: 'inches' },
      fabricType: orderData.fabricType || 'Standard Cotton',
      colorsCount: orderData.colorsCount || 3,
      estimatedStitches: orderData.estimatedStitches || 10000,
      requestedFormats: orderData.requestedFormats || ['dst', 'pes', 'emb'],
      price: orderData.price || calculatedPrice,
      assignedDigitizerId: null,
      notes: orderData.notes || '',
      artworkUrl: orderData.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      outputFileUrl: null,
      history: [
        { timestamp: new Date().toISOString(), label: 'Order Submitted via Next.js Frontend API' }
      ],
      revisions: []
    };

    this.orders.unshift(newOrder);

    // Update Client Stats
    const client = this.clients.find(c => c.email.toLowerCase() === newOrder.clientEmail.toLowerCase());
    if (client) {
      client.totalOrders += 1;
      client.totalSpent += newOrder.price;
    }

    return newOrder;
  }

  updateOrderStatus(orderId, status, digitizerId = null, outputFileUrl = null) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;
    order.status = status;
    if (digitizerId) order.assignedDigitizerId = digitizerId;
    if (outputFileUrl) order.outputFileUrl = outputFileUrl;

    const labelMap = {
      assigned: `Assigned to Digitizer`,
      digitizing: `Digitizing & Vector Pathing in Progress`,
      qc: `Quality Assurance Check Passed`,
      completed: `Files Released & Completed`
    };

    order.history.push({
      timestamp: new Date().toISOString(),
      label: labelMap[status] || `Status updated to ${status}`
    });

    return order;
  }

  addRevision(orderId, revisionNotes, clientName = 'Client') {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    const revisionObj = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      requestedBy: clientName,
      notes: revisionNotes,
      status: 'pending'
    };

    order.revisions.push(revisionObj);
    order.status = 'digitizing';
    order.history.push({
      timestamp: new Date().toISOString(),
      label: `Revision Requested: "${revisionNotes.slice(0, 40)}..."`
    });

    return order;
  }

  // Client Wallet
  depositWallet(email, amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;
    let client = this.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!client) {
      client = {
        id: `c-${Date.now()}`,
        company: email.split('@')[0] + ' Enterprise',
        contact: email.split('@')[0],
        email: email,
        totalOrders: 0,
        totalSpent: 0,
        tier: 'Standard Client',
        walletBalance: 0.00
      };
      this.clients.push(client);
    }
    client.walletBalance = parseFloat((client.walletBalance + numAmount).toFixed(2));
    return client;
  }

  deductWallet(email, amount) {
    const numAmount = parseFloat(amount);
    let client = this.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!client || client.walletBalance < numAmount) return null;
    client.walletBalance = parseFloat((client.walletBalance - numAmount).toFixed(2));
    return client;
  }
}

export const store = new DataStore();
