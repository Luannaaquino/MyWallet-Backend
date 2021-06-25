import express from 'express';
import cors from 'cors';
import Joi from "joi";
import pg from 'pg';
import bcrypt from 'bcrypt'; //segurança de senha
import { v4 as uuidv4 } from 'uuid'; //gerar token
import connection from "../database/database.js"

const app = express();
app.use(cors());
app.use(express.json());

//rota cadastro
app.post('/sign-up', async (req,res) => {
    const { name, email, password, passwordConfirmation } = req.body;

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
    
//rota Login
app.post('/sign-in', async (req,res) => {
     try {
        const { email, password } = req.body;
        const userQuery = await connection.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = userQuery.rows[0];
        if (user && bcrypt.compareSync(password, user.password))  {
            const token = uuidv4();
            await connection.query(`
                INSERT INTO sessions ("userId", token) VALUES ($1,$2)
                `, [user.id, token]);
            res.send({ name: user.name, token });
        } else {
            return res.sendStatus(401);
        }
    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    } 
});
app.listen(4000, () => {
    console.log('Server running on port 4000')
});

export default app;