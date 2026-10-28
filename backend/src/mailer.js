import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const COLOR = "#f43f5e"; // color de marca de Impulso
const FUENTE = "'Segoe UI', Tahoma, Arial, sans-serif";

export async function enviarVerificacion(email, nombre, link) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Verificá tu dirección de correo electrónico",
    text: `Hola ${nombre},\n\nPara terminar de crear tu cuenta de Impulso, verificá tu correo con este link (vence en 1 hora):\n${link}\n\nSi no fuiste vos, ignorá este mensaje.\n\nGracias,\nEl equipo de Impulso`,
    html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr>
    <td style="padding:24px 16px;">
      <table role="presentation" align="left" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;margin:0;font-family:${FUENTE};color:#2a2a2a;">
        <tr>
          <td style="font-size:14px;color:${COLOR};padding-bottom:8px;">Cuenta de Impulso</td>
        </tr>
        <tr>
          <td style="font-size:24px;font-weight:300;color:${COLOR};padding-bottom:20px;">Verificá tu dirección de correo electrónico</td>
        </tr>
        <tr>
          <td style="font-size:14px;line-height:22px;padding-bottom:12px;">Hola ${escapar(nombre)},</td>
        </tr>
        <tr>
          <td style="font-size:14px;line-height:22px;padding-bottom:20px;">
            Para terminar de crear tu cuenta de Impulso, verificá que esta dirección de correo te pertenece.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;">
            <a href="${link}" style="display:inline-block;background:${COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;">Verificar correo</a>
          </td>
        </tr>
        <tr>
          <td style="font-size:12px;line-height:18px;color:#666666;padding-bottom:20px;">
            Si el botón no funciona, copiá y pegá este link en tu navegador:<br>
            <a href="${link}" style="color:${COLOR};word-break:break-all;">${link}</a>
          </td>
        </tr>
        <tr>
          <td style="font-size:14px;line-height:22px;padding-bottom:20px;">
            Este link vence en 1 hora. Si no fuiste vos quien se registró, podés ignorar este mensaje.
          </td>
        </tr>
        <tr>
          <td style="font-size:14px;line-height:22px;">
            Gracias,<br>El equipo de Impulso
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  });
}