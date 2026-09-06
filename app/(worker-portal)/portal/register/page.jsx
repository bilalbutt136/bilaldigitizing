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
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const SOFTWARE_OPTIONS = [
  'Wilcom EmbroideryStudio (e4 / e4.5 / 2026)',
  'Tajima Pulse DG/ML (v15 / v16 / v17)',
  'Hatch Embroidery (v2 / v3)',
  'Melco DesignShop (v11 / v12)',
  'Adobe Illustrator (Vector Tracing Specialist)',
  'CorelDraw (Vector Art & Color Separation)',
  'Wings XP / Drawings',
  'Embird Studio',
  'Other Professional Software'
];

export default function PortalRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');
  const [primarySoftware, setPrimarySoftware] = useState(SOFTWARE_OPTIONS[0]);
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

  // Render "Application Under Review" Confirmation Screen
  if (isSubmittedSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '540px',
          width: '100%',
          padding: '3rem 2.5rem',
          background: '#131c2e',
          border: '1px solid #1f293d',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          borderRadius: '18px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#ffffff',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px rgba(34, 197, 94, 0.35)'
          }}>
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.65rem', letterSpacing: '-0.02em' }}>
            Application Under Review
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Thank you, <strong style={{ color: '#ffffff' }}>{fullName}</strong>! Your application and portfolio samples have been submitted to our production desk.
          </p>

          <div style={{
            background: '#0a0f1d',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <Clock size={18} style={{ color: '#f97316', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.875rem', display: 'block' }}>Quality Review Window (24-48 hrs)</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Our lead team evaluates sample stitchouts or vectors for pull compensation, density, and precision.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.875rem', display: 'block' }}>Activation Notification</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Once approved, your account status will transition to <strong style={{ color: '#4ade80' }}>Active</strong> and you will receive an activation email to start claiming tasks.</span>
              </div>
            </div>
          </div>

          <Link
            href="/portal/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              padding: '0.9rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              boxSizing: 'border-box'
            }}
          >
            Go to Task Portal Login <ArrowRight size={18} />
          </Link>
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
      padding: '3rem 1.5rem',
      background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '660px',
        width: '100%',
        padding: '2.5rem',
        background: '#131c2e',
        border: '1px solid #1f293d',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        borderRadius: '18px'
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
          }}>
            <Scissors size={30} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={12} /> Workstation Onboarding
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Apply for Task Portal Access
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '460px', margin: '0 auto' }}>
            Join our expert digitizing & vector art production team. Claim assigned tasks, punch production stitch files, and earn per-order compensation in PKR.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Row 1: Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Password & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Phone / WhatsApp (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Experience & Primary Software */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Years of Experience <span style={{ color: '#f97316' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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
                    background: '#090e1a',
                    border: '1px solid #1f293d',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {SOFTWARE_OPTIONS.map((sw, idx) => (
                    <option key={idx} value={sw}>{sw}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: File Upload (CV or Sample ZIP/PDF) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Portfolio Samples or CV (PDF, ZIP, DST, PES, PNG)
            </label>
            
            <div style={{
              border: uploadedFileUrl ? '1.5px solid #22c55e' : '1.5px dashed #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              background: uploadedFileUrl ? 'rgba(34, 197, 94, 0.05)' : '#090e1a',
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
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(249, 115, 22, 0.3)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.85rem', color: '#f97316', fontWeight: 600 }}>Uploading sample file...</span>
                </div>
              ) : uploadedFileUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 700 }}>
                    {uploadedFileName || 'Portfolio Sample Attached'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Click to replace)</span>
                </div>
              ) : (
                <div>
                  <UploadCloud size={24} style={{ color: '#f97316', margin: '0 auto 0.35rem' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Click or drag & drop to upload your portfolio samples or resume
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Supports ZIP archive with DST files, Stitch Sheet PDF, or Photos (Up to 50MB)
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Specialties & Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. 3D puff embroidery, small lettering under 4mm, appliqué patches, fast turnaround jacket backs..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#090e1a',
                border: '1px solid #1f293d',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
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
              borderRadius: '10px',
              padding: '0.9rem 1.5rem',
              fontSize: '0.95rem',
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
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer link to login */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #1f293d',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#94a3b8'
        }}>
          Already an approved digitizer?{' '}
          <Link
            href="/portal/login"
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
