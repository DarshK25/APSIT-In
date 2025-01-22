import { MailtrapClient } from "mailtrap";
import dotenv from 'dotenv'; //to access token

dotenv.config();
const TOKEN = process.env.MAILTRAP_TOKEN;

export const mailtrapClient = new MailtrapClient({
    token: TOKEN //token is used for authentication of the client to communicate with Mailtrap
});
export const sender = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME,
}