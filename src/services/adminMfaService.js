'use client';

import { supabase } from '../lib/supabase/client';

function normalizeTotpFactors(data) {
  const factors = [
    ...(Array.isArray(data?.totp) ? data.totp : []),
    ...(Array.isArray(data?.all) ? data.all.filter(f => f?.factor_type === 'totp' || f?.type === 'totp') : [])
  ];

  const seen = new Set();
  return factors.filter(factor => {
    const id = factor?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export async function getAdminMfaStatus() {
  try {
    const [{ data: aalData, error: aalError }, { data: factorData, error: factorError }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors()
    ]);

    if (aalError) throw aalError;
    if (factorError) throw factorError;

    const totpFactors = normalizeTotpFactors(factorData);
    const verifiedFactors = totpFactors.filter(factor => factor?.status === 'verified');

    return {
      success: true,
      currentLevel: aalData?.currentLevel || 'aal1',
      nextLevel: aalData?.nextLevel || 'aal1',
      verifiedFactors,
      hasVerifiedFactor: verifiedFactors.length > 0
    };
  } catch (error) {
    return {
      success: false,
      currentLevel: 'aal1',
      nextLevel: 'aal1',
      verifiedFactors: [],
      hasVerifiedFactor: false,
      error: error?.message || 'Unable to verify multi-factor authentication status.'
    };
  }
}

export async function beginAdminMfaEnrollment() {
  try {
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) throw factorError;

    const staleUnverified = normalizeTotpFactors(factorData)
      .filter(factor => factor?.status !== 'verified');

    for (const factor of staleUnverified) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      } catch {}
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'BDigitizing Admin Authenticator'
    });

    if (error) throw error;
    if (!data?.id || !data?.totp?.secret) {
      throw new Error('Authenticator setup did not return a valid TOTP factor.');
    }

    return {
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code || '',
      secret: data.totp.secret || '',
      uri: data.totp.uri || ''
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Unable to start authenticator setup.'
    };
  }
}

export async function verifyAdminMfaCode(factorId, code) {
  const cleanCode = String(code || '').replace(/\s+/g, '').trim();
  if (!factorId || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Enter the 6-digit code from your authenticator app.' };
  }

  try {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: cleanCode
    });

    if (error) throw error;

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;

    if (aalData?.currentLevel !== 'aal2') {
      throw new Error('Multi-factor verification did not upgrade the administrator session.');
    }

    return { success: true, currentLevel: 'aal2' };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'The authenticator code could not be verified.'
    };
  }
}
