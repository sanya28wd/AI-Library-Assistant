create extension if not exists vector;

create type material_kind as enum ('paper', 'answer-key', 'handout', 'notice');
create type review_status as enum ('review', 'published', 'fixture');
create type assessment_type as enum ('Quiz', 'Mid-semester', 'Comprehensive');

create table subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  semester text not null,
  created_at timestamptz not null default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  description text not null,
  keywords text[] not null default '{}',
  review_status review_status not null default 'review',
  created_at timestamptz not null default now(),
  unique(subject_id, name)
);

create table course_materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  title text not null,
  file_name text not null,
  storage_path text not null unique,
  kind material_kind not null,
  year text,
  assessment_type assessment_type,
  page_count integer,
  file_hash text not null unique,
  review_status review_status not null default 'review',
  processing_error text,
  created_at timestamptz not null default now()
);

create table material_pages (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references course_materials(id) on delete cascade,
  page_number integer not null,
  extracted_text text not null default '',
  extraction_method text not null,
  embedding vector(1536),
  unique(material_id, page_number)
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references course_materials(id) on delete cascade,
  page_number integer not null,
  question_number text,
  text text not null,
  options jsonb,
  marks numeric,
  review_status review_status not null default 'review',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table question_topics (
  question_id uuid not null references questions(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  approved boolean not null default false,
  primary key(question_id, topic_id)
);

create table answer_key_links (
  question_id uuid primary key references questions(id) on delete cascade,
  answer_material_id uuid not null references course_materials(id) on delete cascade,
  answer_page_number integer not null,
  answer_text text not null,
  verified boolean not null default false
);

create index questions_review_status_idx on questions(review_status);
create index course_materials_subject_type_idx on course_materials(subject_id, assessment_type);
create index question_topics_topic_idx on question_topics(topic_id, approved);

alter table subjects enable row level security;
alter table topics enable row level security;
alter table course_materials enable row level security;
alter table material_pages enable row level security;
alter table questions enable row level security;
alter table question_topics enable row level security;
alter table answer_key_links enable row level security;

create policy "local read published subjects" on subjects for select using (true);
create policy "local read published topics" on topics for select using (review_status = 'published');
create policy "local read published materials" on course_materials for select using (review_status = 'published');
create policy "local read published questions" on questions for select using (review_status = 'published');
create policy "local read approved question topics" on question_topics for select using (approved);
