package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

type ServerConfig struct {
	Host               string   `json:"host"`
	Port               int      `json:"port"`
	CorsAllowedOrigins []string `json:"cors_allowed_origins"`
}

type StorageConfig struct {
	Directory         string   `json:"directory"`
	AllowedExtensions []string `json:"allowed_extensions"`
	MaxFileSizeMB     int      `json:"max_file_size_mb"`
}

type LoggingConfig struct {
	Level         string `json:"level"`
	File          string `json:"file"`
	EnableConsole bool   `json:"enable_console"`
}

type Config struct {
	Server  ServerConfig  `json:"server"`
	Storage StorageConfig `json:"storage"`
	Logging LoggingConfig `json:"logging"`
}

func LoadConfig(configPath string) (*Config, error) {
	// Set default configuration
	config := &Config{
		Server: ServerConfig{
			Host:               "0.0.0.0",
			Port:               8080,
			CorsAllowedOrigins: []string{"http://localhost:3000"},
		},
		Storage: StorageConfig{
			Directory:         "files",
			AllowedExtensions: []string{".md", ".markdown", ".txt"},
			MaxFileSizeMB:     10,
		},
		Logging: LoggingConfig{
			Level:         "info",
			File:          "markdown_editor.log",
			EnableConsole: true,
		},
	}

	// If config file exists, load it
	if configPath != "" {
		file, err := os.Open(configPath)
		if err != nil {
			return nil, fmt.Errorf("error opening config file: %v", err)
		}
		defer file.Close()

		decoder := json.NewDecoder(file)
		if err := decoder.Decode(config); err != nil {
			return nil, fmt.Errorf("error decoding config file: %v", err)
		}
	}

	// Create storage directory if it doesn't exist
	if err := os.MkdirAll(config.Storage.Directory, 0755); err != nil {
		return nil, fmt.Errorf("error creating storage directory: %v", err)
	}

	return config, nil
}

func (c *Config) ValidateConfig() error {
	// Validate storage directory
	if c.Storage.Directory == "" {
		return fmt.Errorf("storage directory cannot be empty")
	}

	// Validate port number
	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid port number: %d", c.Server.Port)
	}

	// Validate max file size
	if c.Storage.MaxFileSizeMB < 1 {
		return fmt.Errorf("max file size must be at least 1 MB")
	}

	// Validate allowed extensions
	for _, ext := range c.Storage.AllowedExtensions {
		if ext == "" || ext[0] != '.' {
			return fmt.Errorf("invalid file extension: %s", ext)
		}
	}

	// Validate log level
	switch c.Logging.Level {
	case "debug", "info", "warn", "error":
		// Valid log levels
	default:
		return fmt.Errorf("invalid log level: %s", c.Logging.Level)
	}

	return nil
}

func (c *Config) GetServerAddress() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}

func (c *Config) IsExtensionAllowed(filename string) bool {
	ext := filepath.Ext(filename)
	for _, allowedExt := range c.Storage.AllowedExtensions {
		if ext == allowedExt {
			return true
		}
	}
	return false
}

func (c *Config) IsCorsAllowed(origin string) bool {
	for _, allowed := range c.Server.CorsAllowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}

func ParseFlags() string {
	configPath := flag.String("config", "config.json", "path to configuration file")
	flag.Parse()
	return *configPath
}
