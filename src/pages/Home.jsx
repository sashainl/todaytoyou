import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section id="home" className="hero-section">
      <div className="container">
        <div className="row align-items-center py-5">
          <div className="col-12 col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
            <h1 className="display-4 fw-bold mb-3 mb-md-4">
              당신의 감정을<br className="d-none d-sm-block" />
              <span className="text-gradient">소중하게 여깁니다</span>
            </h1>
            <p className="lead text-muted mb-3 mb-md-4 px-3 px-sm-0">
              힘든 하루를 보내셨나요? 혼자 감정을 감당하기 어려우신가요?<br className="d-none d-md-block" />
              이곳에서 마음을 편히 내려놓으세요. 당신은 혼자가 아닙니다.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 justify-content-center justify-content-lg-start px-3 px-sm-0">
              <Link to="/chat" className="btn btn-primary btn-lg px-4">
                <i className="bi bi-chat-heart me-2"></i>대화하기
              </Link>
              <Link to="/diary" className="btn btn-outline-primary btn-lg px-4">
                <i className="bi bi-journal-text me-2"></i>일기 쓰기
              </Link>
            </div>
          </div>
          <div className="col-12 col-lg-6 text-center mt-4 mt-md-5 mt-lg-0">
            <div className="hero-illustration">
              <i className="bi bi-emoji-smile hero-icon"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

