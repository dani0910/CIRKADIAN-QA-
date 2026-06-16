"use client";

import React from "react";
import styles from "../css/DashboardHeader.module.css";

interface DashboardHeaderProps {
  projects: Project[];
  selectedProjectId: string;
  isProjectOpen: boolean;
  setIsProjectOpen: (open: boolean) => void;
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
  newVersionValue: string;
  setNewVersionValue: (val: string) => void;
  handleAddVersion: () => void;
}

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
  newVersionValue,
  setNewVersionValue,
  handleAddVersion,
}: DashboardHeaderProps) {
  // Determine project status color class
  const getStatusClass = (status?: string) => {
    if (status === "완료") return styles.statusComplete;
    if (status === "시작 전") return styles.statusNotStarted;
    return styles.statusOngoing;
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
                {projects.find((p) => p.id === selectedProjectId)?.name ||
                  "Mellight App"}
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
            정보 수정
          </button>
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
