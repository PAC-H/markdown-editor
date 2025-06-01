package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

type DailyEntry struct {
	Time    string `json:"time"`
	Content string `json:"content"`
}

type DailyNote struct {
	Date     string       `json:"date"`
	Filename string       `json:"filename"`
	Entries  []DailyEntry `json:"entries"`
	UID      string       `json:"uid"`
}

type DailyNoteRequest struct {
	Content string `json:"content"`
	Date    string `json:"date,omitempty"` // Optional, defaults to today
}

type DailyNoteListResponse struct {
	Notes []DailyNote `json:"notes"`
}

// Generate UID based on current timestamp
func generateUID() string {
	now := time.Now()
	return now.Format("200601021504")
}

// Get current date in YYYY-MM-DD format
func getCurrentDate() string {
	return time.Now().Format("2006-01-02")
}

// Get current time in HH:mm format
func getCurrentTime() string {
	return time.Now().Format("15:04")
}

// Generate frontmatter template for new daily note
func generateFrontmatter(uid string) string {
	return fmt.Sprintf(`---
UID: %s
alias:
banner: "Attachments/banner/banner1.jpg"
Banner style: Solid
banner_icon: 😊
cssclass: mynote,noyaml
tags: diary, daily
---

> [!blank] 
> [timeline::timeline]

`+"```ad-flex"+`
> [!infobox|noicon]- 🔖 当天创建的文件
> `+"```dataviewjs"+` 
const filename=dv.current().file.name;
dv.list(dv.pages().where(p => p.file.cday.toISODate() === filename).sort(p => p.file.ctime, 'desc').file.link) 
>`+"```"+`
`+"```"+`
## ✏Random
`, uid)
}

// Parse existing daily note file
func ParseDailyNote(filename string) (*DailyNote, error) {
	filepath := filepath.Join(config.Storage.Directory, filename)
	content, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	contentStr := string(content)

	// Extract date from filename
	date := strings.TrimSuffix(filename, ".md")

	// Extract UID from frontmatter
	uidRegex := regexp.MustCompile(`UID:\s*(\d+)`)
	uidMatch := uidRegex.FindStringSubmatch(contentStr)
	uid := ""
	if len(uidMatch) > 1 {
		uid = uidMatch[1]
	}

	// Find the Random section
	randomIndex := strings.Index(contentStr, "## ✏Random")
	if randomIndex == -1 {
		return &DailyNote{
			Date:     date,
			Filename: filename,
			Entries:  []DailyEntry{},
			UID:      uid,
		}, nil
	}

	// Extract entries from Random section
	randomSection := contentStr[randomIndex:]
	lines := strings.Split(randomSection, "\n")

	var entries []DailyEntry
	entryRegex := regexp.MustCompile(`^- (\d{2}:\d{2})\s+(.+)`)

	for _, line := range lines {
		if match := entryRegex.FindStringSubmatch(strings.TrimSpace(line)); len(match) == 3 {
			entries = append(entries, DailyEntry{
				Time:    match[1],
				Content: match[2],
			})
		}
	}

	return &DailyNote{
		Date:     date,
		Filename: filename,
		Entries:  entries,
		UID:      uid,
	}, nil
}

// Create new daily note file
func CreateDailyNote(date string) error {
	filename := date + ".md"
	filepath := filepath.Join(config.Storage.Directory, filename)

	// Check if file already exists
	if _, err := os.Stat(filepath); err == nil {
		return nil // File already exists, no need to create
	}

	uid := generateUID()
	content := generateFrontmatter(uid)

	return ioutil.WriteFile(filepath, []byte(content), 0644)
}

// Append entry to daily note
func AppendToDailyNote(date, content string) error {
	filename := date + ".md"
	filepath := filepath.Join(config.Storage.Directory, filename)

	// Create file if it doesn't exist
	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		if err := CreateDailyNote(date); err != nil {
			return err
		}
	}

	// Read existing content
	existingContent, err := ioutil.ReadFile(filepath)
	if err != nil {
		return err
	}

	contentStr := string(existingContent)
	currentTime := getCurrentTime()
	newEntry := fmt.Sprintf("- %s %s", currentTime, content)

	// Find the Random section
	randomIndex := strings.Index(contentStr, "## ✏Random")
	if randomIndex == -1 {
		// Add Random section if it doesn't exist
		contentStr += "\n## ✏Random\n" + newEntry + "\n"
	} else {
		// Find the end of the Random section content
		randomSection := contentStr[randomIndex:]
		lines := strings.Split(randomSection, "\n")

		// Find insertion point (after Random header)
		insertIndex := randomIndex + len("## ✏Random\n")

		// Check if there are existing entries
		hasEntries := false
		for _, line := range lines[1:] {
			if strings.TrimSpace(line) != "" && strings.HasPrefix(strings.TrimSpace(line), "- ") {
				hasEntries = true
				break
			}
		}

		if hasEntries {
			// Append to existing entries
			contentStr = contentStr[:len(contentStr)] + newEntry + "\n"
		} else {
			// First entry, add after Random header
			before := contentStr[:insertIndex]
			after := contentStr[insertIndex:]
			contentStr = before + newEntry + "\n" + after
		}
	}

	return ioutil.WriteFile(filepath, []byte(contentStr), 0644)
}

// List all daily notes sorted by date (newest first)
func ListDailyNotes() (*DailyNoteListResponse, error) {
	files, err := ioutil.ReadDir(config.Storage.Directory)
	if err != nil {
		return nil, err
	}

	var dailyNotes []DailyNote
	dateRegex := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}\.md$`)

	for _, file := range files {
		if file.IsDir() || !dateRegex.MatchString(file.Name()) {
			continue
		}

		dailyNote, err := ParseDailyNote(file.Name())
		if err != nil {
			continue // Skip files that can't be parsed
		}

		dailyNotes = append(dailyNotes, *dailyNote)
	}

	// Sort by date (newest first)
	sort.Slice(dailyNotes, func(i, j int) bool {
		return dailyNotes[i].Date > dailyNotes[j].Date
	})

	return &DailyNoteListResponse{Notes: dailyNotes}, nil
}

// Get specific daily note
func GetDailyNote(date string) (*DailyNote, error) {
	filename := date + ".md"
	return ParseDailyNote(filename)
}
