require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const cmsData = [
    {
      key: 'trust_stats',
      value: [
        { label: 'Orders Completed', value: '50K+', icon: 'Trophy' },
        { label: 'Happy Clients', value: '12K+', icon: 'Users' },
        { label: 'Success Rate', value: '99%', icon: 'Star' },
        { label: 'Avg Turnaround', value: '12h', icon: 'Clock' }
      ]
    },
    {
      key: 'process_steps',
      value: [
        {
          title: 'Submit Design',
          description: 'Upload your artwork and requirements through our portal.',
          icon: 'UploadCloud'
        },
        {
          title: 'Digital Proof',
          description: 'Review and approve the digital mockup of your patch.',
          icon: 'FileCheck'
        },
        {
          title: 'Production',
          description: 'We manufacture your patches using premium materials.',
          icon: 'Settings'
        },
        {
          title: 'Delivery',
          description: 'Your physical patches are shipped globally.',
          icon: 'Truck'
        }
      ]
    },
    {
      key: 'patch_timeline',
      value: [
        { label: 'Digital Proof', value: '24-48 Hours' },
        { label: 'Physical Sample (Optional)', value: '3-5 Days' },
        { label: 'Full Production', value: '10-14 Days' },
        { label: 'Global Shipping', value: '3-7 Days' }
      ]
    },
    {
      key: 'apparel_size_chart',
      value: [
        { size: 'XS', chest: '32-34"', waist: '26-28"' },
        { size: 'S', chest: '35-37"', waist: '29-31"' },
        { size: 'M', chest: '38-40"', waist: '32-34"' },
        { size: 'L', chest: '41-43"', waist: '35-37"' },
        { size: 'XL', chest: '44-46"', waist: '38-40"' },
        { size: '2XL', chest: '47-49"', waist: '41-43"' },
        { size: '3XL', chest: '50-53"', waist: '44-47"' }
      ]
    },
    {
      key: 'embroidery_cards',
      value: [
        {
          title: 'Left Chest / Hat',
          price: '$15',
          description: 'Ideal for standard logos on polos, hats, and jackets.',
          turnaround: '12-24 Hours',
          features: ['Up to 5" Wide', 'Any Format (DST, PES, etc.)', 'Unlimited Revisions', 'Free PDF Proof'],
          popular: true
        },
        {
          title: 'Jacket Back',
          price: '$35',
          description: 'Large intricate designs for jacket backs.',
          turnaround: '24-48 Hours',
          features: ['Up to 12" Wide', 'High Detail', 'Unlimited Revisions', 'Free PDF Proof'],
          popular: false
        },
        {
          title: '3D Puff',
          price: '$25',
          description: 'Specialized 3D puff digitizing for hats.',
          turnaround: '24 Hours',
          features: ['Standard Hat Sizes', 'Optimized for Foam', 'Unlimited Revisions', 'Free PDF Proof'],
          popular: false
        },
        {
          title: 'Complex Vector to Stitches',
          price: 'Custom',
          description: 'Highly complex artwork requiring manual tracing before digitizing.',
          turnaround: '48 Hours',
          features: ['Vector Tracing Included', 'Any Size', 'Unlimited Revisions', 'Free PDF Proof'],
          popular: false
        }
      ]
    },
    {
      key: 'vector_cards',
      value: [
        {
          title: 'Simple Conversion',
          price: '$15',
          description: 'Clean up simple logos and raster images into scalable vectors.',
          turnaround: '12-24 Hours',
          features: ['1-3 Colors', 'Standard Formats (AI, EPS, SVG)', 'Unlimited Revisions', 'Ready for Print'],
          popular: false
        },
        {
          title: 'Standard Illustration',
          price: '$25',
          description: 'Detailed logos, complex graphics, and multi-color illustrations.',
          turnaround: '24 Hours',
          features: ['Up to 8 Colors', 'High Detail', 'Unlimited Revisions', 'Source Files Included'],
          popular: true
        },
        {
          title: 'Complex Tracing',
          price: '$45+',
          description: 'Highly detailed photos, intricate artwork, or blueprints to vector.',
          turnaround: '48+ Hours',
          features: ['Unlimited Colors', 'Extreme Detail', 'Unlimited Revisions', 'All Source Files'],
          popular: false
        },
        {
          title: 'Color Separation',
          price: '$20',
          description: 'Vector separation for screen printing (spot colors).',
          turnaround: '24 Hours',
          features: ['Halftones included', 'Registration Marks', 'Unlimited Revisions', 'Print Ready'],
          popular: false
        }
      ]
    },
    {
      key: 'format_options',
      value: [
        { id: 'dst', label: '.DST (Tajima)' },
        { id: 'pes', label: '.PES (Brother)' },
        { id: 'emb', label: '.EMB (Wilcom)' },
        { id: 'jef', label: '.JEF (Janome)' },
        { id: 'hus', label: '.HUS (Husqvarna)' },
        { id: 'xxx', label: '.XXX (Singer)' },
        { id: 'pdf', label: 'PDF Production Sheet' }
      ]
    },
    {
      key: 'placement_options',
      value: [
        { id: 'left_chest', label: 'Left Chest' },
        { id: 'hat_front', label: 'Hat Front' },
        { id: 'hat_side', label: 'Hat Side / Back' },
        { id: 'jacket_back', label: 'Jacket Back' },
        { id: 'sleeve', label: 'Sleeve' },
        { id: 'bag', label: 'Bag / Tote' },
        { id: 'other', label: 'Other (Specify in notes)' }
      ]
    },
    {
      key: 'trust_features',
      value: [
        { icon: 'Award', title: '15+ Years Experience', desc: 'Decades of expertise handling complex designs for global brands.' },
        { icon: 'MousePointer2', title: '100% Manual Digitizing', desc: 'No auto-tracing. Every stitch and node is manually plotted for perfection.' },
        { icon: 'RefreshCw', title: 'Free Unlimited Revisions', desc: 'We tweak and refine until you are 100% satisfied with the result.' },
        { icon: 'Globe', title: 'Worldwide Delivery', desc: 'Express shipping for patches, instant downloads for digital files globally.' },
        { icon: 'Headset', title: '24/7 Support', desc: 'Round-the-clock customer service ready to answer technical queries.' },
        { icon: 'Shield', title: 'Secure Payments', desc: 'Enterprise-grade encryption for all your transactions and files.' },
        { icon: 'ThumbsUp', title: 'Satisfaction Guarantee', desc: 'Premium quality guaranteed on every single order, large or small.' }
      ]
    },
    {
      key: 'why_choose_us_steps',
      value: [
        { step: '01', icon: 'Upload', title: 'Select Service & Upload', desc: 'Choose your desired service and upload your artwork with specifications.' },
        { step: '02', icon: 'Layers', title: 'Expert Processing', desc: 'Our studio experts process your design via digitizing, vector tracing, or patch prototyping.' },
        { step: '03', icon: 'FileCheck', title: 'Quality Assurance', desc: 'Every order undergoes strict quality checks and digital proofing before finalization.' },
        { step: '04', icon: 'Download', title: 'Instant Delivery / Shipping', desc: 'Download digital files instantly or receive your physical patches via express shipping.' }
      ]
    },
    {
      key: 'vector_format_options',
      value: [
        { id: 'ai', name: 'Adobe Illustrator (.AI)', ext: '.AI' },
        { id: 'eps', name: 'Encapsulated PostScript (.EPS)', ext: '.EPS' },
        { id: 'svg', name: 'Scalable Vector Graphics (.SVG)', ext: '.SVG' },
        { id: 'pdf', name: 'Vector PDF Document (.PDF)', ext: '.PDF' },
        { id: 'cdr', name: 'CorelDRAW (.CDR)', ext: '.CDR' },
        { id: 'png', name: 'High-Res Transparent (.PNG)', ext: '.PNG (Transparent)' }
      ]
    },
    {
      key: 'portfolio_categories',
      value: [
        { key: 'all', label: 'All Portfolio' },
        { key: 'embroidery', label: 'Embroidery Digitizing' },
        { key: 'vector', label: 'Vector Art Conversion' },
        { key: 'patches', label: 'Custom Patches' }
      ]
    },
    {
      key: 'order_wizard_formats',
      value: ['dst', 'pes', 'emb', 'svg']
    }
  ];

  for (const item of cmsData) {
    const { error } = await supabase.from('cms_content').upsert(item, { onConflict: 'key' });
    if (error) console.error('Error upserting', item.key, error);
    else console.log('Successfully upserted', item.key);
  }
}
seed();
