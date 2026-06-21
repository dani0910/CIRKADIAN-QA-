"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import styles from "../css/DashboardCharts.module.css";

interface DashboardChartsProps {
  activeTab: "PASS_FAIL" | "OS" | "ISSUE";
  setActiveTab: React.Dispatch<React.SetStateAction<"PASS_FAIL" | "OS" | "ISSUE">>;
  radius: number;
  circ: number;
  donutSegments: Array<{
    label: string;
    count: number;
    percent: number;
    color: string;
    strokeDash: number;
    offset: number;
  }>;
  donutCenterVal: number;
  donutLabel: string;
  donutData: Array<{
    label: string;
    count: number;
    percent: number;
    color: string;
  }>;
  barData: Array<{
    label: string;
    topPercent: number;
    val1: number;
    val2: number;
  }>;
  osGroups: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  issueGroups: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  issueTotalCount: number;
}

export function DashboardCharts({
  activeTab,
  setActiveTab,
  radius,
  circ,
  donutSegments,
  donutCenterVal,
  donutLabel,
  donutData,
  barData,
  osGroups,
  issueGroups,
  issueTotalCount,
}: DashboardChartsProps) {
  return (
    <Card className={styles.card}>
      {/* Chart Header & Tab Buttons */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>대시보드 요약</h2>
        </div>
        <div className={styles.tabList}>
          {[
            { id: "PASS_FAIL", label: "PASS/FAIL 현황" },
            { id: "OS", label: "OS별 결과" },
            { id: "ISSUE", label: "이슈 상태 현황" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`${styles.tabBtn} ${
                activeTab === tab.id
                  ? styles.tabBtnActive
                  : styles.tabBtnInactive
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. PASS/FAIL Tab Content */}
      {activeTab === "PASS_FAIL" && (
        <div className={styles.contentGrid}>
          {/* Donut Chart */}
          <div className={styles.donutCol}>
            <div className={styles.donutContainer}>
              <svg className={styles.donutSvg} viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#1a1c23"
                  strokeWidth="10"
                />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeDasharray={`${seg.strokeDash} ${circ}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className={styles.donutCenterLabel}>
                <div className={styles.donutCenterValue}>{donutCenterVal}</div>
                <div className={styles.donutCenterText}>{donutLabel}</div>
              </div>
            </div>
          </div>

          {/* Legend Details */}
          <div className={styles.legendCard}>
            {donutData.map((seg) => (
              <div key={seg.label} className={styles.legendItem}>
                <div className={styles.legendLeft}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: seg.color }}
                  />
                  <div>
                    <div className={styles.legendLabel}>{seg.label}</div>
                    <div className={styles.legendCount}>{seg.count}개</div>
                  </div>
                </div>
                <div className={styles.legendPercent}>{seg.percent}%</div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {/*
          <div className={styles.barChartCol}>
            <div className={styles.barHeader}>
              <span>기능별 PASS율</span>
            </div>
            <div className={styles.barGrid}>
              {barData.map((bar, idx) => (
                <div key={idx} className={styles.barItem}>
                  <span className={styles.barPercentText}>{bar.topPercent}%</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ height: `${bar.topPercent}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
          */}
        </div>
      )}

      {/* 2. OS Tab Content */}
      {activeTab === "OS" && (
        <div className={styles.contentGrid}>
          {/* Donut Chart */}
          <div className={styles.donutColCenter}>
            <div className={styles.donutContainerLarge}>
              <svg className={styles.donutSvg} viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#1a1c23"
                  strokeWidth="10"
                />
                {osGroups.map((seg, idx) => {
                  const segmentDash = Math.round(
                    (seg.count /
                      Math.max(
                        osGroups.reduce((s, item) => s + item.count, 0),
                        1,
                      )) *
                      circ,
                  );
                  const offset =
                    idx === 0
                      ? 0
                      : osGroups.slice(0, idx).reduce(
                          (sum, prev) =>
                            sum +
                            Math.round(
                              (prev.count /
                                Math.max(
                                  osGroups.reduce(
                                    (s, item) => s + item.count,
                                    0,
                                  ),
                                  1,
                                )) *
                                circ,
                            ),
                          0,
                        );
                  return (
                    <circle
                      key={seg.label}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${segmentDash} ${circ}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className={styles.donutCenterLabel}>
                <div className={styles.donutCenterValue}>
                  {osGroups.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className={styles.donutCenterText}>OS별 결과</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className={styles.detailsGrid}>
            {osGroups.map((seg) => {
              const total = osGroups.reduce((sum, item) => sum + item.count, 0);
              const percent = total ? Math.round((seg.count / total) * 100) : 0;
              return (
                <div key={seg.label} className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailLabel}>{seg.label}</span>
                    <span
                      className={styles.detailDot}
                      style={{ backgroundColor: seg.color }}
                    />
                  </div>
                  <div className={styles.detailCount}>{seg.count}</div>
                  <div className={styles.detailPercent}>{percent}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ISSUE Tab Content */}
      {activeTab === "ISSUE" && (
        <div className={styles.contentGrid}>
          {/* Donut Chart */}
          <div className={styles.donutColCenter}>
            <div className={styles.donutContainerLarge}>
              <svg className={styles.donutSvg} viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#1a1c23"
                  strokeWidth="10"
                />
                {issueGroups.map((seg, idx) => {
                  const segmentDash = Math.round(
                    (seg.count / Math.max(issueTotalCount, 1)) * circ,
                  );
                  const offset =
                    idx === 0
                      ? 0
                      : issueGroups
                          .slice(0, idx)
                          .reduce(
                            (sum, prev) =>
                              sum +
                              Math.round(
                                (prev.count / Math.max(issueTotalCount, 1)) *
                                  circ,
                              ),
                            0,
                          );
                  return (
                    <circle
                      key={seg.label}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${segmentDash} ${circ}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className={styles.donutCenterLabel}>
                <div className={styles.donutCenterValue}>{issueTotalCount}</div>
                <div className={styles.donutCenterText}>이슈 상태</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className={styles.detailsGrid}>
            {issueGroups.map((seg) => {
              const percent = issueTotalCount
                ? Math.round((seg.count / issueTotalCount) * 100)
                : 0;
              return (
                <div key={seg.label} className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailLabel}>{seg.label}</span>
                    <span
                      className={styles.detailDot}
                      style={{ backgroundColor: seg.color }}
                    />
                  </div>
                  <div className={styles.detailCount}>{seg.count}</div>
                  <div className={styles.detailPercent}>{percent}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
