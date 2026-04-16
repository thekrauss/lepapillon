package wmail

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/hibiken/asynq"
)

type MailTaskPayload struct {
	To        []string          `json:"to"`
	Subject   string            `json:"subject"`
	Template  string            `json:"template"`
	Variables map[string]string `json:"variables"`
}

type Sender interface {
	SendTemplate(ctx context.Context, to []string, subject, template string, vars map[string]string) error
}

type MailWorker struct {
	sender Sender
}

func NewMailWorker(sender Sender) *MailWorker {
	return &MailWorker{sender: sender}
}

func (w *MailWorker) HandleMailSendTask(ctx context.Context, t *asynq.Task) error {
	var p MailTaskPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	if w.sender == nil {
		slog.Warn("mail sender not configured, skipping", "subject", p.Subject)
		return nil
	}

	if err := w.sender.SendTemplate(ctx, p.To, p.Subject, p.Template, p.Variables); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	masked := make([]string, 0, len(p.To))
	for _, email := range p.To {
		masked = append(masked, maskEmailForLog(email))
	}

	slog.Info("email sent",
		"recipient_count", len(p.To),
		"recipients", masked,
		"subject", p.Subject,
		"template", p.Template,
	)
	return nil
}

func maskEmailForLog(email string) string {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return ""
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	local := parts[0]
	if local == "" {
		local = "*"
	}
	return local[:1] + "***@" + parts[1]
}
