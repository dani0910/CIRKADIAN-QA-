"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import styles from "./ProjectDeleteModal.module.css";

interface ProjectDeleteModalProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  currentProject: Project | undefined;
  isDeleting: boolean;
  deleteErrorMsg: string;
  setDeleteErrorMsg: (msg: string) => void;
  handleDeleteProject: () => void;
}

export function ProjectDeleteModal({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  currentProject,
  isDeleting,
  deleteErrorMsg,
  setDeleteErrorMsg,
  handleDeleteProject,
}: ProjectDeleteModalProps) {
  if (!isDeleteModalOpen || !currentProject) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <svg
            className="w-6 h-6 shrink-0"
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
          <h3 className={styles.title}>프로젝트 삭제</h3>
        </div>

        <p className={styles.message}>
          정말{" "}
          <span className="font-bold text-white">
            "{currentProject.name}"
          </span>{" "}
          프로젝트를 삭제하시겠습니까?
        </p>

        <div className={styles.warningBox}>
          <p className={styles.warningTitle}>⚠️ 주의사항:</p>
          <p>
            이 프로젝트를 삭제하면 관련 기능 분류(Category), 테스트케이스,
            그리고 상세 테스트 결과와 모든 히스토리 코멘트가 영구적으로
            삭제되며 복구할 수 없습니다.
          </p>
        </div>

        {deleteErrorMsg && (
          <div className={styles.errorAlert}>{deleteErrorMsg}</div>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteErrorMsg("");
            }}
            disabled={isDeleting}
            className="font-bold"
          >
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDeleteProject}
            disabled={isDeleting}
            className={`font-bold ${styles.deleteBtn}`}
          >
            {isDeleting ? "삭제 중..." : "프로젝트 삭제"}
          </Button>
        </div>
      </div>
    </div>
  );
}
