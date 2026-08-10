const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UnifiedCmsManager.jsx', 'utf8');

const originalHandleSaveAll = `  const handleSaveAll = async () => {
    showToast('Saving CMS configurations...', 'info');
    try {
      if (activeTab === 'hero') {
        const processedHero = await Promise.all(draftHero.map(async (slide) => {
          let newSlide = { ...slide };
          if (newSlide.previewBefore && newSlide.previewBefore.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.previewBefore, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.previewBefore = uploadedUrl;
          }
          if (newSlide.preview_before && newSlide.preview_before.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_before, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.preview_before = uploadedUrl;
          }
          if (newSlide.previewAfter && newSlide.previewAfter.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.previewAfter, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.previewAfter = uploadedUrl;
          }
          if (newSlide.preview_after && newSlide.preview_after.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_after, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.preview_after = uploadedUrl;
          }
          return newSlide;
        }));
        
        const res1 = await saveCmsConfigToSupabase('hero_global_settings', draftHeroGlobal);
        const res2 = await upsertHeroContent(processedHero);
        if (!res1 || !res2) throw new Error("Failed to save hero content");
      }
      else if (activeTab === 'portfolio') {
        const processedPortfolio = await Promise.all(draftPortfolio.map(async (item) => {
          let newItem = { ...item };
          
          if (newItem.originalImage && newItem.originalImage.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.originalImage, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.originalImage = uploadedUrl;
          }
          if (newItem.digitizedImage && newItem.digitizedImage.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.digitizedImage, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.digitizedImage = uploadedUrl;
          }
          if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.beforeImg = uploadedUrl;
          }
          if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.afterImg = uploadedUrl;
          }
          
          return newItem;
        }));
        
        const res = await upsertPortfolioItems(processedPortfolio);
        if (!res) throw new Error("Failed to save portfolio");
      }
      else if (activeTab === 'sewouts') {
        const processedSewOuts = await Promise.all(draftSewOuts.map(async (item) => {
          let newItem = { ...item };
          if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'sewouts');
            if (uploadedUrl) newItem.beforeImg = uploadedUrl;
          }
          if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'sewouts');
            if (uploadedUrl) newItem.afterImg = uploadedUrl;
          }
          return newItem;
        }));
        
        const res = await upsertSewOuts(processedSewOuts);
        if (!res) throw new Error("Failed to save sew outs");
      }
      else if (activeTab === 'team') {
        const res = await upsertDigitizers(draftDigitizers);
        if (!res) throw new Error("Failed to save team");
      }
      else if (activeTab === 'faqs') {
        const res = await upsertFaqs(draftFaqs);
        if (!res) throw new Error("Failed to save faqs");
      }
      else if (activeTab === 'testimonials') {
        const res = await upsertTestimonials(draftTestimonials);
        if (!res) throw new Error("Failed to save testimonials");
      }
      else if (activeTab === 'globals') {
        await saveCmsConfigToSupabase('trust_features', JSON.parse(draftTrustFeatures));
        await saveCmsConfigToSupabase('why_choose_us_steps', JSON.parse(draftWhySteps));
        await saveCmsConfigToSupabase('vector_format_options', JSON.parse(draftVectorFormats));
        await saveCmsConfigToSupabase('portfolio_categories', JSON.parse(draftPortfolioCats));
        await saveCmsConfigToSupabase('order_wizard_formats', JSON.parse(draftOrderFormats));
      }
      showToast('Live Website Updated Successfully!', 'success');
    } catch (err) {
      showToast('Error saving data: ' + err.message, 'error');
    }
  };`;

