"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import styles from "../css/ProjectEditModal.module.css";

interface ProjectEditModalProps {
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  editQA: string;
  setEditQA: (val: string) => void;
  editDeveloper: string;
  setEditDeveloper: (val: string) => void;
  editDesigner: string;
  setEditDesigner: (val: string) => void;
  editPeriod: string;
  setEditPeriod: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  isSavingMeta: boolean;
  saveMetaError: string;
  handleSaveMetadata: (e: React.FormEvent) => void;
}

export function ProjectEditModal({
  isEditModalOpen,
  setIsEditModalOpen,
  editQA,
  setEditQA,
  editDeveloper,
  setEditDeveloper,
  editDesigner,
  setEditDesigner,
  editPeriod,
  setEditPeriod,
  editStatus,
  setEditStatus,
  editDescription,
  setEditDescription,
  isSavingMeta,
  saveMetaError,
  handleSaveMetadata,
}: ProjectEditModalProps) {
  if (!isEditModalOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h3 className={styles.title}>프로젝트 정보 수정</h3>
        <p className={styles.subtitle}>
          프로젝트 담당자 및 기간 등의 정보를 수정합니다.
        </p>

        {saveMetaError && (
          <div className={styles.errorAlert}>{saveMetaError}</div>
        )}

        <form onSubmit={handleSaveMetadata} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>담당 QA</label>
            <input
              type="text"
              placeholder="예: 이다은"
              value={editQA}
              onChange={(e) => setEditQA(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>담당 개발자</label>
            <input
              type="text"
              placeholder="예: 김철수"
              value={editDeveloper}
              onChange={(e) => setEditDeveloper(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>담당 디자인</label>
            <input
              type="text"
              placeholder="예: 박민준"
              value={editDesigner}
              onChange={(e) => setEditDesigner(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>프로젝트 기간</label>
            <input
              type="text"
              placeholder="예: 2026.05.01 ~ 진행 중"
              value={editPeriod}
              onChange={(e) => setEditPeriod(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>프로젝트 상태</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className={styles.select}
            >
              <option value="시작 전">시작 전</option>
              <option value="진행 중">진행 중</option>
              <option value="완료">완료</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>프로젝트 설명</label>
            <textarea
              rows={2}
              placeholder="설명 입력"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingMeta}
              className="font-bold"
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingMeta}
              className={`font-bold ${styles.saveBtn}`}
            >
              {isSavingMeta ? "저장 중..." : "정보 저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
