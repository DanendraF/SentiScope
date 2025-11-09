# Database Schema Documentation

Dokumentasi lengkap untuk schema database SentiScope.

## Tabel yang Tersedia

### Core Tables (Utama)
1. **users** - Data pengguna platform
2. **projects** - Workspace/analisis yang pernah dibuat user
3. **data_sources** - Menyimpan info input (text, csv, gambar, keyword)
4. **raw_texts** - Isi teks mentah per baris komentar/kalimat
5. **sentiment_results** - Hasil labeling sentimen dari model HF
6. **insight_summaries** - Hasil insight & summary dari GPT/Gemini
7. **reports** - History file PDF hasil export
8. **keywords** *(opsional)* - Kata penting yang sering muncul

### Additional Tables (Tambahan)
9. **analysis_sessions** - Tracking setiap sesi analisis/project
10. **file_uploads** - Metadata file yang diupload (CSV, images)
11. **likert_results** - Hasil emotional sentiment dengan skala Likert 1-5
12. **sentiment_statistics** - Statistik agregat per project

## Migration Files (Urutan Eksekusi)

### 000_create_users.sql
Membuat tabel untuk data pengguna platform.

**Dependencies:** Tidak ada (tabel pertama)

**Fields:**
- `id` - UUID primary key
- `email` - Email user (unique)
- `name` - Nama user
- `password_hash` - Hashed password
- `email_verified` - Status verifikasi email
- `role` - Role user (user/admin/moderator)
- `is_active` - Status aktif
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### 001_create_projects.sql
Membuat tabel untuk workspace/analisis yang pernah dibuat user.

**Dependencies:** `users`

**Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key ke users
- `name` - Nama project
- `description` - Deskripsi project
- `status` - Status (active/archived/deleted)
- `is_public` - Apakah project publik
- `settings` - JSON untuk settings project
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### 002_create_analysis_sessions.sql
Membuat tabel untuk tracking setiap sesi analisis/project.

**Dependencies:** `users`, `projects`

**Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key ke users
- `project_id` - Foreign key ke projects
- `session_name` - Nama sesi
- `input_type` - Jenis input (text/csv/image/keyword/mixed)
- `status` - Status sesi (pending/processing/completed/failed/cancelled)
- `total_texts_analyzed` - Total teks yang dianalisis
- `total_texts_processed` - Total teks yang diproses
- `error_message` - Pesan error
- `metadata` - JSON untuk info tambahan
- `started_at`, `completed_at` - Timestamps

### 003_create_data_sources.sql
Membuat tabel untuk menyimpan info input (text, csv, gambar, keyword).

**Dependencies:** `projects`, `users`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `user_id` - Foreign key ke users
- `source_type` - Jenis source (text/csv/image/keyword/api/url)
- `source_name` - Nama source
- `source_url` - URL jika dari web/API
- `file_upload_id` - Foreign key ke file_uploads
- `metadata` - JSON untuk info tambahan
- `total_items` - Total items yang diharapkan
- `processed_items` - Total items yang sudah diproses
- `status` - Status processing

### 004_create_file_uploads.sql
Membuat tabel untuk metadata file yang diupload.

**Dependencies:** `users`, `projects`, `analysis_sessions`

**Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key ke users
- `project_id` - Foreign key ke projects (opsional)
- `analysis_session_id` - Foreign key ke analysis_sessions (opsional)
- `file_name` - Nama file setelah upload
- `original_file_name` - Nama file asli
- `file_type` - Jenis file (csv/image/text/other)
- `file_size` - Ukuran file dalam bytes
- `file_path` - Path/URL file di storage
- `upload_status` - Status upload
- `metadata` - JSON untuk info tambahan
- `uploaded_at`, `processed_at`, `deleted_at` - Timestamps

### 005_create_raw_texts.sql
Membuat tabel untuk isi teks mentah per baris komentar/kalimat.

**Dependencies:** `projects`, `data_sources`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `data_source_id` - Foreign key ke data_sources
- `text_content` - Isi teks
- `text_order` - Urutan teks dalam source
- `source_metadata` - JSON untuk info tambahan
- `language` - ISO 639-1 language code
- `is_processed` - Flag apakah sudah diproses
- `created_at`, `updated_at` - Timestamps

### 006_create_sentiment_results.sql
Membuat tabel untuk hasil labeling sentimen dari model HF.

**Dependencies:** `raw_texts`, `projects`

**Fields:**
- `id` - UUID primary key
- `raw_text_id` - Foreign key ke raw_texts (unique)
- `project_id` - Foreign key ke projects
- `sentiment_label` - Label sentimen (positive/negative/neutral/mixed)
- `confidence_score` - Confidence score (0.0 - 1.0)
- `model_name` - Nama model yang digunakan
- `model_version` - Version model
- `processing_time_ms` - Waktu processing
- `raw_model_output` - Output mentah dari model
- `created_at`, `updated_at` - Timestamps

### 007_create_likert_results.sql
Membuat tabel untuk menyimpan hasil emotional sentiment dengan skala Likert 1-5.

**Dependencies:** `projects`, `raw_texts`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `raw_text_id` - Foreign key ke raw_texts (opsional)
- `scale_value` - Nilai skala 1-5
- `count` - Jumlah response
- `percentage` - Persentase dari total
- `created_at`, `updated_at` - Timestamps

### 008_create_insight_summaries.sql
Membuat tabel untuk hasil insight & summary dari GPT/Gemini.

