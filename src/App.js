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

//nova transição
app.post("/newtransaction", async (req, res) => {
    try {
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');               
       
        const user = await connection.query(`
        SELECT * FROM sessions
        JOIN users
        ON sessions."userId" = users.id
        WHERE sessions.token = $1
        `, [token]);

        if(!token) return res.sendStatus(401); 
        

        const { value, description, type } = req.body;  
        const date = dayjs(); 

        const acceptedTypes = ['entry', 'output'];
        
        const transactionSchema = Joi.object({
            value: Joi.string().required(),
            description: Joi.string().required(),
            type: Joi.string().valid(...acceptedTypes).required()
        });
    
        const validation = transactionSchema.validate(req.body);

        if (!validation.error) {   
        
            if(user.rows[0]) {
                const result = await connection.query(`
                INSERT INTO transactions ("idUser", date, description, value)
                VALUES ($1, $2, $3, $4, $5)
                `, [user.rows[0].userId, date, description, value, type])

                res.sendStatus(201);

            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(400);
        }

    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
});

//get transição
app.get("/transactions", async (req, res) => {
    try {
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');               
       
        const user = await connection.query(`
        SELECT * FROM sessions
        JOIN users
        ON sessions."userId" = users.id
        WHERE sessions.token = $1
        `, [token]);

        if(!token) return res.sendStatus(401);       
            
        console.log(user.rows[0])

        if(user.rows[0]) {
            const result = await connection.query(`
            SELECT * FROM transactions WHERE "idUser" = $1
            `, [user.rows[0].userId])

            res.send({
                transactions: result.rows,
                userName: user.rows[0].name                
            });
            
        } else {
            res.sendStatus(401);
        }

    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
});

//logout
app.post("/logout", async (req, res) => {
    try {
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');               
       
        if(!token) return res.sendStatus(401); 

        await connection.query(`
        DELETE FROM sessions
        WHERE token = $1
        `, [token]); 
        
        res.sendStatus(200);

    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    } 
});

app.listen(4000, () => {
    console.log('Server running on port 4000')
});

export default app;