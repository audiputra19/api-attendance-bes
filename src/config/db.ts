import mysql from 'mysql2/promise'

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: 'nimda',
    password: process.env.DB_PASS,
    database: 'bes_medical'
});

connection.getConnection()
.then(() => {
    console.log('Database connected successfully');
})
.catch(err => {
    console.log('Datebase connection failed', err);
});

export default connection;