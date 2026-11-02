-- 프로젝트: 같은 owner_id 안에서 lower(name) 이 겹치는 행이 있으면, 가장 먼저 만든 것(created_at, id 순)은 그대로 두고
-- 나머지 뒤에 " 2", " 3" … 을 붙인다. 붙인 이름도 겹치지 않을 때까지 숫자를 올리고, 앱의 이름 한도(UTF-16 60자,
-- server/projects.ts NAME_MAX)를 넘으면 원래 이름 끝을 줄인다. updated_at 은 건드리지 않는다(최근 작업 순서 유지).
DO $$
DECLARE
	r record;
	base text;
	cand text;
	n int;
BEGIN
	FOR r IN
		SELECT s.id, s.owner_id, s.name
		FROM (
			SELECT t.id, t.owner_id, t.name,
				row_number() OVER (PARTITION BY t.owner_id, lower(t.name) ORDER BY t.created_at, t.id) AS rn
			FROM "projects" t
		) s
		WHERE s.rn > 1
		ORDER BY s.owner_id, lower(s.name), s.rn
	LOOP
		n := 2;
		LOOP
			base := r.name;
			cand := regexp_replace(base, '\s+$', '') || ' ' || n;
			-- UTF-16 길이 = 글자 수 + BMP 밖 글자(서로게이트 쌍) 수. JS 의 string.length 와 같다.
			WHILE length(cand) + length(regexp_replace(cand, '[^\U00010000-\U0010FFFF]', '', 'g')) > 60 LOOP
				base := left(base, -1);
				cand := regexp_replace(base, '\s+$', '') || ' ' || n;
			END LOOP;
			EXIT WHEN NOT EXISTS (
				SELECT 1 FROM "projects" o WHERE o.owner_id = r.owner_id AND lower(o.name) = lower(cand)
			);
			n := n + 1;
		END LOOP;
		UPDATE "projects" SET name = cand WHERE id = r.id;
	END LOOP;
END $$;
--> statement-breakpoint
-- 구성도: 같은 project_id 안에서 lower(name) 이 겹치는 행이 있으면, 가장 먼저 만든 것(created_at, id 순)은 그대로 두고
-- 나머지 뒤에 " 2", " 3" … 을 붙인다. 붙인 이름도 겹치지 않을 때까지 숫자를 올리고, 앱의 이름 한도(UTF-16 60자,
-- server/projects.ts NAME_MAX)를 넘으면 원래 이름 끝을 줄인다. updated_at 은 건드리지 않는다(최근 작업 순서 유지).
DO $$
DECLARE
	r record;
	base text;
	cand text;
	n int;
BEGIN
	FOR r IN
		SELECT s.id, s.project_id, s.name
		FROM (
			SELECT t.id, t.project_id, t.name,
				row_number() OVER (PARTITION BY t.project_id, lower(t.name) ORDER BY t.created_at, t.id) AS rn
			FROM "diagrams" t
		) s
		WHERE s.rn > 1
		ORDER BY s.project_id, lower(s.name), s.rn
	LOOP
		n := 2;
		LOOP
			base := r.name;
			cand := regexp_replace(base, '\s+$', '') || ' ' || n;
			-- UTF-16 길이 = 글자 수 + BMP 밖 글자(서로게이트 쌍) 수. JS 의 string.length 와 같다.
			WHILE length(cand) + length(regexp_replace(cand, '[^\U00010000-\U0010FFFF]', '', 'g')) > 60 LOOP
				base := left(base, -1);
				cand := regexp_replace(base, '\s+$', '') || ' ' || n;
			END LOOP;
			EXIT WHEN NOT EXISTS (
				SELECT 1 FROM "diagrams" o WHERE o.project_id = r.project_id AND lower(o.name) = lower(cand)
			);
			n := n + 1;
		END LOOP;
		UPDATE "diagrams" SET name = cand WHERE id = r.id;
	END LOOP;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX "diagrams_project_name_uidx" ON "diagrams" USING btree ("project_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "projects_owner_name_uidx" ON "projects" USING btree ("owner_id",lower("name"));