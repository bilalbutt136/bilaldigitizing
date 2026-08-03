const fs = require('fs');
const file = 'src/context/StateContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const replacement = `  const finishAuth = async (sbUser) => {
    let role = 'customer';
    let balance = 0;
    
    try {
      const { data, error } = await supabase.from('users').select('role, wallet_balance, name').eq('id', sbUser.id).single();
      if (!error && data) {
        role = data.role;
        balance = data.wallet_balance;
      }
    } catch (e) {
      console.warn("Error fetching user data from public.users");
    }

    const uData = buildAuthUser(sbUser, role);
    persistAuth(uData, role);
    setWalletBalance(balance);
    return { success: true, role, user: uData };
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    try {
      const sbRes = await signInWithSupabaseAuth(cleanEmail, cleanPass);
      if (sbRes && sbRes.success && sbRes.user) {
        const result = await finishAuth(sbRes.user);
        showToast(\`Welcome back \${result.user.name}!\`, 'success');
        return result;
      } else {
        return { success: false, error: sbRes?.error || 'Invalid email or password.' };
      }
    } catch (sbErr) {
      return { success: false, error: sbErr?.message || 'Authentication error.' };
    }
  };

  const loginWithGoogle = async () => {
    showToast('Redirecting to Google Sign-In...', 'info');
    const res = await signInWithGoogleOAuth();
    if (!res.success) {
      showToast(res.error || 'Google Sign-In failed.', 'error');
    }
    return res;
  };

  const loginWithApple = async () => {
    showToast('Redirecting to Apple Sign-In...', 'info');
    const res = await signInWithAppleOAuth();
    if (!res.success) {
      showToast(res.error || 'Apple Sign-In failed.', 'error');
    }
    return res;
  };

  const register = async (name, email, password, company) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (company || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, error: 'Please fill in your name, email, and password.' };
    }

    try {
      const sbRes = await signUpWithSupabaseAuth(cleanName, cleanEmail, cleanPass, cleanCompany);
      if (sbRes && sbRes.success) {
        showToast(\`Account registered successfully! Welcome \${cleanName}.\`, 'success');
        const result = await finishAuth(sbRes.user);
        return { success: true, role: 'customer', user: result.user };
      } else {
        return { success: false, error: sbRes?.error || 'Registration failed.' };
      }
    } catch (err) {
      return { success: false, error: err?.message || 'Registration exception.' };
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    setCurrentView('public');
    setWalletBalance(0);

    try {
      sessionStorage.clear();
      localStorage.removeItem('bdigi_auth_user');
      localStorage.removeItem('bdigi_current_view');
    } catch (e) {
      console.warn('Storage clearance notice:', e);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }

    showToast('You have been logged out safely.', 'info');
  };

  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return { success: false, error: 'Please enter a valid email address.' };

    try {
      const res = await sendPasswordResetEmail(cleanEmail);
      if (res && !res.success) return res;
    } catch (err) {
      return { success: false, error: err.message || 'Failed to dispatch reset email.' };
    }

    showToast(\`Password reset link dispatched to \${cleanEmail}\`, 'info');
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const res = await updateUserPassword(newPassword);
      if (res && !res.success) return res;
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }

    showToast('Password updated successfully! Please sign in with your new password.', 'success');
    setAuthModalMode('login');
    return { success: true };
  };`;

// replace lines 700 to 961 (0-indexed 699 to 960)
lines.splice(699, 262, replacement);
let newContent = lines.join('\n');
newContent = newContent.replace("import { supabase, isSupabaseConfigured } from '../lib/supabase';", "import { supabase, isSupabaseConfigured } from '../lib/supabase/client';");

fs.writeFileSync(file, newContent, 'utf8');
console.log('Successfully replaced content.');
