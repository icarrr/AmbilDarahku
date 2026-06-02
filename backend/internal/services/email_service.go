package services

import (
	"fmt"
	"net/smtp"

	"github.com/icarrr/ambildarahku-backend/internal/config"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

func (s *EmailService) Send(to, subject, body string) error {
	if !s.cfg.SMTPEnabled() {
		return nil
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		s.cfg.SMTPFrom, to, subject, body)

	addr := fmt.Sprintf("%s:%s", s.cfg.SMTPHost, s.cfg.SMTPPort)
	auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPassword, s.cfg.SMTPHost)

	return smtp.SendMail(addr, auth, s.cfg.SMTPFrom, []string{to}, []byte(msg))
}

func (s *EmailService) SendVerificationEmail(to, token string) error {
	link := fmt.Sprintf("%s/verify-email?token=%s", s.cfg.AppURL, token)
	subject := "Verifikasi Email - AmbilDarahku"
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td align="center" style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 20px 32px">
<table cellpadding="0" cellspacing="0"><tr><td align="center">
<div style="width:48px;height:48px;background-color:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
</div>
<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">Verifikasi Email</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85)">AmbilDarahku</p>
</td></tr></table>
</td></tr>
<tr><td style="padding:32px 32px 24px">
<table cellpadding="0" cellspacing="0"><tr><td style="font-size:15px;line-height:1.6;color:#374151">
<p style="margin:0 0 8px">Halo,</p>
<p style="margin:0 0 16px">Terima kasih telah mendaftar di <strong>AmbilDarahku</strong>. Silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
<table cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px">
<a href="%s" style="display:inline-block;padding:14px 32px;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px">Verifikasi Email</a>
</td></tr></table>
<div style="border-top:1px solid #e5e7eb;margin:12px 0 16px"></div>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280">Tombol tidak berfungsi? Salin tautan berikut ke browser Anda:</p>
<p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all">%s</p>
<div style="border-top:1px solid #e5e7eb;margin:20px 0 0"></div>
<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center">Tautan ini berlaku selama <strong>24 jam</strong>.</p>
<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-align:center">Jika Anda tidak mendaftar di AmbilDarahku, abaikan email ini.</p>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#fafafa;padding:20px 32px">
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">Tim <strong>AmbilDarahku</strong> &mdash; Donor Darah, Sebarkan Kebaikan</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`, link, link)
	return s.Send(to, subject, body)
}

func (s *EmailService) SendPasswordResetEmail(to, token string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.cfg.AppURL, token)
	subject := "Atur Ulang Kata Sandi - AmbilDarahku"
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td align="center" style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 20px 32px">
<table cellpadding="0" cellspacing="0"><tr><td align="center">
<div style="width:48px;height:48px;background-color:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
</div>
<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">Atur Ulang Kata Sandi</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85)">AmbilDarahku</p>
</td></tr></table>
</td></tr>
<tr><td style="padding:32px 32px 24px">
<table cellpadding="0" cellspacing="0"><tr><td style="font-size:15px;line-height:1.6;color:#374151">
<p style="margin:0 0 8px">Halo,</p>
<p style="margin:0 0 16px">Kami menerima permintaan untuk mengatur ulang kata sandi akun <strong>AmbilDarahku</strong> Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
<table cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px">
<a href="%s" style="display:inline-block;padding:14px 32px;background-color:#dc2626;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px">Atur Ulang Kata Sandi</a>
</td></tr></table>
<div style="border-top:1px solid #e5e7eb;margin:12px 0 16px"></div>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280">Tombol tidak berfungsi? Salin tautan berikut ke browser Anda:</p>
<p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all">%s</p>
<div style="border-top:1px solid #e5e7eb;margin:20px 0 0"></div>
<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center">Tautan ini berlaku selama <strong>1 jam</strong>.</p>
<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-align:center">Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.</p>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#fafafa;padding:20px 32px">
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">Tim <strong>AmbilDarahku</strong> &mdash; Donor Darah, Sebarkan Kebaikan</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`, link, link)
	return s.Send(to, subject, body)
}


