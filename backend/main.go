package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var config *Config

type FileContent struct {
	Content  string `json:"content"`
	Filename string `json:"filename"`
}

func setupLogging() (*os.File, error) {
	if config.Logging.File != "" {
		logFile, err := os.OpenFile(config.Logging.File, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			return nil, fmt.Errorf("error opening log file: %v", err)
		}

		if config.Logging.EnableConsole {
			mw := io.MultiWriter(os.Stdout, logFile)
			log.SetOutput(mw)
		} else {
			log.SetOutput(logFile)
		}

		return logFile, nil
	}

	return nil, nil
}

func logRequest(r *http.Request) {
	if config.Logging.Level == "debug" {
		log.Printf("Received %s request from %s", r.Method, r.RemoteAddr)
		log.Printf("Request Headers: %+v", r.Header)
		log.Printf("Request Origin: %s", r.Header.Get("Origin"))
	}
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logRequest(r)

		origin := r.Header.Get("Origin")
		if config.IsCorsAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if strings.HasPrefix(origin, "http://192.168.") || strings.HasPrefix(origin, "http://10.") {
			// Allow local network addresses
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func saveFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var fileContent FileContent
	if err := json.NewDecoder(r.Body).Decode(&fileContent); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !config.IsExtensionAllowed(fileContent.Filename) {
		log.Printf("Invalid file extension: %s", fileContent.Filename)
		http.Error(w, "Invalid file extension", http.StatusBadRequest)
		return
	}

	contentSize := len(fileContent.Content) / (1024 * 1024) // Size in MB
	if contentSize > config.Storage.MaxFileSizeMB {
		log.Printf("File too large: %dMB (max: %dMB)", contentSize, config.Storage.MaxFileSizeMB)
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	filename := filepath.Join(config.Storage.Directory, fileContent.Filename)
	if err := ioutil.WriteFile(filename, []byte(fileContent.Content), 0644); err != nil {
		log.Printf("Error writing file: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("File saved successfully: %s", filename)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "File saved successfully"})
}

func getFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filename := r.URL.Query().Get("filename")
	if filename == "" {
		log.Printf("Filename is required")
		http.Error(w, "Filename is required", http.StatusBadRequest)
		return
	}

	if !config.IsExtensionAllowed(filename) {
		log.Printf("Invalid file extension: %s", filename)
		http.Error(w, "Invalid file extension", http.StatusBadRequest)
		return
	}

	filepath := filepath.Join(config.Storage.Directory, filename)
	content, err := ioutil.ReadFile(filepath)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("File not found: %s", filepath)
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}
		log.Printf("Error reading file: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("File read successfully: %s", filepath)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FileContent{
		Content:  string(content),
		Filename: filename,
	})
}

func createDailyNote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req DailyNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Use current date if not specified
	date := req.Date
	if date == "" {
		date = getCurrentDate()
	}

	// Append content to daily note
	if err := AppendToDailyNote(date, req.Content); err != nil {
		log.Printf("Error creating/appending daily note: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Daily note entry added successfully for date: %s", date)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Daily note entry added successfully",
		"date":    date,
		"time":    getCurrentTime(),
	})
}

func listDailyNotes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	notes, err := ListDailyNotes()
	if err != nil {
		log.Printf("Error listing daily notes: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Listed %d daily notes", len(notes.Notes))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

func getDailyNote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	date := r.URL.Query().Get("date")
	if date == "" {
		date = getCurrentDate() // Default to today
	}

	note, err := GetDailyNote(date)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("Daily note not found for date: %s", date)
			http.Error(w, "Daily note not found", http.StatusNotFound)
			return
		}
		log.Printf("Error reading daily note: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Daily note read successfully for date: %s", date)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func main() {
	// Load configuration
	configPath := ParseFlags()
	var err error
	config, err = LoadConfig(configPath)
	if err != nil {
		log.Fatalf("Error loading configuration: %v", err)
	}

	// Validate configuration
	if err := config.ValidateConfig(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// Setup logging
	logFile, err := setupLogging()
	if err != nil {
		log.Fatalf("Error setting up logging: %v", err)
	}
	if logFile != nil {
		defer logFile.Close()
	}

	// Setup HTTP handlers
	http.HandleFunc("/api/save", enableCORS(saveFile))
	http.HandleFunc("/api/get", enableCORS(getFile))
	http.HandleFunc("/api/daily/create", enableCORS(createDailyNote))
	http.HandleFunc("/api/daily/list", enableCORS(listDailyNotes))
	http.HandleFunc("/api/daily/get", enableCORS(getDailyNote))

	// Print startup information
	log.Printf("\nServer Configuration:")
	log.Printf("====================")
	log.Printf("Storage Directory: %s", config.Storage.Directory)
	log.Printf("Allowed Extensions: %v", config.Storage.AllowedExtensions)
	log.Printf("Max File Size: %dMB", config.Storage.MaxFileSizeMB)
	log.Printf("Log Level: %s", config.Logging.Level)
	log.Printf("Log File: %s", config.Logging.File)

	// Print network information
	log.Printf("\nNetwork Information:")
	log.Printf("===================")
	interfaces, _ := net.Interfaces()
	for _, iface := range interfaces {
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ipnet.IP.To4() != nil {
					log.Printf("Interface %s: %s", iface.Name, ipnet.IP.String())
				}
			}
		}
	}

	serverAddr := config.GetServerAddress()
	log.Printf("\nServer starting on %s", serverAddr)
	log.Printf("====================")

	if err := http.ListenAndServe(serverAddr, nil); err != nil {
		log.Fatal(err)
	}
}
