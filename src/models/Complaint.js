const supabase = require('../config/supabase');

const Complaint = {
  async create(complaintData) {
    try {
      const {
        id,
        created_at,
        updated_at,
        ...restData
      } = complaintData;

      console.log('🔍 After removing invalid fields:', restData);

      const dbData = {
        // Required fields
        user_id: restData.user_id || '',
        judul: restData.judul || '',
        kategori: restData.kategori || '',
        deskripsi: restData.deskripsi || '',

        alamat: restData.alamat || '',
        kota: restData.kota || '',
        kecamatan: restData.kecamatan || '',
        telepon_alamat: restData.telepon_alamat || '',
        catatan_alamat: restData.catatan_alamat || '',

        status: 'complaint',
        tanggal: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert to Supabase
      const { data, error } = await supabase
        .from('complaints')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('❌ SUPABASE INSERT ERROR:', error.message);
        console.error('Details:', error.details);
        throw error;
      }

      // Add initial status history
      await supabase
        .from('complaint_statuses')
        .insert([{
          complaint_id: data.id,
          status: 'complaint',
          teknisi_id: null,
          alasan: 'Komplain dibuat'
        }]);

      return data;
    } catch (error) {
      console.error('❌ COMPLAINT.CREATE ERROR:', error.message);
      throw error;
    }
  },

  // Get complaints by user ID with filters and pagination - OPTIMIZED
  async findByUserId(userId, filters = {}) {
    try {
      let query = supabase
        .from('complaints')
        .select('id, judul, kategori, status, tanggal, kota, kecamatan', { count: 'estimated' }) // ✅ changed to estimated
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      // Filter by status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Filter by category
      if (filters.kategori) {
        query = query.eq('kategori', filters.kategori);
      }

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ FindByUserId error:', error.message);
        return { data: [], total: 0 };
      }

      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('❌ FindByUserId exception:', error);
      return { data: [], total: 0 };
    }
  },

  // Get complaint by ID with user and teknisi info
  async findById(id) {
    try {
      // QUERY WITHOUT EMBED
      const { data: complaint, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ FindById error:', error.message);
        return null;
      }

      if (!complaint) {
        return null;
      }

      // GET USER DATA SEPARATELY
      let customer = null;
      let teknisi = null;

      // Get customer (user_id)
      if (complaint.user_id) {
        const { data: customerData } = await supabase
          .from('users')
          .select('id, username, full_name, phone')
          .eq('id', complaint.user_id)
          .single();
        customer = customerData;
      }

      // Get teknisi (teknisi_id)  
      if (complaint.teknisi_id) {
        const { data: teknisiData } = await supabase
          .from('users')
          .select('id, username, full_name')
          .eq('id', complaint.teknisi_id)
          .single();
        teknisi = teknisiData;
      }

      // Return combined data
      return {
        ...complaint,
        customer,
        teknisi
      };
    } catch (error) {
      console.error('❌ FindById exception:', error);
      return null;
    }
  },

  // Update complaint
  async update(id, updates) {
    try {
      // Remove fields that should not be updated
      const { created_at, tanggal, ...cleanUpdates } = updates;

      const updateData = {
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update error:', error.message);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Update exception:', error);
      throw error;
    }
  },

  // Get status history for a complaint - OPTIMIZED (no N+1 queries)
  async getStatusHistory(complaintId) {
    try {
      // Query without embed
      const { data: histories, error } = await supabase
        .from('complaint_statuses')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GetStatusHistory error:', error.message);
        return [];
      }

      if (!histories || histories.length === 0) {
        return [];
      }

      // ✅ OPTIMIZATION: Get all unique teknisi IDs in one query
      const teknisiIds = [...new Set(
        histories
          .map(h => h.teknisi_id)
          .filter(id => id !== null && id !== undefined)
      )];

      let teknisiMap = {};

      // Query users only once if there are teknisi IDs
      if (teknisiIds.length > 0) {
        const { data: teknisiData } = await supabase
          .from('users')
          .select('id, username, full_name')
          .in('id', teknisiIds);

        if (teknisiData) {
          // Convert array to map for O(1) lookup
          teknisiData.forEach(teknisi => {
            teknisiMap[teknisi.id] = teknisi;
          });
        }
      }

      // Map histories with teknisi data
      const historiesWithTeknisi = histories.map(history => ({
        ...history,
        teknisi: history.teknisi_id ? teknisiMap[history.teknisi_id] || null : null
      }));

      return historiesWithTeknisi;
    } catch (error) {
      console.error('GetStatusHistory exception:', error);
      return [];
    }
  },

  // Add status to history
  async addStatusHistory(statusData) {
    try {
      const { data, error } = await supabase
        .from('complaint_statuses')
        .insert([statusData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Status history added');
      return data;
    } catch (error) {
      console.error('❌ AddStatusHistory error:', error.message);
      throw error;
    }
  },

  // Get complaints by teknisi ID - OPTIMIZED
  async findByTeknisiId(teknisiId, filters = {}) {
    try {
      let query = supabase
        .from('complaints')
        .select('id, judul, kategori, status, tanggal, kota, kecamatan', { count: 'estimated' })
        .eq('teknisi_id', teknisiId)
        .order('tanggal', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ FindByTeknisiId error:', error.message);
        return { data: [], total: 0 };
      }

      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('❌ FindByTeknisiId exception:', error);
      return { data: [], total: 0 };
    }
  },

  // Find complaints ready for teknisi - OPTIMIZED
  async findReadyForTeknisi(filters = {}) {
    try {
      let query = supabase
        .from('complaints')
        .select('id, judul, kategori, status, tanggal, kota, kecamatan', { count: 'estimated' })
        .eq('status', 'complaint')
        .is('teknisi_id', null)
        .order('tanggal', { ascending: false });

      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('FindReadyForTeknisi error:', error.message);
        return { data: [], total: 0 };
      }

      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('FindReadyForTeknisi exception:', error);
      return { data: [], total: 0 };
    }
  },

  async countReadyForTeknisi() {
    try {
      const { count, error } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'complaint')
        .is('teknisi_id', null);

      if (error) {
        console.error('CountReadyForTeknisi error:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('CountReadyForTeknisi exception:', error);
      return 0;
    }
  },

  async countByTeknisiId(teknisiId, status = null) {
    try {
      let query = supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('teknisi_id', teknisiId);

      if (status) {
        query = query.eq('status', status);
      }

      const { count, error } = await query;

      if (error) {
        console.error('CountByTeknisiId error:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('CountByTeknisiId exception:', error);
      return 0;
    }
  }
};

module.exports = Complaint;