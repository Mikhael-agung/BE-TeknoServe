const supabase = require("../config/supabase");

const TeknisiDiskusi = {
  async addDiskusi({ complaint_id, technician_id }) {
    const { data, error } = await supabase
      .from("diskusi_teknisi")
      .insert([{ complaint_id, technician_id }])
      .select()
      .single();

    if (error) {
      console.error("❌ addDiskusi error:", error.message);
      throw error;
    }
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("diskusi_teknisi")
      .select(
        `
      id,
      created_at,
      technician:technician_id (id, full_name, phone),
      complaint:complaint_id (id, judul, user:user_id (id, full_name))
    `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getAll error:", error.message);
      return [];
    }
    return data || [];
  },
};

module.exports = TeknisiDiskusi;
