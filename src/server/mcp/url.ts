import { env } from "@/env";

/** 브라우저에서 이 구성도를 여는 주소. */
export const diagramUrl = (projectId: string, diagramId: string) => `${env.APP_URL}/p/${projectId}/d/${diagramId}`;
