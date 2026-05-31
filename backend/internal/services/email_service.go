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
	body := fmt.Sprintf(`
		<h2>Verifikasi Email</h2>
		<p>Halo,</p>
		<p>Terima kasih telah mendaftar di AmbilDarahku. Silakan verifikasi email Anda dengan mengklik tautan di bawah ini:</p>
		<p><a href="%s" style="display:inline-block;padding:12px 24px;background-color:#dc2626;color:#fff;text-decoration:none;border-radius:8px">Verifikasi Email</a></p>
		<p>Atau salin tautan ini ke browser Anda:</p>
		<p>%s</p>
		<p>Tautan ini berlaku selama 24 jam.</p>
		<br>
		<p>Tim AmbilDarahku</p>
	`, link, link)
	return s.Send(to, subject, body)
}

func (s *EmailService) SendPasswordResetEmail(to, token string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.cfg.AppURL, token)
	subject := "Atur Ulang Kata Sandi - AmbilDarahku"
	body := fmt.Sprintf(`
		<h2>Atur Ulang Kata Sandi</h2>
		<p>Halo,</p>
		<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun AmbilDarahku Anda. Klik tautan di bawah ini untuk melanjutkan:</p>
		<p><a href="%s" style="display:inline-block;padding:12px 24px;background-color:#dc2626;color:#fff;text-decoration:none;border-radius:8px">Atur Ulang Kata Sandi</a></p>
		<p>Atau salin tautan ini ke browser Anda:</p>
		<p>%s</p>
		<p>Tautan ini berlaku selama 1 jam.</p>
		<p>Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.</p>
		<br>
		<p>Tim AmbilDarahku</p>
	`, link, link)
	return s.Send(to, subject, body)
}


