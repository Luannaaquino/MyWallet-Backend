import express from 'express';
import cors from 'cors';
import Joi from "joi";
import pg from 'pg';
import bcrypt from 'bcrypt'; //segurança de senha

const databaseConfig = {
    user: 'postgres',
    password: '123456',
    database: 'mywallet',
    host: 'localhost',
    port: 5432
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

const app = express();
app.use(cors());
app.use(express.json());

//rota cadastro
app.post('/sign-up', async (req,res) => {
    const { name, email, password, passwordConfirmation} = req.body;

    const signUpSchema = Joi.object({
        name: Joi.string().alphanum().min(2).max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(3).max(20).required(),
        passwordConfirmation: Joi.ref('password'),
    });

    const validation = signUpSchema.validate(req.body);
    if(validation.error){
        return res.sendStatus(422)
    }

    const checkEmail = await connection.query(`
    SELECT * FROM users 
    WHERE email = $1`,[email]);
    if(checkEmail.rows.length !==0){
        return res.sendStatus(409)
    }

    const hashPassword = bcrypt.hashSync(password,12)
    await connection.query(`INSERT INTO users (name, email, password) VALUES ($1,$2,$3)`, [name, email, hashPassword]);

    res.sendStatus(201)
    
});
    
    

app.listen(4000, () => {
    console.log('Server running on port 4000')
});