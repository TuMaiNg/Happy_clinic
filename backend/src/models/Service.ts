import pool from '../config/database';

export interface Service {
  id?: number;
  name: string;
  speciality: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceModel {
  static async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const [result] = await pool.query(
      `INSERT INTO services (name, speciality, description, price, duration_minutes, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        service.name,
        service.speciality,
        service.description || null,
        service.price,
        service.durationMinutes,
        service.isActive !== false,
      ]
    ) as any;

    return this.findById(result.insertId) as Promise<Service>;
  }

  static async findById(id: number): Promise<Service | null> {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToService(rows[0]) : null;
  }

  static async findAll(filters?: {
    speciality?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Service[]> {
    let query = 'SELECT * FROM services WHERE 1=1';
    const values: any[] = [];

    if (filters?.speciality) {
      query += ' AND speciality = ?';
      values.push(filters.speciality);
    }

    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ?';
      values.push(filters.isActive);
    }

    if (filters?.search) {
      query += ' AND (name LIKE ? OR speciality LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, values) as any[];
    return rows.map((row: any) => this.mapRowToService(row));
  }

  static async update(id: number, updates: Partial<Service>): Promise<Service | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.speciality) {
      fields.push('speciality = ?');
      values.push(updates.speciality);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description || null);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }
    if (updates.durationMinutes !== undefined) {
      fields.push('duration_minutes = ?');
      values.push(updates.durationMinutes);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToService(row: any): Service {
    return {
      id: row.id,
      name: row.name,
      speciality: row.speciality,
      description: row.description,
      price: parseFloat(row.price),
      durationMinutes: row.duration_minutes,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
