export const metadata = {
  title: '서비스 이용약관',
  description: 'KookDongE(국동이) 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-full px-4 pt-4 pb-12">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">서비스 이용약관</h1>
      </div>

      <article className="prose prose-zinc dark:prose-invert prose-sm max-w-none space-y-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        <p className="text-zinc-500 dark:text-zinc-400">
          <strong className="font-medium text-zinc-500 dark:text-zinc-400">
            시행일자: 2026년 3월 9일
          </strong>
        </p>
        <p>
          국민대학교 동아리 정보 플랫폼 「KookDongE」(이하 「서비스」)를 이용해 주셔서 감사합니다.
          본 약관은 서비스 이용과 관련하여 운영자와 이용자 간의 권리·의무 및 책임 사항을 정합니다.
        </p>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제1조 (목적)
          </h2>
          <p>
            본 약관은 서비스가 제공하는 동아리 정보 조회, 관심 동아리 관리, Q&A, 커뮤니티, 동아리
            생성 신청, 알림 등 모든 서비스의 이용 조건 및 절차, 운영자와 이용자의 권리·의무·책임을
            규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제2조 (정의)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>「서비스」</strong>: 운영자가 제공하는 KookDongE(국동이) 웹/앱 기반의
              국민대학교 동아리 정보·커뮤니티 플랫폼을 말합니다.
            </li>
            <li>
              <strong>「이용자」</strong>: 본 약관에 따라 서비스를 이용하는 회원 및 비회원을
              말합니다.
            </li>
            <li>
              <strong>「회원」</strong>: 서비스에 로그인(가입)하여 회원으로서 서비스를 이용하는 자를
              말합니다.
            </li>
            <li>
              <strong>「운영자」</strong>: 서비스를 기획·운영·제공하는 주체(WINK 등 국민대학교 관련
              단체)를 말합니다.
            </li>
            <li>
              <strong>「콘텐츠」</strong>: 이용자가 서비스 내에 게시한 글, 댓글, 질문, 이미지, 링크
              등 모든 정보를 말합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제3조 (약관의 효력 및 변경)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.</li>
            <li>
              이용자가 서비스에 로그인·가입하거나 서비스를 이용하는 경우, 본 약관에 동의한 것으로
              간주됩니다.
            </li>
            <li>
              운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다. 변경된
              약관은 서비스 내 공지, 웹사이트 게시 등으로 안내하며, 중요한 변경 시 시행일 전에
              공지할 수 있습니다.
            </li>
            <li>
              변경된 약관은 공지한 시행일부터 효력이 발생합니다. 변경 후에도 서비스를 계속 이용하는
              경우 변경 약관에 동의한 것으로 봅니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제4조 (서비스의 내용)
          </h2>
          <p>운영자는 다음 각 호와 같은 서비스를 제공합니다. 세부 내용은 서비스 화면에 따릅니다.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>동아리 목록 조회, 검색, 필터 및 동아리 상세 정보 제공</li>
            <li>관심 동아리 등록·해제, 좋아요, 대기 목록 관리</li>
            <li>동아리별 Q&A 질문·답변</li>
            <li>커뮤니티 게시판(자유·홍보 등) 게시글·댓글 작성·열람·수정·삭제</li>
            <li>동아리 생성·운영 신청 및 심사 관련 기능</li>
            <li>알림(푸시 알림 포함) 발송 및 알림 설정</li>
            <li>신고·버그 신고·건의 접수 및 처리</li>
            <li>기타 운영자가 정한 서비스</li>
          </ol>
          <p>
            일부 서비스는 회원 가입 후에만 이용할 수 있으며, 운영자의 정책에 따라 내용·범위가
            변경·중단될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제5조 (회원 가입 및 계정)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>회원 가입은 서비스가 정한 방식(현재 Google 로그인 등)에 따라 이루어집니다.</li>
            <li>
              이용자가 제공한 정보가 허위이거나 타인의 정보를 도용한 경우, 운영자는 가입을
              거부하거나 회원 자격을 제한·상실시킬 수 있습니다.
            </li>
            <li>
              회원은 자신의 계정과 비밀번호(또는 로그인 수단) 관리 책임이 있으며, 제3자에게 이용하게
              해서는 안 됩니다. 계정 도용 등으로 인한 손해에 대해 운영자는 책임지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제6조 (이용자의 의무 및 금지 행위)
          </h2>
          <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>타인의 개인정보·계정을 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스 운영을 방해하거나 서버·네트워크를 부정하게 이용하는 행위</li>
            <li>법령, 공서양속 또는 본 약관을 위반하는 행위</li>
            <li>타인의 명예를 훼손하거나 권리를 침해하는 행위</li>
            <li>음란·혐오·폭력·혼란을 조장하는 콘텐츠를 게시하는 행위</li>
            <li>영리 목적의 광고·스팸·허위 정보를 반복적으로 게시하는 행위</li>
            <li>
              동아리·커뮤니티·Q&A 등에서 다른 이용자에게 불쾌감을 주거나 서비스 질서를 해치는 행위
            </li>
            <li>운영자 또는 제3자의 저작권·상표권 등 지식재산권을 침해하는 행위</li>
            <li>기타 운영자가 부적절하다고 판단하는 행위</li>
          </ol>
          <p>
            위 금지 행위를 한 이용자에 대해서는 사전 통지 없이 서비스 이용 제한, 게시물 삭제, 회원
            자격 제한·상실 등 필요한 조치를 할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제7조 (콘텐츠의 책임 및 관리)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              이용자가 서비스에 게시한 콘텐츠의 저작권 및 책임은 해당 이용자에게 있습니다. 운영자는
              이용자가 게시한 콘텐츠에 대해 원칙적으로 검열·보증할 의무가 없습니다.
            </li>
            <li>
              운영자는 법령 또는 서비스 정책에 따라 부적절한 콘텐츠를 삭제·비공개·이동할 수 있으며,
              해당 이용자에게 별도 통지하지 않을 수 있습니다.
            </li>
            <li>
              이용자는 자신이 게시한 콘텐츠가 제3자의 권리를 침해하지 않도록 해야 하며, 침해로 인한
              분쟁 시 이용자가 책임을 집니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제8조 (운영자의 의무)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              운영자는 관련 법령과 본 약관에 따라 서비스를 안정적으로 제공하기 위해 노력합니다.
            </li>
            <li>
              운영자는 이용자의 개인정보를 본인의 동의 없이 제3자에게 제공하지 않으며,
              개인정보처리방침에 따라 처리합니다.
            </li>
            <li>
              운영자는 서비스 이용과 관련하여 제기된 의견·불만이 정당하다고 인정할 경우 이를 처리할
              수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제9조 (서비스의 변경·중단)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              운영자는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있습니다.
            </li>
            <li>
              서비스 중단 시 사전에 서비스 내 공지 등으로 안내할 수 있으나, 긴급한 경우 사후에
              안내할 수 있습니다.
            </li>
            <li>
              서비스 변경·중단으로 인해 이용자에게 발생한 불이익에 대해 운영자는 법령에서 정하는
              범위 내에서만 책임을 집니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제10조 (면책)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              운영자는 천재지변, 전쟁, 서비스 설비 장애, 통신 두절, 해킹 등 운영자가 통제하기 어려운
              사유로 인한 서비스 중단·장애·손해에 대해 책임을 지지 않습니다.
            </li>
            <li>
              운영자는 이용자 간 또는 이용자와 제3자 간의 분쟁에 개입할 의무가 없으며, 이로 인한
              손해에 대해 책임지지 않습니다.
            </li>
            <li>
              이용자가 게시한 콘텐츠로 인한 법적 분쟁·손해에 대해 운영자는 해당 이용자가 책임을
              지며, 운영자는 법령에 따라 필요한 경우에만 관련 자료를 제공할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제11조 (저작권 및 이용 허락)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              서비스에 포함된 텍스트, 디자인, 로고, 이미지 등 운영자가 제작한 자료에 대한 저작권 및
              기타 지식재산권은 운영자에게 귀속됩니다.
            </li>
            <li>
              이용자가 서비스 내에 게시한 콘텐츠에 대한 저작권은 해당 이용자에게 귀속됩니다. 단,
              운영자는 서비스 운영·개선·홍보 목적으로 해당 콘텐츠를 서비스 내에서
              복제·전시·편집·배포할 수 있는 비독점적 권한을 갖는 것으로 합니다(저작권은 이용자에게
              유지).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제12조 (회원 탈퇴 및 이용 제한)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              회원은 언제든지 서비스 내 설정에서 회원 탈퇴를 요청할 수 있으며, 운영자는 관련 절차에
              따라 처리합니다. 탈퇴 시 개인정보는 개인정보처리방침에 따라 파기됩니다.
            </li>
            <li>
              운영자는 이용자가 본 약관 또는 관련 정책을 위반한 경우, 사전 통지 없이 서비스 이용을
              제한하거나 회원 자격을 상실시킬 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제13조 (준거법 및 관할)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>본 약관과 서비스 이용에 관한 분쟁에는 대한민국 법률을 적용합니다.</li>
            <li>
              서비스 이용과 관련하여 운영자와 이용자 간에 분쟁이 발생한 경우, 운영자의 본점 또는 주
              사무소 소재지를 관할하는 법원을 관할 법원으로 합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mt-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            제14조 (운영자 정보 및 문의)
          </h2>
          <p>
            <strong>운영 주체</strong>: WINK (국민대학교 관련 단체) / <strong>주소</strong>:
            서울특별시 성북구 정릉로 77 (국민대학교 미래관 605-1) / <strong>웹사이트</strong>:{' '}
            <a
              href="https://wink.kookmin.ac.kr/about-us/wink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              https://wink.kookmin.ac.kr/about-us/wink
            </a>
          </p>
          <p>
            서비스 이용과 관련한 문의는 위 연락처 또는 서비스 내 문의 경로를 이용해 주시기 바랍니다.
          </p>
        </section>

        <p className="mt-8 text-zinc-500 dark:text-zinc-400">
          본 약관은 2026년 3월 9일부터 시행됩니다.
        </p>
      </article>
    </div>
  );
}
