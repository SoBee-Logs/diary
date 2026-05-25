package com.sobee.sobee.domain.b_log.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

// transactions 테이블 매핑 — 결제 내역 조회 전용 (읽기만 사용)
@Entity
@Table(name = "transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Transaction {

    @EmbeddedId
    private TransactionId id;

    // 지출 금액 (양수이면 지출)
    @Column(name = "payment_out")
    private Integer paymentOut;

    // 입금 금액
    @Column(name = "payment_in")
    private Integer paymentIn;

    // 결제 장소명
    @Column(name = "payment_place", length = 50)
    private String paymentPlace;

    // 결제 날짜
    @Column(name = "payment_date")
    private LocalDate paymentDate;

    // 결제 시각
    @Column(name = "payment_time")
    private LocalTime paymentTime;

    // 결제 카테고리
    @Column(name = "payment_category", length = 50)
    private String paymentCategory;

    // 결제 주소
    @Column(name = "payment_address", length = 50)
    private String paymentAddress;
}