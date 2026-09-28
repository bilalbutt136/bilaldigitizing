export async function canAccessConversation(supabase, { user, isAdmin }, conversationId) {
  if (!user?.email || !conversationId) return false;
  if (isAdmin) return true;

  const { data, error } = await supabase
    .from('conversations')
    .select('id, client_email')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !data) return false;
  return String(data.client_email || '').trim().toLowerCase() === String(user.email).trim().toLowerCase();
}
