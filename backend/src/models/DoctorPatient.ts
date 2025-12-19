import pool from '../config/database';

export interface DoctorPatient {
  id?: number;
  doctorId: number;
  patientId: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DoctorPatientModel {
  /**
   * Bác sĩ chấp nhận bệnh nhân
   */
  static async acceptPatient(doctorId: number, patientId: number, notes?: string): Promise<DoctorPatient> {
    // Kiểm tra xem đã có relationship chưa
    const existing = await this.findByDoctorAndPatient(doctorId, patientId);
    
    if (existing) {
      // Cập nhật status thành accepted
      await pool.query(
        `UPDATE doctor_patients 
         SET status = 'accepted', 
             notes = ?,
             accepted_at = NOW(),
             updated_at = NOW()
         WHERE doctor_id = ? AND patient_id = ?`,
        [notes || null, doctorId, patientId]
      );
      return this.findByDoctorAndPatient(doctorId, patientId) as Promise<DoctorPatient>;
    } else {
      // Tạo mới
      const [result] = await pool.query(
        `INSERT INTO doctor_patients (doctor_id, patient_id, status, notes, accepted_at) 
         VALUES (?, ?, 'accepted', ?, NOW())`,
        [doctorId, patientId, notes || null]
      ) as any;
      
      return this.findById(result.insertId) as Promise<DoctorPatient>;
    }
  }

  /**
   * Bác sĩ từ chối bệnh nhân
   */
  static async rejectPatient(doctorId: number, patientId: number, reason?: string): Promise<DoctorPatient> {
    // Kiểm tra xem đã có relationship chưa
    const existing = await this.findByDoctorAndPatient(doctorId, patientId);
    
    if (existing) {
      // Cập nhật status thành rejected
      await pool.query(
        `UPDATE doctor_patients 
         SET status = 'rejected', 
             notes = ?,
             rejected_at = NOW(),
             updated_at = NOW()
         WHERE doctor_id = ? AND patient_id = ?`,
        [reason || null, doctorId, patientId]
      );
      return this.findByDoctorAndPatient(doctorId, patientId) as Promise<DoctorPatient>;
    } else {
      // Tạo mới với status rejected
      const [result] = await pool.query(
        `INSERT INTO doctor_patients (doctor_id, patient_id, status, notes, rejected_at) 
         VALUES (?, ?, 'rejected', ?, NOW())`,
        [doctorId, patientId, reason || null]
      ) as any;
      
      return this.findById(result.insertId) as Promise<DoctorPatient>;
    }
  }

  /**
   * Bệnh nhân yêu cầu được bác sĩ nhận (tạo request)
   */
  static async requestAcceptance(patientId: number, doctorId: number, notes?: string): Promise<DoctorPatient> {
    // Kiểm tra xem đã có relationship chưa
    const existing = await this.findByDoctorAndPatient(doctorId, patientId);
    
    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('Bệnh nhân đã được bác sĩ chấp nhận');
      }
      if (existing.status === 'pending') {
        throw new Error('Yêu cầu đang chờ xử lý');
      }
      // Nếu đã rejected, tạo lại request mới
      await pool.query(
        `UPDATE doctor_patients 
         SET status = 'pending', 
             notes = ?,
             rejected_at = NULL,
             updated_at = NOW()
         WHERE doctor_id = ? AND patient_id = ?`,
        [notes || null, doctorId, patientId]
      );
      return this.findByDoctorAndPatient(doctorId, patientId) as Promise<DoctorPatient>;
    } else {
      // Tạo mới với status pending
      const [result] = await pool.query(
        `INSERT INTO doctor_patients (doctor_id, patient_id, status, notes) 
         VALUES (?, ?, 'pending', ?)`,
        [doctorId, patientId, notes || null]
      ) as any;
      
      return this.findById(result.insertId) as Promise<DoctorPatient>;
    }
  }

  /**
   * Tìm relationship giữa bác sĩ và bệnh nhân
   */
  static async findByDoctorAndPatient(doctorId: number, patientId: number): Promise<DoctorPatient | null> {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM doctor_patients 
         WHERE doctor_id = ? AND patient_id = ?`,
        [doctorId, patientId]
      ) as any[];

      return rows.length > 0 ? this.mapRowToDoctorPatient(rows[0]) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing error
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
        console.warn('⚠️  Bảng doctor_patients chưa tồn tại. Vui lòng chạy migration.');
        return null;
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách bệnh nhân của bác sĩ (theo status)
   */
  static async findByDoctor(doctorId: number, status?: 'pending' | 'accepted' | 'rejected'): Promise<any[]> {
    try {
      let query = `
        SELECT dp.*,
               p.id as patient_id, p.full_name as patient_name, p.phone, p.email, p.birthday, p.gender,
               u.email as patient_user_email
        FROM doctor_patients dp
        JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE dp.doctor_id = ?
      `;
      const params: any[] = [doctorId];

      if (status) {
        query += ' AND dp.status = ?';
        params.push(status);
      }

      query += ' ORDER BY dp.created_at DESC';

      const [rows] = await pool.query(query, params) as any[];

      return rows.map((row: any) => ({
        id: row.id,
        doctorId: row.doctor_id,
        patientId: row.patient_id,
        status: row.status,
        notes: row.notes,
        acceptedAt: row.accepted_at,
        rejectedAt: row.rejected_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        patient: {
          id: row.patient_id,
          fullName: row.patient_name,
          phone: row.phone,
          email: row.email || row.patient_user_email,
          birthday: row.birthday,
          gender: row.gender,
        },
      }));
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing error
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
        console.warn('⚠️  Bảng doctor_patients chưa tồn tại. Vui lòng chạy migration.');
        return [];
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách bác sĩ của bệnh nhân (theo status)
   */
  static async findByPatient(patientId: number, status?: 'pending' | 'accepted' | 'rejected'): Promise<any[]> {
    let query = `
      SELECT dp.*,
             d.id as doctor_id, d.full_name as doctor_name, d.speciality, d.experience_years, d.avatar,
             u.email as doctor_email
      FROM doctor_patients dp
      JOIN doctors d ON dp.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE dp.patient_id = ?
    `;
    const params: any[] = [patientId];

    if (status) {
      query += ' AND dp.status = ?';
      params.push(status);
    }

    query += ' ORDER BY dp.created_at DESC';

    const [rows] = await pool.query(query, params) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      status: row.status,
      notes: row.notes,
      acceptedAt: row.accepted_at,
      rejectedAt: row.rejected_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      doctor: {
        id: row.doctor_id,
        fullName: row.doctor_name,
        speciality: row.speciality,
        experienceYears: row.experience_years,
        avatar: row.avatar,
        email: row.doctor_email,
      },
    }));
  }

  /**
   * Kiểm tra bác sĩ đã chấp nhận bệnh nhân chưa
   */
  static async isAccepted(doctorId: number, patientId: number): Promise<boolean> {
    const relationship = await this.findByDoctorAndPatient(doctorId, patientId);
    return relationship?.status === 'accepted';
  }

  /**
   * Xóa relationship (bác sĩ có thể remove bệnh nhân)
   */
  static async delete(doctorId: number, patientId: number): Promise<boolean> {
    const [result] = await pool.query(
      `DELETE FROM doctor_patients 
       WHERE doctor_id = ? AND patient_id = ?`,
      [doctorId, patientId]
    ) as any;

    return result.affectedRows > 0;
  }

  static async findById(id: number): Promise<DoctorPatient | null> {
    const [rows] = await pool.query(
      'SELECT * FROM doctor_patients WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToDoctorPatient(rows[0]) : null;
  }

  private static mapRowToDoctorPatient(row: any): DoctorPatient {
    return {
      id: row.id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      status: row.status,
      notes: row.notes,
      acceptedAt: row.accepted_at,
      rejectedAt: row.rejected_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

