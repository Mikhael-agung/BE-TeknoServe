const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Test connection
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(() => console.log('✅ Connected to Supabase'))
  .catch(err => console.error('❌ Supabase connection error:', err.message));

module.exports = supabase;