const supabase = require('../config/supabase');

const Complaint = {
  // Buat complaint baru
  async create(complaintData) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaintData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get complaints by user ID (HISTORY)
  async findByUserId(userId, filters = {}) {
    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Filter by status
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    // Filter by category
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    // Pagination
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }
    
    const { data, error, count } = await query;
    
    if (error) return { data: [], total: 0 };
    return { data: data || [], total: count || 0 };
  },

  // Get complaint by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        user:users(id, username, full_name)
      `)
      .eq('id', id)
      .single();
    
    return error ? null : data;
  },

  // Update complaint
  async update(id, updates) {
    const { data, error } = await supabase
      .from('complaints')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

module.exports = Complaint;