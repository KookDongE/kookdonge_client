export const metadata = {
  title: '개인정보처리방침',
  description: 'KookDongE(국동이) 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="policy-page-force-light min-h-full px-4 pt-4 pb-12">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          개인정보처리방침
        </h1>
      </div>

      <article className="prose prose-zinc [@media(prefers-color-scheme:dark)]:prose-invert prose-sm max-w-none space-y-6 text-xs leading-relaxed text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
        <p className="text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          <strong className="font-medium text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            시행일자: 2026년 3월 9일
          </strong>
        </p>
        <p>
          국민대학교 동아리 정보 플랫폼 「KookDongE」(이하 「서비스」)는 이용자의 개인정보를 소중히
          하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 개인정보처리방침은 서비스에서
          수집·이용·보관·파기하는 개인정보에 관한 사항을 안내합니다.
        </p>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제1조 (개인정보의 수집·이용 목적 및 항목)
          </h2>
          <p>서비스는 다음의 목적으로 필요한 범위에서 최소한의 개인정보를 수집·이용합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-200 text-left text-xs dark:border-zinc-600 [&_td]:border-zinc-200 [&_td]:dark:border-zinc-600 [&_th]:border-zinc-200 [&_th]:dark:border-zinc-600">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800">
                  <th className="border border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-600 dark:text-zinc-200">
                    수집·이용 목적
                  </th>
                  <th className="border border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-600 dark:text-zinc-200">
                    수집 항목
                  </th>
                  <th className="border border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-600 dark:text-zinc-200">
                    수집 시점
                  </th>
                  <th className="border border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-600 dark:text-zinc-200">
                    보유·이용 기간
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 [&_td]:dark:border-zinc-600 [&_td]:dark:bg-zinc-900/50 [&_td]:dark:text-zinc-300">
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">회원 가입·로그인·본인 확인</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    이메일 주소, 이름, (Google 프로필 정보)
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">Google 로그인 시</td>
                  <td className="border border-zinc-200 px-3 py-2">회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">회원 프로필 관리</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    이름, 이메일, 학번, 연락처, 소속(학과/단과대)
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">회원가입·프로필 조회·수정 시</td>
                  <td className="border border-zinc-200 px-3 py-2">회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">동아리 생성·운영 신청 심사</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    동아리명, 동아리 유형·분류, 신청 사유, 소속 단과대(선택)
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">동아리 생성 신청 시</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    심사 완료 및 법령에 따른 보존 기간
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">Q&A·커뮤니티 서비스</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    게시글·댓글·질문 내용, 작성자 식별 정보
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">글·댓글·질문 작성 시</td>
                  <td className="border border-zinc-200 px-3 py-2">서비스 제공 기간</td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">신고·버그 신고·건의 처리</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    신고 유형, 대상 정보, 사유 및 상세 내용
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">신고·건의 제출 시</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    처리 완료 후 법령·내부 규정에 따른 기간
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">푸시 알림 발송</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    디바이스 식별자, FCM 토큰, 플랫폼(웹/Android/iOS)
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">
                    로그인 후 알림·디바이스 등록 시
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">
                    회원 탈퇴·디바이스 삭제 시까지
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-200 px-3 py-2">관리자 권한 부여·관리</td>
                  <td className="border border-zinc-200 px-3 py-2">이메일 주소</td>
                  <td className="border border-zinc-200 px-3 py-2">
                    시스템 관리자에 의한 권한 부여 시
                  </td>
                  <td className="border border-zinc-200 px-3 py-2">관리 목적 달성 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            서비스는 Google OAuth 2.0을 통해 로그인하며, Google로부터 이메일 등 프로필 정보를
            제공받을 수 있습니다. Google의 개인정보 처리에 대해서는 Google 개인정보처리방침을
            참고하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제2조 (개인정보의 자동 수집 항목·쿠키 등)
          </h2>
          <p>
            접속 로그·기술 정보(IP 주소, 브라우저 종류, OS, 접속 일시 등)가 서버에 자동 기록될 수
            있으며, 서비스 안정화·부정 이용 방지·통계 목적으로 이용됩니다.
          </p>
          <p>
            이용 편의와 로그인 유지를 위해 로그인 토큰(accessToken, refreshToken), 디바이스 식별자,
            테마 설정·웰컴 화면 노출 여부 등이 이용자 기기에 저장됩니다. 쿠키·로컬 저장을
            비활성화하면 로그인 유지 등 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제3조 (개인정보의 제3자 제공)
          </h2>
          <p>
            서비스는 원칙적으로 이용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 이용자
            동의나 법령에 따른 경우 등 필요한 범위에서만 제공할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제4조 (개인정보 처리 위탁)
          </h2>
          <p>서비스는 아래와 같이 개인정보 처리 업무를 위탁할 수 있습니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Google</strong>: 로그인·본인 확인(OAuth) — 이메일, 프로필 정보
            </li>
            <li>
              <strong>Firebase (Google)</strong>: 푸시 알림 발송(FCM) — 디바이스 식별자, FCM 토큰 등
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제5조 (개인정보의 보유·이용 기간 및 파기)
          </h2>
          <p>
            이용자의 개인정보는 수집·이용 목적이 달성된 후 별도 보존 사유가 없는 한 지체 없이
            파기합니다. 회원 탈퇴 시 회원 정보 및 디바이스·알림 정보 등은 삭제 대상에 포함됩니다.
            법령에 보존 기간이 정해진 경우 해당 기간 동안 보관하며, 전자적 파일은 복구 불가한
            방법으로 삭제합니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제6조 (이용자 및 법정대리인의 권리)
          </h2>
          <p>
            이용자(만 14세 미만인 경우 법정대리인)는 개인정보에 대한 열람, 정정·삭제, 처리 정지 요구
            권리를 행사할 수 있습니다. 서비스 내 「설정」에서 회원 탈퇴를 요청할 수 있으며, 권리
            행사는 서비스 내 설정·고객센터 또는 운영자에게 문의하시면 신원 확인 후 법령에 따라
            처리합니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제7조 (개인정보의 안전성 확보)
          </h2>
          <p>
            서비스는 개인정보 접근 권한 최소화, 비밀번호·토큰 등 암호화, 접근·관리·보안 점검, 유출
            사고 대응 절차 마련 등 안전한 처리를 위한 조치를 취하고 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제8조 (개인정보 보호책임자 및 문의)
          </h2>
          <p>
            운영 주체: WINK (국민대학교 관련 단체) / 주소: 서울특별시 성북구 정릉로 77 (국민대학교
            미래관 605-1) / 웹사이트:{' '}
            <a
              href="https://wink.kookmin.ac.kr/about-us/wink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline [@media(prefers-color-scheme:dark)]:text-blue-400"
            >
              https://wink.kookmin.ac.kr/about-us/wink
            </a>
            . 개인정보 침해 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr),
            개인정보분쟁조정위원회(www.kopico.go.kr)에 문의하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제9조 (개인정보처리방침의 변경)
          </h2>
          <p>
            본 방침은 법령·정책 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지
            또는 웹사이트 등을 통해 안내합니다. 변경된 방침은 공지한 시행일부터 적용됩니다.
          </p>
        </section>

        <p className="mt-8 text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          본 개인정보처리방침은 2026년 3월 9일부터 적용됩니다.
        </p>
      </article>
    </div>
  );
}
