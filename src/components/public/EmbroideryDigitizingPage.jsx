'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { matchCategory } from '../../utils/categoryUtils';
import { 
  CheckCircle, Zap, Trophy, Sparkles, Layers, Search, 
  Upload, Scissors, ArrowRight, Star, Quote, ChevronRight 
} from 'lucide-react';
import { PackageCard } from './PackageCard';

export const EmbroideryDigitizingPage = ({ hideHero = false }) => {
  const { setIsOrderWizardOpen, openOrderWizard, pricingCards = [], homePageConfig = {} } = useAppState();
  const dbSettings = homePageConfig?.settings || {};

  const [selectedTier, setSelectedTier] = useState('standard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [cardsToRender, setCardsToRender] = useState([]);
  
  useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('embroidery_cards').then(data => {
        if (data && data.length > 0) {
          const mappedCards = data.map((card, i) => ({
            id: `pcard-${i}`,
            category: 'embroidery',
            tierKey: card.title.toLowerCase().includes('premium') ? 'premium' : (card.popular ? 'standard' : 'basic'),
            title: card.title,
            subTitle: card.description,
            icon: i === 0 ? Zap : (i === 1 ? Trophy : Sparkles),
            discountTag: card.popular ? 'MOST POPULAR' : '',
            rate: card.price,
            unit: '/ design',
            delivery: card.turnaround,
            btnText: `Order (${card.price})`,
            badge: card.popular ? 'MOST POPULAR' : '',
            popular: card.popular,
            features: card.features
          }));
          setCardsToRender(mappedCards);
        }
      });
    });
  }, []);

  const defaultEmbroideryCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      tierKey: 'basic',
      title: 'Basic Digitizing',
      subTitle: 'Ideal for simple left chest / small logos',
      icon: Zap,
      discountTag: '',
      rate: '$10.00',
      unit: '/ design',
      delivery: '8-12 Hours',
      btnText: 'Order Basic ($10.00)',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Standard turnaround',
        '.DST / .PES machine files',
        'Essential stitch paths & underlay'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      tierKey: 'standard',
      title: 'Standard Digitizing',
      subTitle: 'Ideal for standard left chest & caps',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      rate: '$20.00',
      unit: '/ design',
      delivery: '4-8 Hours Express',
      btnText: 'Order Standard ($20.00)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        '4-Hour Express Available',
        'Free native .EMB source files',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      tierKey: 'premium',
      title: 'Premium Digitizing',
      subTitle: 'Ideal for Jacket Backs & Large Crests',
      icon: Sparkles,
      discountTag: 'VIP & COMPLEX',
      rate: '$30.00',
      unit: '/ design',
      delivery: '4-8 Hours Express',
      btnText: 'Order Premium ($30.00)',
      badge: 'VIP & COMPLEX',
      popular: false,
      features: [
        '3D Puff Cap density pathing',
        'Jacket back high stitch count verification',
        '24/7 Priority studio support'
      ]
    }
  ];

  const dbFilteredCards = (pricingCards || []).filter(c => matchCategory(c.category, 'embroidery'));
  const activeCards = cardsToRender.length > 0 
    ? cardsToRender 
    : (dbFilteredCards.length > 0 ? dbFilteredCards : defaultEmbroideryCards);

  const handleSelectTier = (tierKey = 'standard', cardObj = null) => {
    setSelectedTier(tierKey);
    if (openOrderWizard) {
      openOrderWizard({
        tierKey,
        type: 'embroidery',
        title: cardObj?.title || `${tierKey.toUpperCase()} Digitizing`,
        rate: cardObj?.rate
      });
    } else if (setIsOrderWizardOpen) {
      setIsOrderWizardOpen(true);
    }
  };

  const handleStartOrder = () => {
    handleSelectTier('standard');
  };

  return (
    <div style={{ background: 'var(--navy-950)', color: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Hero Banner */}
      {/* Main Content & Packages */}
      <section id="pricing-tiers" style={{ padding: '3.5rem 0 5rem', background: 'var(--navy-950)' }}>
        <div className="container">

          {/* Streamlined Compact Pricing Tiers Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
            {activeCards.map((cat, idx) => (
              <PackageCard
                key={cat.id || idx}
                cat={cat}
                idx={idx}
                onSelect={(selectedCat) => handleSelectTier(selectedCat.tierKey || 'standard', selectedCat)}
                forceCategory="embroidery"
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            📌 <em>{dbSettings.emb_footer_text || 'Prices are flat rates per design with zero hidden charges. Need multiple designs? Click any tier package above to open your instant order form.'}</em>
          </div>

        </div>
      </section>

    </div>
  );
};
