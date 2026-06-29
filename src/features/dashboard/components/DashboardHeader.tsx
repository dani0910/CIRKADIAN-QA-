"use client";

import React, { useState } from "react";
import styles from "../css/DashboardHeader.module.css";

interface DashboardHeaderProps {
  projects: Project[];
  selectedProjectId: string;
  isProjectOpen: boolean;
  setIsProjectOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleProjectSelect: (id: string | null) => void;
  meta: any;
  periodText: string;
  qaName: string;
  devName: string;
  designerName: string;
  handleOpenEditModal: () => void;
  isVersionOpen: boolean;
  setIsVersionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddingVersion: boolean;
  setIsAddingVersion: (adding: boolean) => void;
  selectedVersion: string;
  setSelectedVersion: React.Dispatch<React.SetStateAction<string>>;
  versionOptions: string[];
  testCases: TestCase[];
  categoryGroups: CategoryGroup[];
  tcDetails: TCDetail[];
  newVersionValue: string;
  setNewVersionValue: (val: string) => void;
  handleAddVersion: () => void;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripAuthorPrefix = (value: string | null | undefined) =>
  (value || "").replace(/^\[[^\]]+\]\s*/, "");

const downloadHtmlFile = (html: string, fileName: string, mimeType: string) => {
  const blob = new Blob(["\ufeff", html], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export function DashboardHeader({
  projects,
  selectedProjectId,
  isProjectOpen,
  setIsProjectOpen,
  handleProjectSelect,
  meta,
  periodText,
  qaName,
  devName,
  designerName,
  handleOpenEditModal,
  isVersionOpen,
  setIsVersionOpen,
  isAddingVersion,
  setIsAddingVersion,
  selectedVersion,
  setSelectedVersion,
  versionOptions,
  testCases,
  categoryGroups,
  tcDetails,
  newVersionValue,
  setNewVersionValue,
  handleAddVersion,
}: DashboardHeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Determine project status color class
  const getStatusClass = (status?: string) => {
    if (status === "완료") return styles.statusComplete;
    if (status === "시작 전") return styles.statusNotStarted;
    return styles.statusOngoing;
  };

  const projectName =
    projects.find((p) => p.id === selectedProjectId)?.name || "Mellight App";

  const getGroupName = (groupId?: string) => {
    const group = categoryGroups.find((item) => item.id === groupId);
    return group?.title?.split("|||")[0] || "";
  };

  const getRows = () =>
    testCases.map((tc) => {
      const detail = tcDetails.find((item) => item.id === tc.id);
      return {
        category: getGroupName(tc.group_id),
        code: tc.tc_code || "",
        title: tc.title,
        status: tc.status,
        os: tc.os || "",
        tester: tc.tester || detail?.testers || "",
        executionDate: tc.execution_date || detail?.execution_date || "",
        tags: (tc.tags || []).join(", "),
        prerequisites: (detail?.prerequisites || []).join("\n"),
        steps: (detail?.steps || []).join("\n"),
        expected: detail?.expected_result || "",
        actual: stripAuthorPrefix(detail?.actual_result),
        evidenceCount: detail?.evidence_urls?.length || 0,
      };
    });

  const getSafeFileName = (extension: string) => {
    const safeName = projectName.replace(/[\\/:*?"<>|]/g, "_");
    return `${safeName}_QA_${new Date().toISOString().slice(0, 10)}.${extension}`;
  };

  const buildExportTable = () => {
    const headers = [
      "기능 분류",
      "TC 코드",
      "테스트 항목명",
      "상태",
      "OS",
      "테스터",
      "실행일",
      "태그",
      "사전 조건",
      "테스트 절차",
      "예상 결과",
      "실제 결과",
      "증적 수",
    ];
    const rows = getRows();
    return `
      <table border="1" cellspacing="0" cellpadding="6">
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.category)}</td>
                  <td>${escapeHtml(row.code)}</td>
                  <td>${escapeHtml(row.title)}</td>
                  <td>${escapeHtml(row.status)}</td>
                  <td>${escapeHtml(row.os)}</td>
                  <td>${escapeHtml(row.tester)}</td>
                  <td>${escapeHtml(row.executionDate)}</td>
                  <td>${escapeHtml(row.tags)}</td>
                  <td>${escapeHtml(row.prerequisites).replace(/\n/g, "<br />")}</td>
                  <td>${escapeHtml(row.steps).replace(/\n/g, "<br />")}</td>
                  <td>${escapeHtml(row.expected)}</td>
                  <td>${escapeHtml(row.actual)}</td>
                  <td>${escapeHtml(row.evidenceCount)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  };

  const handleExportExcel = () => {
    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>${escapeHtml(projectName)} QA 내보내기</h1>
          <p>버전: ${escapeHtml(selectedVersion || "-")}</p>
          ${buildExportTable()}
        </body>
      </html>
    `;
    downloadHtmlFile(html, getSafeFileName("xls"), "application/vnd.ms-excel");
    setIsExportOpen(false);
  };

  const handleExportWord = () => {
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th { background: #eeeeee; }
            th, td { border: 1px solid #999999; padding: 6px; vertical-align: top; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(projectName)} QA 리포트</h1>
          <p><strong>상태:</strong> ${escapeHtml(meta.status || "진행 중")}</p>
          <p><strong>프로젝트 기간:</strong> ${escapeHtml(periodText)}</p>
          <p><strong>담당 QA:</strong> ${escapeHtml(qaName)}</p>
          <p><strong>담당 개발자:</strong> ${escapeHtml(devName)}</p>
          <p><strong>담당 디자인:</strong> ${escapeHtml(designerName)}</p>
          <p><strong>버전:</strong> ${escapeHtml(selectedVersion || "-")}</p>
          ${buildExportTable()}
        </body>
      </html>
    `;
    downloadHtmlFile(html, getSafeFileName("doc"), "application/msword");
    setIsExportOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Left side: Project title, status, meta info */}
      <div className={styles.leftArea}>
        <div className={styles.titleWrapper}>
          <div className={styles.projectDropdownContainer}>
            <button
              type="button"
              onClick={() => setIsProjectOpen(!isProjectOpen)}
              className={styles.projectDropdownBtn}
            >
              <span>
                {projectName}
              </span>
              <span className="text-zinc-400 text-xs">▼</span>
            </button>

            {isProjectOpen && (
              <>
                <div
                  className={styles.backdrop}
                  onClick={() => setIsProjectOpen(false)}
                />
                <div className={styles.projectDropdownMenu}>
                  <div className={styles.dropdownTitle}>프로젝트 전환</div>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleProjectSelect(proj.id)}
                      className={`${styles.dropdownItem} ${
                        selectedProjectId === proj.id
                          ? styles.dropdownItemActive
                          : styles.dropdownItemInactive
                      }`}
                    >
                      <span>{proj.name}</span>
                      {selectedProjectId === proj.id && (
                        <span className={styles.activeDot}>●</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span
            className={`${styles.statusBadge} ${getStatusClass(meta.status)}`}
          >
            {meta.status || "진행 중"}
          </span>
        </div>

        <div className={styles.metaInfoList}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>프로젝트 기간:</span>
            <span className={styles.metaValue}>{periodText}</span>
          </div>
          <div className={styles.verticalDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>담당 QA:</span>
            <span className={styles.metaValue}>{qaName}</span>
          </div>
          <div className={styles.verticalDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>담당 개발자:</span>
            <span className={styles.metaValue}>{devName}</span>
          </div>
          <div className={styles.verticalDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>담당 디자인:</span>
            <span className={styles.metaValue}>{designerName}</span>
          </div>
          <div className={styles.verticalDivider} />
          <button
            type="button"
            onClick={handleOpenEditModal}
            className={styles.editBtn}
            title="정보 수정"
            aria-label="정보 수정"
          >
            <svg
              className={styles.editIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <div className={styles.exportDropdownContainer}>
            <button
              type="button"
              onClick={() => setIsExportOpen((prev) => !prev)}
              className={styles.exportBtn}
            >
              내보내기
              <span className={styles.exportArrow}>▼</span>
            </button>
            {isExportOpen && (
              <>
                <div
                  className={styles.backdrop}
                  onClick={() => setIsExportOpen(false)}
                />
                <div className={styles.exportDropdownMenu}>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className={styles.exportItem}
                  >
                    Excel로 내보내기
                  </button>
                  <button
                    type="button"
                    onClick={handleExportWord}
                    className={styles.exportItem}
                  >
                    Word로 내보내기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Version dropdown selection */}
      <div className={styles.rightArea}>
        <div className={styles.versionDropdownContainer}>
          <button
            type="button"
            onClick={() => {
              setIsVersionOpen((prev) => !prev);
              setIsAddingVersion(false);
            }}
            className={styles.versionDropdownBtn}
          >
            <span>{selectedVersion || "+ 버전 입력"}</span>
            <span className="text-[#62ABAB] text-[10px]">▼</span>
          </button>
          {isVersionOpen && (
            <>
              <div
                className={styles.backdrop}
                onClick={() => setIsVersionOpen(false)}
              />
              <div className={styles.versionDropdownMenu}>
                {versionOptions.map((version) => (
                  <button
                    key={version}
                    type="button"
                    onClick={() => {
                      setSelectedVersion(version);
                      setIsVersionOpen(false);
                    }}
                    className={`${styles.versionItem} ${
                      selectedVersion === version
                        ? styles.versionItemActive
                        : styles.versionItemInactive
                    }`}
                  >
                    <span>{version}</span>
                    {selectedVersion === version && (
                      <span className={styles.activeVersionDot}>●</span>
                    )}
                  </button>
                ))}

                {isAddingVersion ? (
                  <div className={styles.addVersionWrapper}>
                    <input
                      value={newVersionValue}
                      onChange={(e) => setNewVersionValue(e.target.value)}
                      className={styles.addVersionInput}
                      placeholder="버전 입력 (예: v1.2.5)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddVersion();
                      }}
                    />
                    <div className={styles.addVersionActions}>
                      <button
                        type="button"
                        onClick={handleAddVersion}
                        className={styles.addBtn}
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingVersion(false)}
                        className={styles.cancelBtn}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      onClick={() => setIsAddingVersion(true)}
                      className={styles.addVersionTrigger}
                    >
                      + 버전 추가
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
