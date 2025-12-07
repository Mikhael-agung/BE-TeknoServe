// Simple in-memory Complaint model
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

  // Search User by username/email
  async findByUsernameOrEmail(query) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .single();

    return error ? null : data;
  },

  // Create new User
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .single();

    if (error) throw error;
    return data;      
  },


  // Update User
  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

module.exports = User;
