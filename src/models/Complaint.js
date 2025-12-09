const supabase = require('../config/supabase');

const Complaint = {
  // Buat complaint baru (FIXED: gak perlu kasih id manual)
  async create(complaintData) {
    try {
      // HAPUS id jika ada (biar database generate)
      const { id, ...cleanData } = complaintData;
      
      const { data, error } = await supabase
        .from('complaints')
        .insert([cleanData])
        .select()
        .single();
      
      if (error) throw error;
      
      // ✅ AUTO INSERT STATUS PERTAMA KE complaint_statuses
      await supabase
        .from('complaint_statuses')
        .insert([{
          complaint_id: data.id,
          status: 'pending',
          teknisi_id: null,
          alasan: 'Komplain dibuat'
        }]);
      
      return data;
    } catch (error) {
      console.error('Complaint.create error:', error);
      throw error;
    }
  },

  // Get complaints by user ID (HISTORY) - MASIH SAMA
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

  // Get complaint by ID - TAMBAH STATUS HISTORY
  async findById(id) {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        user:users(id, username, full_name),
        teknisi:teknisi_id(id, username, full_name)
      `)
      .eq('id', id)
      .single();
    
    return error ? null : data;
  },

  // Update complaint - MASIH SAMA
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
  },

  // Get status history
  async getStatusHistory(complaintId) {
    const { data, error } = await supabase
      .from('complaint_statuses')
      .select(`
        *,
        teknisi:teknisi_id(id, username, full_name)
      `)
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false });
    
    return error ? [] : data;
  },

  // Add status ke history
  async addStatusHistory(statusData) {
    const { data, error } = await supabase
      .from('complaint_statuses')
      .insert([statusData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get complaints by teknisi
  async findByTeknisiId(teknisiId, filters = {}) {
    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })
      .eq('teknisi_id', teknisiId)
      .order('created_at', { ascending: false });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }
    
    const { data, error, count } = await query;
    
    if (error) return { data: [], total: 0 };
    return { data: data || [], total: count || 0 };
  }
};

module.exports = Complaint;