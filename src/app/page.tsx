'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/client/components/layout/navbar';
import { SearchBar } from '@/client/components/booking/search-bar';

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (criteria: { checkIn: string; checkOut: string; guests: number; rooms: number }) => {
    router.push(`/rooms?checkIn=${criteria.checkIn}&checkOut=${criteria.checkOut}&guests=${criteria.guests}&rooms=${criteria.rooms}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-main)' }}>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(rgba(15, 42, 36, 0.75), rgba(7, 21, 18, 0.9)), url("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85") center/cover',
          color: 'white',
          padding: '6.5rem 1.5rem 8rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(197, 168, 128, 0.2)',
              color: 'var(--color-accent)',
              padding: '0.4rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              border: '1px solid rgba(197, 168, 128, 0.35)',
            }}
          >
            KHÔNG GIAN NGHỈ DƯỠNG BIỂN ĐẲNG CẤP 5 SAO
          </span>

          <h1
            style={{
              fontSize: '3.5rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Chạm Đến Đỉnh Cao Nghỉ Dưỡng Thượng Lưu
          </h1>

          <p
            style={{
              fontSize: '1.18rem',
              color: 'rgba(255, 255, 255, 0.88)',
              maxWidth: '680px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}
          >
            Tận hưởng kỳ nghỉ biệt lập giữa vịnh biển thanh bình. Đặt phòng trực tuyến thông minh, giữ chỗ tức thì và thanh toán 100% tại quầy resort.
          </p>
        </div>
      </section>

      {/* Embedded Search Bar */}
      <div style={{ maxWidth: '1100px', margin: '-3.75rem auto 4.5rem', width: '100%', padding: '0 1.5rem', zIndex: 10 }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Luxury Experiences */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 5rem', padding: '0 1.5rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--color-accent-dark)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            HỆ SINH THÁI ĐẶC QUYỀN
          </span>
          <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', marginTop: '0.3rem' }}>
            Trải Nghiệm Đáng Nhớ Tại An Nam
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
              alt="Beachfront Pool Villa"
              style={{ width: '100%', height: '220px', objectFit: 'cover' }}
            />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                Biệt Thự Hồ Bơi Riêng
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Biệt lập hoàn toàn với lối đi thẳng ra bờ cát trắng, bồn tắm đá lộ thiên và quản gia phục vụ 24/7.
              </p>
              <Link href="/rooms" style={{ color: 'var(--color-accent-dark)', fontWeight: 700, fontSize: '0.9rem' }}>
                Khám phá biệt thự →
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80"
              alt="Spa & Wellness"
              style={{ width: '100%', height: '220px', objectFit: 'cover' }}
            />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                An Nam Lotus Spa
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Liệu pháp cổ truyền kết hợp thảo dược bản địa giúp tái tạo năng lượng thể chất và thư thái tinh thần.
              </p>
              <span style={{ color: 'var(--color-accent-dark)', fontWeight: 700, fontSize: '0.9rem' }}>
                Đặc quyền khách lưu trú →
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
              alt="Fine Dining"
              style={{ width: '100%', height: '220px', objectFit: 'cover' }}
            />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                Ẩm Thực Biển Thượng Hạng
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Hải sản tươi sống đánh bắt trong ngày được chế biến tinh tế bởi các bếp trưởng tiêu chuẩn quốc tế.
              </p>
              <span style={{ color: 'var(--color-accent-dark)', fontWeight: 700, fontSize: '0.9rem' }}>
                Bữa sáng tiêu chuẩn 5 sao →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Highlights (Chống overbooking & Thanh toán) */}
      <section style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '4.5rem 1.5rem', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Khóa Phòng Tức Thời
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Hệ thống cam kết tồn kho theo từng đêm nghỉ với thuật toán giao dịch nguyên tử, loại trừ 100% rủi ro trùng phòng.
              </p>
            </div>

            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💳</div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Thanh Toán Minh Bạch Tại Resort
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Không cần thanh toán online, chỉ thanh toán khi nhận phòng tại quầy lễ tân với đầy đủ hóa đơn chứng từ.
              </p>
            </div>

            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚗</div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Đưa Đón Sân Bay Tiện Lợi
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Tùy chọn xe đón tận cổng với bảng giá công khai mẫu 4.000 ₫/km, tài xế chuyên nghiệp đón đúng giờ hạ cánh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          padding: '2.5rem 1.5rem',
          backgroundColor: 'white',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <p>© 2026 An Nam Resort Management &amp; Operations. Hệ thống quản lý nghỉ dưỡng đẳng cấp quốc tế.</p>
      </footer>
    </div>
  );
}
