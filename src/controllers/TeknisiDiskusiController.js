const TeknisiDiskusi = require("../models/TeknisiDiskusi");
const { successResponse, errorResponse } = require("../utils/response");

class TeknisiDiskusiController {
  static async addDiskusi(req, res) {
    try {
      const { complaint_id } = req.body;
      const technician_id = req.user.id;

      const diskusi = await TeknisiDiskusi.addDiskusi({
        complaint_id,
        technician_id,
      });

      res.json(
        successResponse(diskusi, "Diskusi teknisi berhasil ditambahkan")
      );
    } catch (error) {
      res
        .status(500)
        .json(errorResponse("Gagal menambahkan diskusi teknisi", 500));
    }
  }
  static async getAllDiskusi(req, res) {
    try {
      const data = await TeknisiDiskusi.getAll();
      return res.json({
        success: true,
        message: "Semua diskusi teknisi berhasil diambil",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ getAllDiskusi controller error:", error.message);
      return res
        .status(500)
        .json(errorResponse("Gagal mengambil semua diskusi teknisi"));
    }
  }
}

module.exports = TeknisiDiskusiController;
