import pool from '../config/database';

export interface FavoriteDoctor {
  id?: number;
  patientId: number;
  doctorId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FavoriteDoctorModel {
  static async create(favorite: Omit<FavoriteDoctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<FavoriteDoctor> {
    // Check if already exists
    const existing = await this.findByPatientAndDoctor(favorite.patientId, favorite.doctorId);
    if (existing) {
      return existing;
    }

    const [result] = await pool.query(
      `INSERT INTO favorite_doctors (patient_id, doctor_id) VALUES (?, ?)`,
      [favorite.patientId, favorite.doctorId]
    ) as any;

    return this.findById(result.insertId) as Promise<FavoriteDoctor>;
  }

  static async findById(id: number): Promise<FavoriteDoctor | null> {
    const [rows] = await pool.query(
      'SELECT * FROM favorite_doctors WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToFavoriteDoctor(rows[0]) : null;
  }

  static async findByPatientAndDoctor(patientId: number, doctorId: number): Promise<FavoriteDoctor | null> {
    const [rows] = await pool.query(
      'SELECT * FROM favorite_doctors WHERE patient_id = ? AND doctor_id = ?',
      [patientId, doctorId]
    ) as any[];

    return rows.length > 0 ? this.mapRowToFavoriteDoctor(rows[0]) : null;
  }

  static async findByPatient(patientId: number): Promise<FavoriteDoctor[]> {
    const [rows] = await pool.query(
      `SELECT fd.*, 
              d.id as doctor_id, d.full_name as doctor_name, d.speciality, d.experience_years, d.avatar,
              u.email as doctor_email
       FROM favorite_doctors fd
       JOIN doctors d ON fd.doctor_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE fd.patient_id = ?
       ORDER BY fd.created_at DESC`,
      [patientId]
    ) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Additional doctor info
      doctor: {
        id: row.doctor_id,
        fullName: row.doctor_name,
        speciality: row.speciality,
        experienceYears: row.experience_years,
        avatar: row.avatar,
        email: row.doctor_email,
      },
    })) as any;
  }

  static async delete(patientId: number, doctorId: number): Promise<boolean> {
    const [result] = await pool.query(
      'DELETE FROM favorite_doctors WHERE patient_id = ? AND doctor_id = ?',
      [patientId, doctorId]
    ) as any;

    return result.affectedRows > 0;
  }

  static async isFavorite(patientId: number, doctorId: number): Promise<boolean> {
    const favorite = await this.findByPatientAndDoctor(patientId, doctorId);
    return favorite !== null;
  }

  private static mapRowToFavoriteDoctor(row: any): FavoriteDoctor {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}


