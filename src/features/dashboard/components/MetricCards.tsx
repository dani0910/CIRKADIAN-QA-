"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import styles from "../css/MetricCards.module.css";

interface MetricCardsProps {
  total: number;
  executed: number;
  executedPercent: number;
  untested: number;
  untestedPercent: number;
  openIssues: number;
}

export function MetricCards({
  total,
  executed,
  executedPercent,
  untested,
  untestedPercent,
  openIssues,
}: MetricCardsProps) {
  return (
    <div className={styles.container}>
      {/* 1. 전체 TC */}
      <Card className={`${styles.cardInner} p-2 ${styles.cardHoverZinc}`}>
        <div className={styles.cardContent}>
          <span className={styles.label}>전체 TC</span>
          <div className={styles.value}>{total}</div>
        </div>
        <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </Card>

      {/* 2. 실행 완료 */}
      <Card className={`${styles.cardInner} p-2 ${styles.cardHoverGreen}`}>
        <div className={styles.cardContent}>
          <span className={styles.label}>실행 완료</span>
          <div className={styles.valueSub}>
            <span className={styles.value}>{executed}</span>
            <span className={styles.percent}>{executedPercent}%</span>
          </div>
        </div>
        <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </Card>

      {/* 3. 미실시 */}
      <Card className={`${styles.cardInner} p-2 ${styles.cardHoverZinc}`}>
        <div className={styles.cardContent}>
          <span className={styles.label}>미실시</span>
          <div className={styles.valueSub}>
            <span className={styles.value}>{untested}</span>
            <span className={styles.percent}>{untestedPercent}%</span>
          </div>
        </div>
        <div className={`${styles.iconWrapper} ${styles.zincIcon}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
      </Card>

      {/* 4. Open 이슈 */}
      <Card className={`${styles.cardInner} p-2 ${styles.cardHoverRed}`}>
        <div className={styles.cardContent}>
          <span className={styles.label}>Open 이슈</span>
          <div className={`${styles.value} ${styles.redValue}`}>{openIssues}</div>
        </div>
        <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </Card>
    </div>
  );
}
