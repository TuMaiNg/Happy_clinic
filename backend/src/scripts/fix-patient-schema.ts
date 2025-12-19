import pool from '../config/database';

async function fixPatientSchema() {
  let connection;
  
  try {
    console.log('🔧 Starting database schema fix...');
    
    connection = await pool.getConnection();
    
    // Check current schema
    console.log('\n📋 Checking current schema...');
    const [currentSchema] = await connection.query(
      `SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        COLUMN_TYPE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'patients'
        AND COLUMN_NAME = 'user_id'`
    ) as any[];
    
    if (currentSchema.length > 0) {
      const column = currentSchema[0];
      console.log('Current user_id column:', {
        nullable: column.IS_NULLABLE,
        type: column.COLUMN_TYPE,
        default: column.COLUMN_DEFAULT,
      });
      
      if (column.IS_NULLABLE === 'NO') {
        console.log('\n⚠️  user_id is NOT NULL, fixing...');
        
        // Make user_id nullable
        await connection.query(
          'ALTER TABLE patients MODIFY COLUMN user_id INT NULL'
        );
        
        console.log('✅ Successfully made user_id nullable');
      } else {
        console.log('✅ user_id is already nullable, no changes needed');
      }
    } else {
      console.log('⚠️  Could not find user_id column in patients table');
    }
    
    // Verify the change
    console.log('\n🔍 Verifying change...');
    const [newSchema] = await connection.query(
      `SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'patients'
        AND COLUMN_NAME = 'user_id'`
    ) as any[];
    
    if (newSchema.length > 0) {
      console.log('Updated schema:', {
        nullable: newSchema[0].IS_NULLABLE,
        type: newSchema[0].COLUMN_TYPE,
      });
    }
    
    console.log('\n✅ Database schema fix completed successfully!');
    console.log('You can now create patients without user_id (walk-in patients)');
    
  } catch (error: any) {
    console.error('❌ Error fixing schema:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      message: error.message,
    });
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
fixPatientSchema();






