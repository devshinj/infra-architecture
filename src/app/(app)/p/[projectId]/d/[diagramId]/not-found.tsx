import { NotFoundScreen } from "@/ui/StatusScreen";

// 지운 구성도, 다른 계정의 구성도, 프로젝트가 맞지 않는 주소. 셸(사이드바) 안에 그린다.
export default function DiagramNotFound() {
  return (
    <NotFoundScreen title="없거나 볼 수 없는 구성도예요">
      <p>지워졌거나 다른 계정의 구성도예요. 구성도는 만든 계정만 열 수 있어요.</p>
      <p>받은 주소라면 보낸 사람에게 어느 계정의 구성도인지 확인해 주세요.</p>
    </NotFoundScreen>
  );
}
