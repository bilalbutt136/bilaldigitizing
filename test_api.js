import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFetch() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/homepage');
    const data = await res.json();
    console.log("Settings keys length:", Object.keys(data.settings || {}).length);
    console.log("Trust Stats:", data.trustStats?.length);
    console.log("Trust Features:", data.trustFeatures?.length);
  } catch (err) {
    console.error(err);
  }
}

testFetch();
