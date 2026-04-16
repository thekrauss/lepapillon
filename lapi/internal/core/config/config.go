package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type GlobalConfig struct {
	ServiceName string          `mapstructure:"service_name"`
	ProjectID   string          `mapstructure:"project_id"`
	Env         string          `mapstructure:"env"`
	Logger      LoggerConfig    `mapstructure:"logger"`
	Server      ServerConfig    `mapstructure:"server"`
	Database    DatabaseConfig  `mapstructure:"database"`
	Redis       RedisConfig     `mapstructure:"redis"`
	JWT         JWTConfig       `mapstructure:"jwt"`
	Payment     PaymentConfig   `mapstructure:"payment"`
	RateLimit   RateLimitConfig `mapstructure:"rate_limit"`
	Mail        MailConfig      `mapstructure:"mail"`
	Worker      WorkerConfig    `mapstructure:"worker"`
	OIDC        OIDCConfig      `mapstructure:"oidc"`
	Frontend    FrontendConfig  `mapstructure:"frontend"`
}

type OIDCConfig struct {
	Enabled           bool          `mapstructure:"enabled"`
	Issuer            string        `mapstructure:"issuer"`
	JWKSURL           string        `mapstructure:"jwks_url"`
	Audience          string        `mapstructure:"audience"`
	ClientID          string        `mapstructure:"client_id"`
	ClientSecret      string        `mapstructure:"client_secret"`
	AdminBaseURL      string        `mapstructure:"admin_base_url"`
	AdminRealm        string        `mapstructure:"admin_realm"`
	AdminClientID     string        `mapstructure:"admin_client_id"`
	AdminClientSecret string        `mapstructure:"admin_client_secret"`
	StrictAudience    bool          `mapstructure:"strict_audience"`
	HTTPTimeout       time.Duration `mapstructure:"http_timeout"`
}

type FrontendConfig struct {
	BaseURL string `mapstructure:"base_url"`
}

type WorkerConfig struct {
	Enabled     bool `mapstructure:"enabled"`
	Concurrency int  `mapstructure:"concurrency"`
}

type LoggerConfig struct {
	Level string `mapstructure:"level"`
}

type ServerConfig struct {
	HTTPPort        int           `mapstructure:"http_port"`
	PublicBaseURL   string        `mapstructure:"public_base_url"`
	ShutdownTimeout time.Duration `mapstructure:"shutdown_timeout"`
	AllowedOrigins  []string      `mapstructure:"allowed_origins"`
}

type DatabaseConfig struct {
	Driver       string `mapstructure:"driver"`
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	User         string `mapstructure:"user"`
	Password     string `mapstructure:"password"`
	Name         string `mapstructure:"name"`
	SSLMode      string `mapstructure:"sslmode"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode,
	)
}

type RedisConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

type JWTConfig struct {
	Secret        string        `mapstructure:"secret"`
	AccessExpiry  time.Duration `mapstructure:"access_expiry"`
	RefreshExpiry time.Duration `mapstructure:"refresh_expiry"`
}

type PaymentConfig struct {
	Provider              string        `mapstructure:"provider"`
	Currency              string        `mapstructure:"currency"`
	StripeSecretKey       string        `mapstructure:"stripe_secret_key"`
	StripePublishableKey  string        `mapstructure:"stripe_publishable_key"`
	StripeWebhookSecret   string        `mapstructure:"stripe_webhook_secret"`
	WebhookAsyncEnabled   bool          `mapstructure:"webhook_async_enabled"`
	HTTPTimeout           time.Duration `mapstructure:"http_timeout"`
	ReconcileInterval     time.Duration `mapstructure:"reconcile_interval"`
	ReconcileBatchSize    int           `mapstructure:"reconcile_batch_size"`
}

type RateLimitConfig struct {
	Enabled bool `mapstructure:"enabled"`
	Limit   int  `mapstructure:"limit"`
	Burst   int  `mapstructure:"burst"`
}

type MailConfig struct {
	Enabled    bool           `mapstructure:"enabled"`
	Provider   string         `mapstructure:"provider"`
	FromName   string         `mapstructure:"from_name"`
	FromEmail  string         `mapstructure:"from_email"`
	ChefEmail  string         `mapstructure:"chef_email"`
	SendGrid   SendGridConfig `mapstructure:"sendgrid"`
	SMTP       SMTPConfig     `mapstructure:"smtp"`
}

type SendGridConfig struct {
	APIKey string `mapstructure:"api_key"`
}

type SMTPConfig struct {
	Host        string `mapstructure:"host"`
	Port        int    `mapstructure:"port"`
	User        string `mapstructure:"user"`
	AppPassword string `mapstructure:"app_password"`
}

// Load reads configuration from the YAML file at configPath and overlays
// environment variables prefixed with LEPAPILLON_.
// Config is an alias kept for backward compatibility.
type Config = GlobalConfig

func Load(configPath string) (*GlobalConfig, error) {
	v := viper.New()

	v.SetConfigFile(configPath)
	v.SetEnvPrefix("LEPAPILLON")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	var cfg GlobalConfig
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("validate config: %w", err)
	}

	return &cfg, nil
}

func (c *GlobalConfig) IsDev() bool {
	return c.Env == "dev" || c.Env == "development"
}

func (c *GlobalConfig) validate() error {
	if c.Server.HTTPPort == 0 {
		return fmt.Errorf("server.http_port is required")
	}
	if c.Database.Host == "" {
		return fmt.Errorf("database.host is required")
	}
	if c.Database.Name == "" {
		return fmt.Errorf("database.name is required")
	}
	if !c.IsDev() && c.JWT.Secret == "" {
		return fmt.Errorf("jwt.secret is required in non-dev environments")
	}
	return nil
}
