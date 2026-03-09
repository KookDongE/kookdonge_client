export const metadata = {
  title: '커뮤니티 이용규칙',
  description: 'KookDongE(국동이) 커뮤니티 이용규칙',
};

export default function CommunityRulesPage() {
  return (
    <div className="min-h-full px-4 pt-4 pb-12">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">
          커뮤니티 이용규칙
        </h1>
      </div>

      <article className="prose prose-zinc dark:prose-invert prose-sm max-w-none space-y-6 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        <p className="text-zinc-600 dark:text-zinc-400">
          <strong className="font-medium text-zinc-600 dark:text-zinc-400">
            시행일자: 2026년 3월 9일
          </strong>
        </p>
        <p>
          국민대학교 동아리 정보 플랫폼 「KookDongE」(이하 「서비스」)의 커뮤니티는 국민대 구성원이
          자유롭고 건전하게 소통할 수 있는 공간입니다. 본 이용규칙은 커뮤니티(게시판·글·댓글) 이용
          시 모든 이용자가 지켜야 할 사항을 정하며, 서비스 이용약관과 청소년보호정책에 부합합니다.
        </p>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제1조 (목적 및 적용)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              본 규칙은 서비스 내 「커뮤니티」 게시판(자유·홍보 등)에서의 게시글·댓글 작성, 열람,
              수정, 삭제 및 기타 이용 행위에 적용됩니다.
            </li>
            <li>
              커뮤니티 이용 시 본 규칙과 서비스 이용약관, 개인정보처리방침, 청소년보호정책을 함께
              준수해야 합니다. 본 규칙에서 정하지 않은 사항은 서비스 이용약관 등에 따릅니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제2조 (커뮤니티 구성)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>게시판 구분</strong>: 커뮤니티는 운영자가 정한 게시판(예: 자유, 홍보 등)으로
              구성될 수 있으며, 각 게시판의 목적에 맞게 이용해야 합니다.
            </li>
            <li>
              <strong>글쓰기 권한</strong>: 회원은 서비스가 허용하는 범위에서 본인 또는 관리하는
              동아리 명의로 게시글을 작성할 수 있습니다.
            </li>
            <li>
              <strong>댓글</strong>: 게시글에 대한 댓글·대댓글은 서비스가 제공하는 기능 범위 내에서
              작성할 수 있으며, 게시글과 동일한 기준으로 관리됩니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제3조 (허용되는 이용)
          </h2>
          <p>다음과 같은 이용은 원칙적으로 허용됩니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>국민대학교·동아리·학교 생활과 관련한 자유로운 의견·정보·경험 공유</li>
            <li>동아리·소모임·행사 홍보(홍보 게시판이 있는 경우 해당 게시판 활용)</li>
            <li>서로 존중하는 범위 내에서의 토론·질문·답변</li>
            <li>저작권 등 법령을 준수하는 콘텐츠의 게시</li>
          </ul>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제4조 (금지되는 행위 및 콘텐츠)
          </h2>
          <p>
            다음 각 호의 행위 또는 콘텐츠는 금지됩니다. 위반 시 삭제·경고·이용 제한 등 조치될 수
            있습니다.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>법령 위반</strong>: 법령에 위배되거나 범죄·불법 행위를 조장·교사·방조하는 내용
            </li>
            <li>
              <strong>음란·폭력·혐오</strong>: 음란물, 과도한 폭력·혐오·차별을 조장하는 내용
            </li>
            <li>
              <strong>청소년 유해</strong>: 청소년보호정책 및 관련 법령에서 정한 유해정보에 해당하는
              내용
            </li>
            <li>
              <strong>명예훼손·비방</strong>: 특정인을 비방·모욕·허위사실 유포하여 명예를 훼손하는
              내용
            </li>
            <li>
              <strong>개인정보 침해</strong>: 타인의 개인정보(실명, 연락처, 주소, 사진 등)를 동의
              없이 게시하는 행위
            </li>
            <li>
              <strong>스팸·광고 남용</strong>: 영리 목적의 반복적 광고, 동일·유사 내용의 도배, 허위
              정보 유포
            </li>
            <li>
              <strong>저작권 침해</strong>: 타인의 저작물·상표 등을 허락 없이 게시하는 행위
            </li>
            <li>
              <strong>서비스 방해</strong>: 시스템·다른 이용자 이용을 방해하거나 서비스 운영을
              훼손하는 행위
            </li>
            <li>
              <strong>계정 도용·허위</strong>: 타인으로 가장하거나 허위 정보를 유포하는 행위
            </li>
            <li>
              <strong>기타</strong>: 운영자가 커뮤니티 질서 또는 서비스 정책에 어긋난다고 판단하는
              행위
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제5조 (글·댓글 작성 시 유의사항)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>제목과 본문</strong>: 제목은 내용을 드러내는 범위에서 작성하고, 본문은 다른
              이용자가 불쾌감을 주지 않도록 표현에 유의합니다.
            </li>
            <li>
              <strong>게시판 목적</strong>: 각 게시판(자유·홍보 등)의 성격에 맞는 주제와 톤으로
              작성합니다.
            </li>
            <li>
              <strong>동아리 명의</strong>: 동아리 계정으로 작성하는 경우, 해당 동아리의 공식 입장에
              맞게 작성할 책임이 있습니다.
            </li>
            <li>
              <strong>댓글</strong>: 게시글 작성자와 다른 이용자를 존중하며, 비방·욕설·도배는
              금지됩니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제6조 (신고 및 운영 조치)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>신고</strong>: 이용자는 규칙 위반 글이나 댓글이 발견된 경우 서비스 내 「신고」
              기능을 통해 신고할 수 있습니다. 신고 시 신고 사유 등을 선택·입력할 수 있습니다.
            </li>
            <li>
              <strong>검토 및 조치</strong>: 운영자는 신고 및 모니터링을 통해 위반 여부를 검토하고,
              위반 시 해당 콘텐츠의 삭제·비공개 처리, 해당 이용자에 대한 경고·일시적 이용 제한·영구
              제한 등 필요한 조치를 취할 수 있습니다.
            </li>
            <li>
              <strong>사전 통지</strong>: 운영 정책상 필요한 경우를 제외하고, 삭제·제한 등 조치 전에
              통지할 수 있으나, 긴급·반복 위반 등으로 사전 통지 없이 조치할 수 있습니다.
            </li>
            <li>
              <strong>이의 제기</strong>: 조치에 이의가 있는 이용자는 운영자에게 문의할 수 있으며,
              운영자는 내부 절차에 따라 검토·회신할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제7조 (콘텐츠에 대한 책임)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>게시글·댓글의 저작권 및 법적 책임은 작성한 이용자에게 있습니다.</li>
            <li>
              운영자는 이용자가 게시한 콘텐츠에 대해 사전 검열·내용 보증을 하지 않으며, 제4조 등에
              따른 관리·삭제 권한을 가집니다.
            </li>
            <li>
              타인의 권리를 침해하는 콘텐츠를 게시하여 분쟁이 발생한 경우, 해당 이용자가 책임을
              집니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제8조 (규칙의 변경)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>운영자는 커뮤니티 환경·정책·법령에 따라 본 규칙을 변경할 수 있습니다.</li>
            <li>
              변경 시 서비스 내 공지, 커뮤니티 또는 설정 화면 등을 통해 안내하며, 변경된 규칙은
              공지한 시행일부터 적용됩니다.
            </li>
            <li>변경 후에도 커뮤니티를 계속 이용하는 경우 변경 규칙에 동의한 것으로 봅니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
            제9조 (문의)
          </h2>
          <p>
            커뮤니티 이용규칙 및 이용 제한 등에 대한 문의는 서비스 이용약관 제14조에 따른 운영자
            연락처(설정 화면 내 개인정보처리방침·서비스 이용약관 참고) 또는 서비스 내 「버그 신고 및
            건의사항」 등을 통해 할 수 있습니다.
          </p>
        </section>

        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          본 커뮤니티 이용규칙은 2026년 3월 9일부터 시행됩니다.
        </p>
      </article>
    </div>
  );
}