**Dependencies:** `projects`, `analysis_sessions`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `analysis_session_id` - Foreign key ke analysis_sessions (opsional)
- `provider` - AI provider (openai/gemini/anthropic/custom)
- `model_name` - Nama model
- `summary_text` - Text summary
- `key_insights` - Array of insights (JSON)
- `recommendations` - Array of recommendations (JSON)
- `sentiment_summary` - Summary statistik sentimen (JSON)
- `topics_extracted` - Topics yang diekstrak (JSON)
- `prompt_used` - Prompt yang digunakan
- `tokens_used` - Total tokens
- `cost_estimate` - Estimasi cost dalam USD
- `raw_response` - Raw response dari AI provider
- `created_at`, `updated_at` - Timestamps

### 009_create_reports.sql
Membuat tabel untuk history file PDF hasil export.

**Dependencies:** `projects`, `users`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `user_id` - Foreign key ke users
- `report_name` - Nama report
- `report_type` - Jenis report (full/summary/custom)
- `file_path` - Path/URL file PDF
- `file_size` - Ukuran file dalam bytes
- `status` - Status (pending/generating/completed/failed)
- `generation_settings` - Settings untuk generate report (JSON)
- `pages_count` - Jumlah halaman PDF
- `generated_at`, `created_at`, `updated_at`, `deleted_at` - Timestamps

### 010_create_keywords.sql
Membuat tabel untuk kata penting yang sering muncul (opsional).

**Dependencies:** `projects`, `raw_texts`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects
- `raw_text_id` - Foreign key ke raw_texts (opsional)
- `keyword` - Kata kunci
- `keyword_normalized` - Normalized version
- `frequency` - Frekuensi kemunculan
- `sentiment_distribution` - Distribusi sentimen (JSON)
- `importance_score` - Score importance (TF-IDF)
- `category` - Kategori keyword
- `created_at`, `updated_at` - Timestamps

### 011_create_sentiment_statistics.sql
Membuat tabel untuk statistik agregat per project.

**Dependencies:** `projects`, `analysis_sessions`

**Fields:**
- `id` - UUID primary key
- `project_id` - Foreign key ke projects (unique)
- `analysis_session_id` - Foreign key ke analysis_sessions (opsional)
- `total_texts` - Total teks
- `positive_count`, `negative_count`, `neutral_count` - Count per sentiment
- `average_score`, `min_score`, `max_score` - Score statistics
- `likert_total_responses` - Total Likert responses
- `likert_scale_1_count` sampai `likert_scale_5_count` - Count per skala
- `likert_average` - Rata-rata skala Likert
- `satisfaction_rate` - Persentase satisfaction (skala 4-5)
- `positive_percentage`, `negative_percentage`, `neutral_percentage` - Persentase
- `total_keywords`, `unique_keywords` - Keyword statistics
- `calculated_at` - Timestamp kapan dihitung

## Cara Menggunakan

### PostgreSQL

1. Buat database:
```sql
CREATE DATABASE sentiscope;
```

2. Jalankan migration files secara berurutan:
```bash
psql -U your_user -d sentiscope -f 000_create_users.sql
psql -U your_user -d sentiscope -f 001_create_projects.sql
psql -U your_user -d sentiscope -f 002_create_analysis_sessions.sql
psql -U your_user -d sentiscope -f 003_create_data_sources.sql
psql -U your_user -d sentiscope -f 004_create_file_uploads.sql
psql -U your_user -d sentiscope -f 005_create_raw_texts.sql
psql -U your_user -d sentiscope -f 006_create_sentiment_results.sql
psql -U your_user -d sentiscope -f 007_create_likert_results.sql
psql -U your_user -d sentiscope -f 008_create_insight_summaries.sql
psql -U your_user -d sentiscope -f 009_create_reports.sql
psql -U your_user -d sentiscope -f 010_create_keywords.sql
psql -U your_user -d sentiscope -f 011_create_sentiment_statistics.sql
```

### Atau menggunakan psql langsung:

```sql
\i 000_create_users.sql
\i 001_create_projects.sql
\i 002_create_analysis_sessions.sql
\i 003_create_data_sources.sql
\i 004_create_file_uploads.sql
\i 005_create_raw_texts.sql
\i 006_create_sentiment_results.sql
\i 007_create_likert_results.sql
\i 008_create_insight_summaries.sql
\i 009_create_reports.sql
\i 010_create_keywords.sql
\i 011_create_sentiment_statistics.sql
```

## Relasi Tabel

```
users
  ├── projects
  │     ├── analysis_sessions
  │     ├── data_sources
  │     │     └── raw_texts
  │     │           ├── sentiment_results
  │     │           ├── likert_results
  │     │           └── keywords
  │     ├── sentiment_statistics
  │     ├── insight_summaries
  │     └── reports
  └── file_uploads
```

## Indexes

Semua tabel sudah memiliki indexes yang dioptimalkan untuk:
- Foreign key lookups
- Status filtering
- Date range queries
- Soft delete queries
- Full text search (untuk raw_texts, insight_summaries, keywords)

## Constraints

- Check constraints untuk validasi data
- Foreign key constraints dengan ON DELETE CASCADE/SET NULL
- Unique constraints untuk data integrity
- Enum types untuk status dan tipe data

## Notes

- Semua tabel menggunakan UUID sebagai primary key
- Menggunakan TIMESTAMP WITH TIME ZONE untuk timezone awareness
- Soft delete menggunakan `deleted_at` untuk users, projects, file_uploads, reports
- JSONB untuk metadata yang fleksibel
- Triggers untuk auto-update `updated_at`
- Full text search menggunakan GIN indexes untuk PostgreSQL
