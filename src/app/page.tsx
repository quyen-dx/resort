import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              A
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-primary)' }}>
                AN NAM RESORT
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
                HOSPITALITY & OPERATIONS
              </p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <Link href="/rooms" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
              Khám Phá Phòng
            </Link>
            <Link href="/transport" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
              Đưa Đón Sân Bay
            </Link>
            <Link
              href="/portal/login"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                transition: 'background var(--transition-fast)',
              }}
            >
              Cổng Nhân Viên
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          background: 'radial-gradient(ellipse at top, #1a4239 0%, #0d211c 100%)',
          color: 'white',
          padding: '6rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(197, 168, 128, 0.2)',
              color: 'var(--color-accent)',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
              border: '1px solid rgba(197, 168, 128, 0.3)',
            }}
          >
            RESORT MANAGEMENT &amp; OPERATIONS PLATFORM
          </span>

          <h2
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Nghỉ Dưỡng Thượng Lưu Ven Biển
          </h2>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '650px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}
          >
            Trải nghiệm dịch vụ lưu trú 5 sao với hệ sinh thái vận hành thông minh: kiểm soát tồn kho tức thời, thanh toán an toàn tại quầy và xe đưa đón chuẩn mực.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              href="/rooms"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-primary-dark)',
                padding: '0.85rem 2rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 20px var(--color-accent-glow)',
              }}
            >
              Đặt Phòng Ngay
            </Link>
            <Link
              href="/reception"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.85rem 1.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Khu Vực Lễ Tân
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ maxWidth: '1280px', margin: '-3rem auto 4rem', padding: '0 1.5rem', zIndex: 10 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              🏨 Chống Overbooking Tuyệt Đối
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              Kiểm tra tồn kho theo từng đêm lưu trú với cơ chế Atomic Transaction tại tầng cơ sở dữ liệu. Cam kết bảo đảm phòng theo quy tắc &quot;First commit wins&quot;.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              💵 Thanh Toán An Toàn Tại Quầy
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              Quản lý chi tiết công nợ (phải trả, đã trả, còn lại) và kiểm toán đầy đủ mọi giao dịch tại quầy lễ tân resort, không lưu vết thanh toán ảo.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              🚗 Xe Đưa Đón Sân Bay Sandbox
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              Tích hợp Adapter với hệ thống giả lập đưa đón mẫu, hỗ trợ tài xế và điều phối viên vận hành trơn tru trước khi kích hoạt API đối tác.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          backgroundColor: 'white',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <p>© 2026 An Nam Resort Management Ecosystem. Architecture built with Next.js &amp; Clean Architecture.</p>
      </footer>
    </div>
  );
}