const replacementHandles = `  const handleSaveHero = async () => {
    showToast('Saving Hero configurations...', 'info');
    try {
      const processedHero = await Promise.all(draftHero.map(async (slide) => {
        let newSlide = { ...slide };
        if (newSlide.previewBefore && newSlide.previewBefore.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newSlide.previewBefore, 'client-uploads', 'hero');
          if (uploadedUrl) newSlide.previewBefore = uploadedUrl;
        }
        if (newSlide.preview_before && newSlide.preview_before.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_before, 'client-uploads', 'hero');
          if (uploadedUrl) newSlide.preview_before = uploadedUrl;
        }
        if (newSlide.previewAfter && newSlide.previewAfter.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newSlide.previewAfter, 'client-uploads', 'hero');
          if (uploadedUrl) newSlide.previewAfter = uploadedUrl;
        }
        if (newSlide.preview_after && newSlide.preview_after.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_after, 'client-uploads', 'hero');
          if (uploadedUrl) newSlide.preview_after = uploadedUrl;
        }
        return newSlide;
      }));
      
      const res1 = await saveCmsConfigToSupabase('hero_global_settings', draftHeroGlobal);
      const res2 = await upsertHeroContent(processedHero);
      if (!res1 || !res2) throw new Error("Failed to save hero content");
      showToast('Hero Settings Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSavePortfolio = async () => {
    showToast('Saving Portfolio...', 'info');
    try {
      const processedPortfolio = await Promise.all(draftPortfolio.map(async (item) => {
        let newItem = { ...item };
        if (newItem.originalImage && newItem.originalImage.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.originalImage, 'client-uploads', 'portfolio');
          if (uploadedUrl) newItem.originalImage = uploadedUrl;
        }
        if (newItem.digitizedImage && newItem.digitizedImage.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.digitizedImage, 'client-uploads', 'portfolio');
          if (uploadedUrl) newItem.digitizedImage = uploadedUrl;
        }
        if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'portfolio');
          if (uploadedUrl) newItem.beforeImg = uploadedUrl;
        }
        if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'portfolio');
          if (uploadedUrl) newItem.afterImg = uploadedUrl;
        }
        return newItem;
      }));
      const res = await upsertPortfolioItems(processedPortfolio);
      if (!res) throw new Error("Failed to save portfolio");
      showToast('Portfolio Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSaveSewOuts = async () => {
    showToast('Saving Sew Outs...', 'info');
    try {
      const processedSewOuts = await Promise.all(draftSewOuts.map(async (item) => {
        let newItem = { ...item };
        if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'sewouts');
          if (uploadedUrl) newItem.beforeImg = uploadedUrl;
        }
        if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
          const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'sewouts');
          if (uploadedUrl) newItem.afterImg = uploadedUrl;
        }
        return newItem;
      }));
      const res = await upsertSewOuts(processedSewOuts);
      if (!res) throw new Error("Failed to save sew outs");
      showToast('Sew Outs Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSaveTeam = async () => {
    showToast('Saving Team...', 'info');
    try {
      const res = await upsertDigitizers(draftDigitizers);
      if (!res) throw new Error("Failed to save team");
      showToast('Team Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSaveFaqs = async () => {
    showToast('Saving FAQs...', 'info');
    try {
      const res = await upsertFaqs(draftFaqs);
      if (!res) throw new Error("Failed to save faqs");
      showToast('FAQs Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSaveTestimonials = async () => {
    showToast('Saving Testimonials...', 'info');
    try {
      const res = await upsertTestimonials(draftTestimonials);
      if (!res) throw new Error("Failed to save testimonials");
      showToast('Testimonials Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleSaveGlobals = async () => {
    showToast('Saving Globals...', 'info');
    try {
      await saveCmsConfigToSupabase('trust_features', JSON.parse(draftTrustFeatures));
      await saveCmsConfigToSupabase('why_choose_us_steps', JSON.parse(draftWhySteps));
      await saveCmsConfigToSupabase('vector_format_options', JSON.parse(draftVectorFormats));
      await saveCmsConfigToSupabase('portfolio_categories', JSON.parse(draftPortfolioCats));
      await saveCmsConfigToSupabase('order_wizard_formats', JSON.parse(draftOrderFormats));
      showToast('Globals Updated Successfully!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };`;

code = code.replace(originalHandleSaveAll, replacementHandles);

const oldTopButton = `        <button onClick={handleSaveAll} className="btn btn-primary-orange">
          <Save size={18} /> Save & Publish Live
        </button>`;
code = code.replace(oldTopButton, "");

code = code.replace(
  "{activeTab === 'hero' && (",
  "{activeTab === 'hero' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveHero} className=\"btn btn-primary-orange\"><Save size={18} /> Save Hero Settings</button></div>"
);

code = code.replace(
  "{activeTab === 'portfolio' && (",
  "{activeTab === 'portfolio' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSavePortfolio} className=\"btn btn-primary-orange\"><Save size={18} /> Save Portfolio</button></div>"
);

code = code.replace(
  "{activeTab === 'sewouts' && (",
  "{activeTab === 'sewouts' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveSewOuts} className=\"btn btn-primary-orange\"><Save size={18} /> Save Sew Outs</button></div>"
);

code = code.replace(
  "{activeTab === 'team' && (",
  "{activeTab === 'team' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveTeam} className=\"btn btn-primary-orange\"><Save size={18} /> Save Team</button></div>"
);

code = code.replace(
  "{activeTab === 'faqs' && (",
  "{activeTab === 'faqs' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveFaqs} className=\"btn btn-primary-orange\"><Save size={18} /> Save FAQs</button></div>"
);

code = code.replace(
  "{activeTab === 'testimonials' && (",
  "{activeTab === 'testimonials' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveTestimonials} className=\"btn btn-primary-orange\"><Save size={18} /> Save Testimonials</button></div>"
);

code = code.replace(
  "{activeTab === 'globals' && (",
  "{activeTab === 'globals' && (\n        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}><button onClick={handleSaveGlobals} className=\"btn btn-primary-orange\"><Save size={18} /> Save Globals</button></div>"
);

fs.writeFileSync('src/components/admin/UnifiedCmsManager.jsx', code);
console.log("Refactored UnifiedCmsManager.jsx successfully.");
