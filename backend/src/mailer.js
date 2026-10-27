import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function enviarVerificacion(email, nombre, link) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Confirmá tu cuenta en Impulso",
    html: `
      <p>Hola ${nombre.replace(/[<>]/g, "")},</p>
      <p>Confirmá tu correo para activar tu cuenta (el link vence en 1 hora):</p>
      <p><a href="${link}">Confirmar mi cuenta</a></p>
      <p>Si no fuiste vos, ignorá este mensaje.</p>`,
  });
}