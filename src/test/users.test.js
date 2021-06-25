import supertest from 'supertest';
import app from '../App.js';
import connection from "../../database/database.js"

async function cleanDatabase () {
    await connection.query('DELETE FROM users');
}

beforeAll(cleanDatabase);

afterAll(async () => {
    await cleanDatabase();
    connection.end();
});

describe('POST /sign-up', () => {
    it('return status 201 for valid params', async () => {
        const body = {
            name: "teste", 
            email: "teste@teste.com", 
            password:"123456", 
            passwordConfirmation:"123456"
        }

        const result = await supertest(app).post('/sign-up').send(body);

        expect(result.status).toEqual(201)
    })
})