create extension if not exists vector;

create type material_kind as enum ('paper', 'answer-key', 'handout', 'notice');
create type review_status as enum ('review', 'published', 'fixture');
create type assessment_type as enum ('Quiz', 'Test', 'Mid-semester', 'Comprehensive');

create table subjects (
  id text primary key,
  code text not null unique,
  name text not null,
  campus text not null,
  semester text not null,
  created_at timestamptz not null default now()
);

create table topics (
  id text primary key,
  subject_id text not null references subjects(id) on delete cascade,
  name text not null,
  description text not null,
  keywords text[] not null,
  review_status review_status not null,
  created_at timestamptz not null default now(),
  unique(subject_id, name)
);

create table course_materials (
  id text primary key,
  subject_id text not null references subjects(id) on delete cascade,
  campus text not null,
  title text not null,
  file_name text not null,
  source_path text not null unique,
  kind material_kind not null,
  year text not null,
  session text,
  assessment_type assessment_type,
  page_count integer not null check (page_count >= 0),
  review_status review_status not null,
  created_at timestamptz not null default now()
);

create table material_pages (
  material_id text not null references course_materials(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  extracted_text text not null,
  extraction_method text not null,
  primary key(material_id, page_number)
);

create table questions (
  id text primary key,
  material_id text not null references course_materials(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  text text not null,
  options jsonb,
  marks numeric,
  verified_answer boolean not null,
  answer text,
  review_status review_status not null,
  created_at timestamptz not null default now()
);

create table question_topics (
  question_id text not null references questions(id) on delete cascade,
  topic_id text not null references topics(id) on delete cascade,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  approved boolean not null,
  primary key(question_id, topic_id)
);

create table answer_key_links (
  question_id text primary key references questions(id) on delete cascade,
  answer_material_id text not null references course_materials(id) on delete cascade,
  answer_page_number integer not null check (answer_page_number > 0),
  answer_text text not null,
  verified boolean not null
);

create table retrieval_passages (
  id text primary key,
  subject_id text not null references subjects(id) on delete cascade,
  material_id text not null references course_materials(id) on delete cascade,
  page_number integer,
  content text not null,
  visuals jsonb not null,
  embedding vector(512) not null,
  search_document tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now()
);

create index questions_material_page_idx on questions(material_id, page_number);
create index course_materials_subject_type_idx on course_materials(subject_id, assessment_type);
create index question_topics_topic_idx on question_topics(topic_id, approved);
create index retrieval_passages_subject_idx on retrieval_passages(subject_id);
create index retrieval_passages_search_idx on retrieval_passages using gin(search_document);
create index retrieval_passages_embedding_hnsw_idx
  on retrieval_passages using hnsw (embedding vector_cosine_ops);

create or replace function match_course_passages(
  query_embedding vector(512),
  query_text text,
  match_subject_id text,
  match_count integer
)
returns table (
  passage_id text,
  material_id text,
  page_number integer,
  content text,
  visuals jsonb,
  file_name text,
  title text,
  kind material_kind,
  year text,
  campus text,
  assessment_type assessment_type,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  with vector_ranked as materialized (
    select
      passage.id,
      row_number() over (order by passage.embedding <=> query_embedding) as rank
    from retrieval_passages as passage
    where passage.subject_id = match_subject_id
      and (passage.embedding <=> query_embedding) <= 0.70
    order by passage.embedding <=> query_embedding
    limit greatest(match_count * 5, 30)
  ),
  keyword_ranked as materialized (
    select
      passage.id,
      row_number() over (
        order by ts_rank_cd(passage.search_document, websearch_to_tsquery('english', query_text)) desc
      ) as rank
    from retrieval_passages as passage
    where passage.subject_id = match_subject_id
      and passage.search_document @@ websearch_to_tsquery('english', query_text)
    order by ts_rank_cd(passage.search_document, websearch_to_tsquery('english', query_text)) desc
    limit greatest(match_count * 5, 30)
  ),
  fused as (
    select ranked.id, sum(1.0 / (60 + ranked.rank)) as score
    from (
      select id, rank from vector_ranked
      union all
      select id, rank from keyword_ranked
    ) as ranked
    group by ranked.id
  )
  select
    passage.id,
    material.id,
    passage.page_number,
    passage.content,
    passage.visuals,
    material.file_name,
    material.title,
    material.kind,
    material.year,
    material.campus,
    material.assessment_type,
    1 - (passage.embedding <=> query_embedding) as similarity
  from retrieval_passages as passage
  join fused on fused.id = passage.id
  join course_materials as material on material.id = passage.material_id
  order by fused.score desc
  limit greatest(match_count, 0);
$$;

alter table subjects enable row level security;
alter table topics enable row level security;
alter table course_materials enable row level security;
alter table material_pages enable row level security;
alter table questions enable row level security;
alter table question_topics enable row level security;
alter table answer_key_links enable row level security;
alter table retrieval_passages enable row level security;

create policy "public read subjects" on subjects for select using (true);
create policy "public read topics" on topics for select using (true);
create policy "public read materials" on course_materials for select using (true);
create policy "public read material pages" on material_pages for select using (true);
create policy "public read questions" on questions for select using (true);
create policy "public read question topics" on question_topics for select using (true);
create policy "public read answer keys" on answer_key_links for select using (true);
create policy "public read retrieval passages" on retrieval_passages for select using (true);

grant execute on function match_course_passages(vector, text, text, integer) to anon, authenticated;
