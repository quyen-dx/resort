'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/client/components/layout/navbar';
import { SearchBar } from '@/client/components/booking/search-bar';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (criteria: { checkIn: string; checkOut: string; guests: number; rooms: number }) => {
    router.push(`/rooms?checkIn=${criteria.checkIn}&checkOut=${criteria.checkOut}&guests=${criteria.guests}&rooms=${criteria.rooms}`);
  };

  return (
    <div className={styles.mainWrapper}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>
            KHÔNG GIAN NGHỈ DƯỠNG BIỂN ĐẲNG CẤP 5 SAO
          </span>

          <h1 className={styles.heroTitle}>
            Chạm Đến Đỉnh Cao Nghỉ Dưỡng Thượng Lưu
          </h1>

          <p className={styles.heroDescription}>
            Tận hưởng kỳ nghỉ biệt lập giữa vịnh biển thanh bình. Đặt phòng trực tuyến thông minh, giữ chỗ tức thì và thanh toán 100% tại quầy resort.
          </p>
        </div>
      </section>

      {/* Embedded Search Bar */}
      <div className={styles.searchBarWrapper}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Luxury Experiences */}
      <section className={styles.experienceSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>
            HỆ SINH THÁI ĐẶC QUYỀN
          </span>
          <h2 className={styles.sectionTitle}>
            Trải Nghiệm Đáng Nhớ Tại An Nam
          </h2>
        </div>

        <div className={styles.experienceGrid}>
          {/* Card 1 */}
          <div className={styles.experienceCard}>
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
              alt="Beachfront Pool Villa"
              className={styles.cardImage}
            />
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                Biệt Thự Hồ Bơi Riêng
              </h3>
              <p className={styles.cardText}>
                Biệt lập hoàn toàn với lối đi thẳng ra bờ cát trắng, bồn tắm đá lộ thiên và quản gia phục vụ 24/7.
              </p>
              <Link href="/rooms" className={styles.cardLink}>
                Khám phá biệt thự →
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className={styles.experienceCard}>
            <img
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80"
              alt="Spa & Wellness"
              className={styles.cardImage}
            />
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                An Nam Lotus Spa
              </h3>
              <p className={styles.cardText}>
                Liệu pháp cổ truyền kết hợp thảo dược bản địa giúp tái tạo năng lượng thể chất và thư thái tinh thần.
              </p>
              <span className={styles.cardLink}>
                Đặc quyền khách lưu trú →
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className={styles.experienceCard}>
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
              alt="Fine Dining"
              className={styles.cardImage}
            />
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                Ẩm Thực Biển Thượng Hạng
              </h3>
              <p className={styles.cardText}>
                Hải sản tươi sống đánh bắt trong ngày được chế biến tinh tế bởi các bếp trưởng tiêu chuẩn quốc tế.
              </p>
              <span className={styles.cardLink}>
                Bữa sáng tiêu chuẩn 5 sao →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Highlights (Chống overbooking & Thanh toán) */}
      <section className={styles.highlightsSection}>
        <div className={styles.highlightsContainer}>
          <div className={styles.highlightsGrid}>
            <div className={styles.highlightItem}>
              <div className={styles.highlightIcon}>🛡️</div>
              <h4 className={styles.highlightTitle}>
                Khóa Phòng Tức Thời
              </h4>
              <p className={styles.highlightText}>
                Hệ thống cam kết tồn kho theo từng đêm nghỉ với thuật toán giao dịch nguyên tử, loại trừ 100% rủi ro trùng phòng.
              </p>
            </div>

            <div className={styles.highlightItem}>
              <div className={styles.highlightIcon}>💳</div>
              <h4 className={styles.highlightTitle}>
                Thanh Toán Minh Bạch Tại Resort
              </h4>
              <p className={styles.highlightText}>
                Không cần thanh toán online, chỉ thanh toán khi nhận phòng tại quầy lễ tân với đầy đủ hóa đơn chứng từ.
              </p>
            </div>

            <div className={styles.highlightItem}>
              <div className={styles.highlightIcon}>🚗</div>
              <h4 className={styles.highlightTitle}>
                Đưa Đón Sân Bay Tiện Lợi
              </h4>
              <p className={styles.highlightText}>
                Tùy chọn xe đón tận cổng với bảng giá công khai mẫu 4.000 ₫/km, tài xế chuyên nghiệp đón đúng giờ hạ cánh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 An Nam Resort Management &amp; Operations. Hệ thống quản lý nghỉ dưỡng đẳng cấp quốc tế.</p>
      </footer>
    </div>
  );
}
