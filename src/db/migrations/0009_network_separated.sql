ALTER TABLE "network_types" ADD COLUMN "separated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- 이전에는 내부 등급 망이 모두 외부와 "망연계"였다. 이미 있는 내부 망은 그 동작을 지키도록 망분리 대상으로 둔다.
-- 고치지 않은 기본 제공 종류는 앱이 다음에 읽을 때 새 기본값(network-seed)으로 맞춘다.
UPDATE "network_types" SET "separated" = true WHERE "grade" = 'internal';
