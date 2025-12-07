// Simpan token di memory (untuk development)
// Untuk production, bisa ganti ke Redis atau database
class TokenStore {
  constructor() {
    this.tokens = new Map();
    
    // Auto cleanup expired tokens setiap 1 jam
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  // Simpan token
  set(token, userData) {
    this.tokens.set(token, {
      ...userData,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 hari
    });
  }

  // Cek token
  get(token) {
    const session = this.tokens.get(token);
    
    if (!session) return null;
    
    // Cek expired
    if (Date.now() > session.expiresAt) {
      this.tokens.delete(token);
      return null;
    }
    
    return session;
  }

  // Hapus token (logout)
  delete(token) {
    return this.tokens.delete(token);
  }

  // Cleanup expired tokens
  cleanup() {
    const now = Date.now();
    for (const [token, session] of this.tokens.entries()) {
      if (now > session.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  // Get all tokens (untuk debugging)
  getAll() {
    return Array.from(this.tokens.entries());
  }
}

// Export singleton instance
module.exports = new TokenStore();