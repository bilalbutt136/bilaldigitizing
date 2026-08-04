-- Phase 6: CMS Extensions for Testimonials and FAQs

-- 1. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  rating INT DEFAULT 5,
  comment TEXT NOT NULL,
  avatar TEXT,
  service_category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonials_read_all ON public.testimonials FOR SELECT USING (true);
CREATE POLICY testimonials_admin_write ON public.testimonials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY faqs_read_all ON public.faqs FOR SELECT USING (true);
CREATE POLICY faqs_admin_write ON public.faqs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Insert some default Testimonials
INSERT INTO public.testimonials (id, name, role, company, rating, comment, service_category, sort_order) VALUES
('t1', 'Sarah Jenkins', 'Production Manager', 'Elite Apparel', 5, 'BDigitizing has transformed our workflow. Their embroidery files sew out flawlessly every single time. We threw our most complex jacket back at them, and it was perfect on the first run.', 'embroidery', 1),
('t2', 'Marcus Chen', 'Owner', 'Chen Screen Printing', 5, 'The vector art team here is incredible. They take our clients'' blurry, pixelated logos and turn them into perfect print-ready vectors in hours. It saves us so much time.', 'vector', 2),
('t3', 'David Rossi', 'Director', 'Tactical Gear Co', 5, 'We order thousands of PVC patches monthly. The quality, durability, and 3D molding detail from BDigitizing is unmatched. Plus, their worldwide shipping is surprisingly fast.', 'patches', 3),
('t4', 'Emily Torres', 'Creative Director', 'Torres Designs', 5, 'Having one partner for digitizing, vectoring, and patches is a game changer. The 24/7 support is real – I''ve had revisions done at 2 AM on a Sunday. Highly recommended.', 'general', 4)
ON CONFLICT (id) DO NOTHING;

-- Insert some default FAQs
INSERT INTO public.faqs (id, question, answer, category, sort_order) VALUES
('f1', 'What is your turnaround time?', 'Our standard turnaround time is 12 to 24 hours. For urgent projects, we offer a Rush Service that guarantees delivery within 4 to 8 hours for a small additional fee.', 'general', 1),
('f2', 'Do you offer free revisions?', 'Yes! We offer 100% free unlimited revisions on all digitizing and vector orders until you are completely satisfied with the result.', 'general', 2),
('f3', 'What embroidery machine formats do you provide?', 'We provide all standard commercial and home machine formats including Tajima (.DST), Brother (.PES), Melco (.EXP), Janome (.JEF), Husqvarna (.HUS), and native Wilcom (.EMB).', 'embroidery', 1),
('f4', 'Do you use auto-digitizing software?', 'Never. Every single design is 100% manually digitized by our master digitizers using Wilcom software to ensure optimal pathing, density, and zero thread breaks.', 'embroidery', 2),
('f5', 'What file formats will I receive for vector art?', 'You will receive a complete master file package containing Adobe Illustrator (.AI), .EPS, .SVG, and a high-resolution .PDF.', 'vector', 1),
('f6', 'Are your vectors ready for screen printing?', 'Absolutely. We ensure all vector files are perfectly node-traced with proper Pantone spot color separation, making them 100% ready for screen printing and vinyl cutting.', 'vector', 2),
('f7', 'What is the minimum order quantity for physical patches?', 'Our minimum order quantity for custom physical patches (embroidered, PVC, woven, or leather) is 50 pieces.', 'patches', 1),
('f8', 'What backing options do you offer for patches?', 'We offer Iron-On (Heat Seal), Velcro (Hook & Loop), and standard Sew-On backings for all our patch types.', 'patches', 2)
ON CONFLICT (id) DO NOTHING;
