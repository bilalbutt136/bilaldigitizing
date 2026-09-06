'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Scissors, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Briefcase, 
  Cpu, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

const EMBROIDERY_SOFTWARE_OPTIONS = [
  'Wilcom EmbroideryStudio (e4 / e4.5 / 2026)',
  'Tajima Pulse DG/ML (v15 / v16 / v17)',
  'Hatch Embroidery (v2 / v3)',
  'Melco DesignShop (v11 / v12)',
  'Wings XP / Drawings',
  'Embird Studio',
  'Other Professional Software'
];

export default function WorkerRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');
  const [primarySoftware, setPrimarySoftware] = useState(EMBROIDERY_SOFTWARE_OPTIONS[0]);
  const [bio, setBio] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError('');
    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'worker-applications');
      formData.append('folder', 'applications');

      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload portfolio sample.');
      }

      setUploadedFile(file);
      setUploadedFileUrl(data.url || data.secure_url || data.public_url);
      setUploadedFileName(file.name);
    } catch (err) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      setErrorMessage('Please fill in your Full Name, Email, and Password.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/worker/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPass,
          phone: phone.trim() || null,
          experience_years: parseInt(experienceYears, 10) || 1,
          primary_software: primarySoftware,
          portfolio_sample_url: uploadedFileUrl || null,
          portfolio_file_name: uploadedFileName || null,
          bio: bio.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setIsSubmittedSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Celebratory "Application Under Review" Screen
  if (isSubmittedSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          padding: '3rem 2.5rem',
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#ffffff',
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px rgba(34, 197, 94, 0.35)'
          }}>
            <CheckCircle2 size={42} />
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.65rem', letterSpacing: '-0.02em' }}>
            Application Under Review
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Thank you, <strong style={{ color: '#ffffff' }}>{fullName}</strong>! Your digitizer application and portfolio samples have been safely submitted to our lead production desk.
          </p>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <Clock size={20} style={{ color: '#f97316', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'block' }}>Quality Review Window (24-48 hrs)</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Our master digitizers evaluate your sample stitchouts for density, underlay structure, and pull compensation.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <ShieldCheck size={20} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'block' }}>Activation Notification</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Once approved, your account status will transition to <span style={{ color: '#4ade80', fontWeight: 700 }}>Active</span> and you can immediately claim and work on embroidery orders.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/worker-login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                padding: '0.85rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)'
              }}
            >
              Go to Digitizer Login <ArrowRight size={18} />
            </Link>

            <Link
              href="/"
              style={{
                color: '#94a3b8',
                fontSize: '0.85rem',
                textDecoration: 'none',
                padding: '0.5rem'
              }}
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem 5rem',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        padding: '2.75rem 2.5rem',
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '20px'
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
          }}>
            <Scissors size={34} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={13} /> Onboarding Portal
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Apply as an Embroidery Digitizer
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto' }}>
            Join our expert digitizing team. Punch high-precision stitch files, earn per-order payouts, and work directly with our production studio.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#fca5a5',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Row 1: Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Full Name <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Email Address <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="digitizer@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Password & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Account Password <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Phone / WhatsApp (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Experience & Primary Software */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Years of Digitizing Experience <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="1">1 Year Experience</option>
                  <option value="2">2 Years Experience</option>
                  <option value="3">3 Years Experience</option>
                  <option value="5">4 - 5 Years Experience</option>
                  <option value="8">6 - 8 Years Experience</option>
                  <option value="10">10+ Years Expert Digitizer</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Primary Software Used <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Cpu size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select
                  value={primarySoftware}
                  onChange={(e) => setPrimarySoftware(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {EMBROIDERY_SOFTWARE_OPTIONS.map((sw, idx) => (
                    <option key={idx} value={sw}>{sw}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: File Upload (CV or Sample ZIP/PDF) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Portfolio Samples or CV (PDF, ZIP, DST, PES, PNG)
            </label>
            
            <div style={{
              border: uploadedFileUrl ? '1.5px solid #22c55e' : '1.5px dashed #475569',
              borderRadius: '12px',
              padding: '1.25rem',
              background: uploadedFileUrl ? 'rgba(34, 197, 94, 0.05)' : '#0f172a',
              textAlign: 'center',
              cursor: isUploadingFile ? 'wait' : 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                accept=".pdf,.zip,.rar,.dst,.pes,.emb,.png,.jpg,.jpeg"
                disabled={isUploadingFile}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />

              {isUploadingFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(249, 115, 22, 0.3)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.875rem', color: '#f97316', fontWeight: 600 }}>Uploading sample file to secure storage...</span>
                </div>
              ) : uploadedFileUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4ade80', fontWeight: 700 }}>
                    {uploadedFileName || 'Portfolio Sample Attached'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Click to replace)</span>
                </div>
              ) : (
                <div>
                  <UploadCloud size={28} style={{ color: '#f97316', margin: '0 auto 0.4rem' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Click or drag & drop to upload your portfolio samples or resume
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Supports ZIP archive with DST files, Stitch Sheet PDF, or High-Res Photos (Up to 50MB)
                  </span>
                </div>
              )}
            </div>

            {uploadError && (
              <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem' }}>{uploadError}</p>
            )}
          </div>

          {/* Row 5: Short Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Specialties / Bio Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Specialized in 3D puff embroidery, small lettering under 4mm, appliqué patches, and fast turnaround jacket backs..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploadingFile}
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.95rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: isSubmitting || isUploadingFile ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)',
              opacity: isSubmitting || isUploadingFile ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Digitizer Application</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer link to login */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          Already an approved digitizer?{' '}
          <Link
            href="/worker-login"
            style={{
              color: '#f97316',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Sign in to your workstation
          </Link>
        </div>
      </div>
    </div>
  );
}
