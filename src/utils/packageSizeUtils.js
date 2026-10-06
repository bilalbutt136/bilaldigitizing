/**
 * Package Size Resolution & Formatting Utility
 * Extracts and maps accurate physical size boundaries for every package tier
 * across Embroidery Digitizing, Vector Art Conversion, and Custom Patches.
 */

export const getPackageSizeInfo = (pkg, service = 'embroidery', index = 0) => {
  if (pkg?.sizeLimit) {
    return {
      limit: pkg.sizeLimit,
      label: pkg.sizeLabel || pkg.sizeLimit,
      maxInches: pkg.maxSizeInches || 4.0,
      examples: pkg.sizeExamples || ''
    };
  }

  const text = `${pkg?.title || ''} ${pkg?.subtitle || ''} ${(pkg?.features || []).join(' ')}`.toLowerCase();

  if (text.includes('12') || text.includes('full back') || text.includes('puff') || text.includes('pro') || text.includes('complex')) {
    return {
      limit: service === 'patch' ? 'Up to 5" × 5"+' : (service === 'vector' ? 'Any Size (Scalable)' : 'Up to 12" × 12"'),
      label: service === 'patch' ? 'Large (Up to 5"+)' : (service === 'vector' ? 'Full Detail / Large' : 'Full Back (Up to 12")'),
      maxInches: service === 'patch' ? 5.0 : (service === 'vector' ? 24.0 : 12.0),
      examples: service === 'patch' ? 'Back / Tactical Patches' : (service === 'vector' ? 'Detailed Art & Murals' : 'Jacket Back, Hoodies & Oversized')
    };
  }

  if (text.includes('7') || text.includes('jacket') || text.includes('sleeve') || text.includes('mid') || text.includes('popular') || text.includes('standard')) {
    return {
      limit: service === 'vector' ? 'Up to 8" × 8"' : (service === 'patch' ? 'Up to 4" × 4"' : 'Up to 7" × 7"'),
      label: service === 'vector' ? 'Medium (Up to 8")' : (service === 'patch' ? 'Medium (Up to 4")' : 'Mid-Size (Up to 7")'),
      maxInches: service === 'vector' ? 8.0 : (service === 'patch' ? 4.0 : 7.0),
      examples: service === 'patch' ? 'Uniform & Sleeve Patches' : (service === 'vector' ? 'Mascots & Crests' : 'Jacket Front, Sleeves & Bags')
    };
  }

  if (text.includes('4') || text.includes('cap') || text.includes('chest') || text.includes('small') || text.includes('basic')) {
    return {
      limit: service === 'patch' ? 'Up to 3" × 3"' : (service === 'vector' ? 'Up to 5" × 5"' : 'Up to 4" × 4"'),
      label: service === 'patch' ? 'Standard (Up to 3")' : (service === 'vector' ? 'Simple (Up to 5")' : 'Small / Cap (Up to 4")'),
      maxInches: service === 'patch' ? 3.0 : (service === 'vector' ? 5.0 : 4.0),
      examples: service === 'patch' ? 'Cap & Pocket Patches' : (service === 'vector' ? 'Simple Logos & Text' : 'Caps, Polos, Visors & Left Chest')
    };
  }

  // Fallbacks by index
  if (index === 0) {
    return {
      limit: service === 'patch' ? 'Up to 3" × 3"' : (service === 'vector' ? 'Up to 5" × 5"' : 'Up to 4" × 4"'),
      label: service === 'patch' ? 'Standard (Up to 3")' : (service === 'vector' ? 'Simple (Up to 5")' : 'Small / Cap (Up to 4")'),
      maxInches: service === 'patch' ? 3.0 : (service === 'vector' ? 5.0 : 4.0),
      examples: service === 'patch' ? 'Cap & Pocket Patches' : (service === 'vector' ? 'Simple Logos & Text' : 'Caps, Polos, Visors & Left Chest')
    };
  }
  if (index === 1) {
    return {
      limit: service === 'patch' ? 'Up to 4" × 4"' : (service === 'vector' ? 'Up to 8" × 8"' : 'Up to 7" × 7"'),
      label: service === 'patch' ? 'Medium (Up to 4")' : (service === 'vector' ? 'Medium (Up to 8")' : 'Mid-Size (Up to 7")'),
      maxInches: service === 'patch' ? 4.0 : (service === 'vector' ? 8.0 : 7.0),
      examples: service === 'patch' ? 'Uniform & Sleeve Patches' : (service === 'vector' ? 'Mascots & Crests' : 'Jacket Front, Sleeves & Bags')
    };
  }
  return {
    limit: service === 'patch' ? 'Up to 5" × 5"+' : (service === 'vector' ? 'Any Size (Scalable)' : 'Up to 12" × 12"'),
    label: service === 'patch' ? 'Large (Up to 5"+)' : (service === 'vector' ? 'Full Detail / Large' : 'Full Back (Up to 12")'),
    maxInches: service === 'patch' ? 5.0 : (service === 'vector' ? 24.0 : 12.0),
    examples: service === 'patch' ? 'Back / Tactical Patches' : (service === 'vector' ? 'Detailed Art & Murals' : 'Jacket Back, Hoodies & Oversized')
  };
};
