import { assume, edge, flow, group, managed, node, type Sample } from "./dsl";

const FN = { runtime: "Node.js 20", service: "AWS Lambda" };
const STORE = { ...managed(), sw: "Amazon S3", replication: "리전 안 여러 AZ 자동 저장", version: null };

/** 서버리스 이미지 처리. 업로드는 바로 답하고, 썸네일은 SQS 로 미뤄 만든다. */
export const SERVERLESS: Sample = {
  id: "serverless",
  title: "서버리스 이미지 처리",
  commands: [
    assume("environment", "클라우드(AWS)"),
    assume("deploy", "서버리스(Lambda)"),

    group("region", "cloud_region", "AWS 서울 리전"),

    node("user", "client_web", "사용자", null),
    node("cdn", "cdn", "CloudFront", null, "CDN", managed()),
    node("s3-web", "object_storage", "S3 정적 웹", "region", "화면 파일", STORE),
    node("apigw", "api_gateway", "API Gateway", "region", "HTTP API", managed()),
    node("fn-upload", "function", "업로드 함수", "region", "Lambda", FN),
    node("s3-raw", "object_storage", "S3 원본", "region", "원본 이미지", STORE),
    node("sqs", "queue", "SQS", "region", "변환 작업 큐", { ...managed(), brokers: null, version: null }),
    node("fn-resize", "function", "변환 함수", "region", "Lambda", FN),
    node("s3-thumb", "object_storage", "S3 썸네일", "region", "썸네일 이미지", STORE),
    node("ddb", "db_nosql", "DynamoDB", "region", "이미지 정보", { ...managed("yes"), sw: "Amazon DynamoDB", version: null, replication: "리전 안 3개 AZ 자동 복제", cpu: null, ram: null, ip: null }),

    edge("user", "cdn", "request", "HTTPS 443"),
    edge("cdn", "s3-web", "request", "정적 파일"),
    edge("cdn", "s3-thumb", "request", "썸네일"),
    edge("user", "apigw", "request", "HTTPS 443 업로드 API"),
    edge("apigw", "fn-upload", "request", "Lambda 호출"),
    edge("fn-upload", "s3-raw", "request", "원본 저장"),
    edge("fn-upload", "ddb", "request", "접수 기록"),
    edge("fn-upload", "sqs", "async", "변환 요청"),
    edge("sqs", "fn-resize", "async", "이벤트 소스 매핑"),
    edge("fn-resize", "s3-raw", "request", "원본 읽기"),
    edge("fn-resize", "s3-thumb", "request", "썸네일 저장"),
    edge("fn-resize", "ddb", "request", "완료 기록"),

    flow("upload", "이미지 올리기", "user", "사용자가 이미지를 올린다.", "접수됐다는 답을 바로 돌려주고, 썸네일은 뒤에서 만든다.", [
      ["user", "apigw", "업로드", "사용자가 API Gateway 로 이미지를 보낸다."],
      ["apigw", "fn-upload", "함수 호출", "API Gateway 가 업로드 함수를 부른다."],
      ["fn-upload", "s3-raw", "원본 저장", "업로드 함수가 원본을 S3 에 저장한다."],
      ["fn-upload", "ddb", "접수 기록", "이미지 정보를 DynamoDB 에 남긴다."],
      ["fn-upload", "sqs", "변환 요청", "썸네일 변환 작업을 SQS 에 넣는다."],
    ]),
    flow("resize", "썸네일 만들기", "system", "큐에 쌓인 변환 작업을 함수가 꺼내 처리한다.", "썸네일을 저장하고 이미지 정보를 완료로 바꾼다.", [
      ["sqs", "fn-resize", "작업 꺼냄", "SQS 가 변환 함수에 작업을 넘긴다."],
      ["fn-resize", "s3-raw", "원본 읽기", "변환 함수가 원본 이미지를 읽는다."],
      ["fn-resize", "s3-thumb", "썸네일 저장", "작게 줄인 이미지를 S3 에 저장한다."],
      ["fn-resize", "ddb", "완료 기록", "DynamoDB 의 이미지 정보를 완료로 바꾼다."],
    ]),
  ],
};
