package service

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"log/slog"
	"net/mail"
	"net/smtp"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/thekrauss/lepapillon/internal/core/config"
)

var templateRoot = resolveTemplateRoot()

var sendMail = smtp.SendMail

type MailerService struct {
	cfg  config.MailConfig
	auth smtp.Auth
}

func NewMailerService(cfg config.MailConfig) *MailerService {
	var auth smtp.Auth
	if cfg.SMTP.User != "" || cfg.SMTP.AppPassword != "" {
		auth = smtp.PlainAuth("", cfg.SMTP.User, cfg.SMTP.AppPassword, cfg.SMTP.Host)
	}
	return &MailerService{
		cfg:  cfg,
		auth: auth,
	}
}

func (m *MailerService) GenerateHTML(templateName string, data map[string]string) (string, error) {
	if !strings.HasSuffix(templateName, ".html") {
		templateName += ".html"
	}
	tmpl, err := template.ParseFS(os.DirFS(templateRoot), "base.html", templateName)
	if err != nil {
		return "", fmt.Errorf("failed to parse template %s: %w", templateName, err)
	}

	var body bytes.Buffer
	if err := tmpl.ExecuteTemplate(&body, "base", data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return body.String(), nil
}

func (m *MailerService) SendEmail(to []string, subject string, htmlBody string) error {
	if !m.cfg.Enabled {
		slog.Info("mail service disabled (would send)", "to", to)
		return nil
	}
	if len(to) == 0 {
		return fmt.Errorf("at least one recipient is required")
	}

	headers := make(map[string]string)
	headers["From"] = formatFromHeader(m.cfg.FromName, m.cfg.FromEmail)
	headers["To"] = to[0]
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"UTF-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + htmlBody

	addr := fmt.Sprintf("%s:%d", m.cfg.SMTP.Host, m.cfg.SMTP.Port)
	return sendMail(addr, m.auth, m.cfg.FromEmail, to, []byte(message))
}

// SendTemplate satisfies the wmail.Sender interface: renders a template
// then sends the resulting HTML email.
func (m *MailerService) SendTemplate(_ context.Context, to []string, subject, templateName string, vars map[string]string) error {
	html, err := m.GenerateHTML(templateName, vars)
	if err != nil {
		return fmt.Errorf("generate template %s: %w", templateName, err)
	}
	return m.SendEmail(to, subject, html)
}

func resolveTemplateRoot() string {
	if custom := os.Getenv("MAIL_TEMPLATE_DIR"); custom != "" {
		if dirExists(custom) {
			return custom
		}
	}

	_, currentFile, _, ok := runtime.Caller(0)
	if ok {
		candidate := filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "templates"))
		if dirExists(candidate) {
			return candidate
		}
	}

	candidates := []string{
		"mail/templates",
	}
	for _, c := range candidates {
		if dirExists(c) {
			return c
		}
	}

	return "mail/templates"
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func formatFromHeader(name string, email string) string {
	if email == "" {
		return ""
	}
	if name == "" {
		return email
	}
	return (&mail.Address{Name: name, Address: email}).String()
}
