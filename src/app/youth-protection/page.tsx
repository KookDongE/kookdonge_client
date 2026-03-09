export const metadata = {
  title: '청소년보호정책',
  description: 'KookDongE(국동이) 청소년보호정책',
};

export default function YouthProtectionPage() {
  return (
    <div className="min-h-full px-4 pt-4 pb-12">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          청소년보호정책
        </h1>
      </div>

      <article className="prose prose-zinc [@media(prefers-color-scheme:dark)]:prose-invert prose-sm max-w-none space-y-6 text-xs leading-relaxed text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
        <p className="text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          <strong className="font-medium text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            시행일자: 2026년 3월 9일
          </strong>
        </p>
        <p>
          국민대학교 동아리 정보 플랫폼 「KookDongE」(이하 「서비스」)는 청소년이 안전하고 건전한
          환경에서 서비스를 이용할 수 있도록 「청소년 보호법」, 「정보통신망 이용촉진 및 정보보호
          등에 관한 법률」 등 관련 법령을 준수하며, 청소년을 유해정보로부터 보호하기 위한 정책을
          수립·시행합니다.
        </p>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제1조 (목적)
          </h2>
          <p>
            본 청소년보호정책은 서비스가 청소년에게 유해한 정보와 환경을 차단하고, 청소년의 안전한
            이용을 도모하며, 청소년 보호와 관련한 서비스의 의무 및 조치 사항을 명확히 함을 목적으로
            합니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제2조 (청소년의 정의)
          </h2>
          <p>
            본 정책에서 「청소년」이란 <strong>만 19세 미만</strong>의 자를 말합니다. 단, 만 19세에
            도달하는 해의 1월 1일을 맞이한 자는 청소년으로 보지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제3조 (유해정보의 차단)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              서비스는 청소년에게 유해할 수 있는 다음 각 호의 정보가 게시·유포되지 않도록
              관리합니다.
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>음란·폭력·혐오·자해·약물 등 청소년에게 유해한 내용</li>
                <li>청소년을 대상으로 한 범죄·사기·유인에 해당할 수 있는 정보</li>
                <li>청소년의 정신적·신체적 건강을 해칠 수 있는 정보</li>
                <li>
                  기타 「청소년 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등에서
                  정한 유해정보
                </li>
              </ul>
            </li>
            <li>
              서비스는 이용자가 게시한 콘텐츠(글, 댓글, 질문, 이미지 등)에 대해 신고 접수·검토
              절차를 운영하며, 유해정보로 확인되는 경우 삭제·비공개·경고 등 필요한 조치를 취합니다.
            </li>
            <li>
              서비스는 기술적·관리적 조치를 통해 유해정보가 노출·유포되는 것을 최소화하기 위해
              노력합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제4조 (신고 및 처리)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              이용자 또는 청소년(및 법정대리인)은 서비스 내에 유해정보가 게시되었거나 청소년 보호에
              위배되는 이용이 이루어지고 있다고 인정할 경우, 서비스 내 「신고」 기능 또는 운영자에게
              신고할 수 있습니다.
            </li>
            <li>
              운영자는 신고를 접수한 후 신속히 검토하고, 유해정보에 해당하는 경우 해당 콘텐츠의
              삭제·비공개 처리 및 반복 위반 이용자에 대한 이용 제한 등 필요한 조치를 취합니다.
            </li>
            <li>
              청소년 보호와 관련한 긴급 신고나 법정대리인의 요청이 있는 경우, 운영자는 이를
              우선적으로 처리할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제5조 (법정대리인의 권리)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              만 14세 미만 아동이 서비스를 이용하는 경우, 법정대리인은 해당 아동의 개인정보에 대한
              열람·정정·삭제·처리 정지를 요청할 수 있으며, 이는 개인정보처리방침에 따라 처리됩니다.
            </li>
            <li>
              법정대리인은 자녀가 서비스 이용 과정에서 유해정보에 노출되었거나 피해를 입었다고
              판단되는 경우, 운영자에게 삭제·차단 요청 및 관련 자료 제공을 요청할 수 있습니다.
              운영자는 신원 확인 후 법령과 내부 규정에 따라 처리합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제6조 (청소년보호책임자)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              서비스는 청소년 보호 업무를 담당하는 청소년보호책임자를 두어 유해정보 모니터링, 신고
              처리, 정책 개선 등을 수행합니다.
            </li>
            <li>청소년 보호와 관련한 문의·신고·건의는 아래 연락처로 하실 수 있습니다.</li>
          </ol>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-200 text-left text-xs [&_td]:border-zinc-200 [&_th]:border-zinc-200 [@media(prefers-color-scheme:dark)]:border-zinc-700 [&_td]:[@media(prefers-color-scheme:dark)]:border-zinc-700 [&_th]:[@media(prefers-color-scheme:dark)]:border-zinc-700">
              <tbody className="text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
                <tr>
                  <th className="w-28 border border-zinc-200 bg-zinc-50 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700 [@media(prefers-color-scheme:dark)]:bg-zinc-800">
                    운영 주체
                  </th>
                  <td className="border border-zinc-200 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700">
                    WINK (국민대학교 관련 단체)
                  </td>
                </tr>
                <tr>
                  <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700 [@media(prefers-color-scheme:dark)]:bg-zinc-800">
                    주소
                  </th>
                  <td className="border border-zinc-200 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700">
                    서울특별시 성북구 정릉로 77 (국민대학교 미래관 605-1)
                  </td>
                </tr>
                <tr>
                  <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700 [@media(prefers-color-scheme:dark)]:bg-zinc-800">
                    웹사이트
                  </th>
                  <td className="border border-zinc-200 px-3 py-2 [@media(prefers-color-scheme:dark)]:border-zinc-700">
                    <a
                      href="https://wink.kookmin.ac.kr/about-us/wink"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline [@media(prefers-color-scheme:dark)]:text-blue-400"
                    >
                      https://wink.kookmin.ac.kr/about-us/wink
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            청소년 유해매체물·정보에 대한 신고는{' '}
            <a
              href="https://www.youth.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline [@media(prefers-color-scheme:dark)]:text-blue-400"
            >
              청소년보호위원회(www.youth.go.kr)
            </a>{' '}
            등 관련 기관을 통해서도 가능합니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제7조 (교육 및 자율규제)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              운영자는 청소년 보호와 관련한 법령·정책을 준수하고, 서비스 내 유해정보 예방 및 대응을
              위해 정기적인 점검과 내부 교육을 실시할 수 있습니다.
            </li>
            <li>
              서비스 이용약관 및 커뮤니티 이용 규칙 등을 통해 이용자에게 청소년 보호에 협조할 것을
              안내하며, 위반 시 서비스 이용 제한 등 조치를 취할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-700 [@media(prefers-color-scheme:dark)]:text-zinc-400">
            제8조 (정책의 변경)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>본 청소년보호정책은 관련 법령 및 서비스 정책 변경에 따라 수정될 수 있습니다.</li>
            <li>
              변경 시 서비스 내 공지 또는 웹사이트 등을 통해 안내하며, 중요한 변경이 있는 경우
              시행일 전에 공지할 수 있습니다.
            </li>
            <li>변경된 정책은 공지한 시행일부터 적용됩니다.</li>
          </ol>
        </section>

        <p className="mt-8 text-zinc-600 [@media(prefers-color-scheme:dark)]:text-zinc-400">
          본 청소년보호정책은 2026년 3월 9일부터 시행됩니다.
        </p>
      </article>
    </div>
  );
}
