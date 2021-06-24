import Joi from "joi";

const signIn = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const signUp = Joi.object({
    username: Joi.string().alphanum().min(2).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(20).required(),
    passwordConfirmation: Joi.ref('password'),
});


export default signUp;
