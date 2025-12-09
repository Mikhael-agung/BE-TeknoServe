const supabase = require('../config/supabase');

const User = {
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return error ? null : data;
  },

  async findByUsernameOrEmail(query) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${query},email.eq.${query}`)
      .single();

    return error ? null : data;
  },

  //  tambah .select() untuk return data
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select() 
      .single();

    if (error) throw error;
    return data;      
  },

  //  tambah .select()
  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()  
      .single();

    if (error) throw error;
    return data;
  }
};

module.exports = User;