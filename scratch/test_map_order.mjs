import { mapDatabaseOrderToClientOrder } from '../src/services/supabaseService.js';
import { createAdminClient } from '../src/lib/supabase/admin.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const supabase = createAdminClient();
  const { data: orderRow } = await supabase.from('orders').select('*').eq('id', '#1208').single();
  console.log('ORDER ROW STATUS:', orderRow.status, 'TITLE:', orderRow.title, 'CLIENT_NAME:', orderRow.client_name);
  
  const mapped = mapDatabaseOrderToClientOrder(orderRow);
  console.log('MAPPED ORDER:', {
    id: mapped.id,
    title: mapped.title,
    status: mapped.status,
    clientName: mapped.clientName,
    client_name: mapped.client_name,
    price: mapped.price,
    deliveriesCount: mapped.deliveries?.length,
    placementItemsCount: mapped.placementItems?.length,
    uploadedFilesCount: mapped.uploadedFiles?.length
  });
}

test().catch(console.error);
