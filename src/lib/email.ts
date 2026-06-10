import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  if (!host || !port) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASSWORD || "",
    },
  });
}

function getFrom(): string {
  return process.env.SMTP_FROM || process.env.SMTP_SENDER || "noreply@ambildarahku.id";
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

function verificationEmailHtml(link: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td align="center" style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 20px 32px">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">Verifikasi Email</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85)">AmbilDarahku</p>
</td></tr>
<tr><td style="padding:32px 32px 24px">
<p style="margin:0 0 8px;font-size:15px;color:#374151">Halo,</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151">Terima kasih telah mendaftar di <strong>AmbilDarahku</strong>. Silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
<table cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px">
<a href="${link}" style="display:inline-block;padding:14px 32px;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px">Verifikasi Email</a>
</td></tr></table>
<p style="margin:0;font-size:12px;color:#9ca3af">Tautan ini berlaku selama <strong>24 jam</strong>.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function resetPasswordEmailHtml(link: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td align="center" style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 20px 32px">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">Atur Ulang Kata Sandi</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85)">AmbilDarahku</p>
</td></tr>
<tr><td style="padding:32px 32px 24px">
<p style="margin:0 0 8px;font-size:15px;color:#374151">Halo,</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151">Kami menerima permintaan untuk mengatur ulang kata sandi akun <strong>AmbilDarahku</strong> Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
<table cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px">
<a href="${link}" style="display:inline-block;padding:14px 32px;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px">Atur Ulang Kata Sandi</a>
</td></tr></table>
<p style="margin:0;font-size:12px;color:#9ca3af">Tautan ini berlaku selama <strong>1 jam</strong>.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;
  const link = `${getAppUrl()}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Verifikasi Email - AmbilDarahku",
    html: verificationEmailHtml(link),
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;
  const link = `${getAppUrl()}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Atur Ulang Kata Sandi - AmbilDarahku",
    html: resetPasswordEmailHtml(link),
  });
}
