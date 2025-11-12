export default function Footer() {
  return (
    <footer className="footer">
      <div className="container text-center px-3">
        <div className="footer-content">
          <p className="mb-2 fs-6 fs-md-5">
            <i className="bi bi-heart-fill text-danger me-2"></i>
            당신의 감정은 소중합니다
          </p>
          <small className="footer-note d-block">
            힘들 때는 주변 사람이나 전문가의 도움을 받으세요
          </small>
          <small className="footer-note d-none d-sm-block">
            자살예방 상담전화: 1393 | 정신건강 위기상담: 1577-0199
          </small>
          <small className="footer-note d-block d-sm-none">
            자살예방: 1393<br />정신건강: 1577-0199
          </small>
        </div>
      </div>
    </footer>
  )
}

