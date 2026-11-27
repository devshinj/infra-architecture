import { NotFoundScreen } from "@/ui/StatusScreen";

// 없는 주소. 로그인하지 않았으면 미들웨어가 먼저 /login 으로 보낸다.
export default function NotFound() {
  return (
    <NotFoundScreen title="찾는 화면이 없어요" page>
      <p>주소가 바뀌었거나 없어진 화면이에요.</p>
    </NotFoundScreen>
  );
}
