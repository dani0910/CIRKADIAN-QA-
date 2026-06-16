"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject, updateProjectMetadata } from "@/app/actions";
import { parseProjectDescription } from "@/utils/project";

const versionsByProject: Record<string, string[]> = {
  "proj-1": ["v1.2.4 (412)", "v1.2.3 (411)", "v1.2.2 (410)", "v1.2.1 (409)"],
  "proj-2": ["v2.1.0 (501)", "v2.0.9 (500)", "v2.0.8 (499)"],
  "proj-3": ["v1.0.5 (302)", "v1.0.4 (301)", "v1.0.3 (300)"],
};

export interface UseDashboardStatsProps {
  projects: Project[];
  testCases: TestCase[];
  selectedProjectId: string;
  categoryGroups: CategoryGroup[];
}

export function useDashboardStats({
  projects,
  testCases,
  selectedProjectId,
  categoryGroups,
}: UseDashboardStatsProps) {
  const router = useRouter();
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [versionOptions, setVersionOptions] = useState<string[]>([]);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [newVersionValue, setNewVersionValue] = useState("");
  const [activeTab, setActiveTab] = useState<"PASS_FAIL" | "OS" | "ISSUE">(
    "PASS_FAIL",
  );

  // Delete project modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState("");

  // Edit project info states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQA, setEditQA] = useState("");
  const [editDeveloper, setEditDeveloper] = useState("");
  const [editDesigner, setEditDesigner] = useState("");
  const [editPeriod, setEditPeriod] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("진행 중");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [saveMetaError, setSaveMetaError] = useState("");

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    setIsDeleting(true);
    setDeleteErrorMsg("");
    try {
      await deleteProject(selectedProjectId);
      setIsDeleteModalOpen(false);
      router.push("/");
    } catch (err: any) {
      setDeleteErrorMsg(err.message || "프로젝트 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditModal = () => {
    const projectMeta = parseProjectDescription(
      currentProject?.description || null,
    );
    const formattedDate = currentProject?.created_at
      ? new Date(currentProject.created_at).toLocaleDateString("ko-KR")
      : new Date().toLocaleDateString("ko-KR");
    const fallbackPeriod =
      selectedProjectId === "proj-1"
        ? "2026.05.01 ~ 진행 중"
        : selectedProjectId === "proj-2"
          ? "2026.04.15 ~ 진행 중"
          : selectedProjectId === "proj-3"
            ? "2026.03.10 ~ 진행 중"
            : `${formattedDate} ~ 진행 중`;

    setEditQA(
      projectMeta.qa ||
        (selectedProjectId === "proj-1"
          ? "이다은"
          : selectedProjectId === "proj-2"
            ? "이다연"
            : selectedProjectId === "proj-3"
              ? "이다은"
              : ""),
    );
    setEditDeveloper(
      projectMeta.developer ||
        (selectedProjectId === "proj-1"
          ? "김철수"
          : selectedProjectId === "proj-2"
            ? "박지현"
            : selectedProjectId === "proj-3"
              ? "이준호"
              : ""),
    );
    setEditDesigner(
      projectMeta.designer ||
        (selectedProjectId === "proj-1"
          ? "박민준"
          : selectedProjectId === "proj-2"
            ? "이수진"
            : selectedProjectId === "proj-3"
              ? "김민지"
              : ""),
    );
    setEditPeriod(projectMeta.period || fallbackPeriod);
    setEditDescription(
      projectMeta.description || currentProject?.description || "",
    );
    setEditStatus(projectMeta.status || "진행 중");
    setSaveMetaError("");
    setIsEditModalOpen(true);
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    setSaveMetaError("");
    try {
      await updateProjectMetadata(selectedProjectId, {
        qa: editQA,
        developer: editDeveloper,
        designer: editDesigner,
        period: editPeriod,
        description: editDescription,
        status: editStatus,
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setSaveMetaError(err.message || "정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const filteredCases =
    selectedProjectId === "all"
      ? testCases
      : testCases.filter((tc) => tc.project_id === selectedProjectId);

  const availableVersions = versionsByProject[selectedProjectId] || [];

  useEffect(() => {
    const projectMeta = parseProjectDescription(
      currentProject?.description || null,
    );
    const projectVersions =
      projectMeta.versions && projectMeta.versions.length > 0
        ? projectMeta.versions
        : versionsByProject[selectedProjectId] || [];
    setVersionOptions(projectVersions);
  }, [selectedProjectId, currentProject?.description]);

  useEffect(() => {
    if (versionOptions.length) {
      setSelectedVersion((prev) => prev || versionOptions[0]);
    }
  }, [selectedProjectId, versionOptions]);

  const handleProjectSelect = (id: string | null) => {
    setIsProjectOpen(false);
    if (id) {
      router.push(`/?project=${id}`);
    }
  };

  const handleAddVersion = async () => {
    if (!newVersionValue.trim()) return;
    const nextVal = newVersionValue.trim();
    const nextVersions = [nextVal, ...versionOptions];
    setVersionOptions(nextVersions);
    setSelectedVersion(nextVal);
    setNewVersionValue("");
    setIsAddingVersion(false);
    setIsVersionOpen(false);

    try {
      await updateProjectMetadata(selectedProjectId, {
        versions: nextVersions,
      });
    } catch (e) {
      console.error("Failed to save version to DB:", e);
    }
  };

  // Calculate stats dynamically from filteredCases
  const total = filteredCases.length;
  const passCount = filteredCases.filter((tc) => tc.status === "PASS").length;
  const failCount = filteredCases.filter((tc) => tc.status === "FAIL").length;
  const untested = filteredCases.filter(
    (tc) => tc.status === "UNTESTED",
  ).length;

  const executed = passCount + failCount;
  const openIssues = Math.round(failCount * 0.32) || 0; // ~32% of failCount is open issues

  const executedPercent =
    total > 0 ? parseFloat(((executed / total) * 100).toFixed(1)) : 0;
  const untestedPercent =
    total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0;
  const passPercent =
    executed > 0 ? parseFloat(((passCount / executed) * 100).toFixed(1)) : 0;
  const failPercent =
    executed > 0 ? parseFloat(((failCount / executed) * 100).toFixed(1)) : 0;

  // Custom SVG Donut calculation
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const donutLabel = "TOTAL";
  const donutCenterVal = total;
  const donutData = [
    {
      label: "PASS",
      count: passCount,
      percent:
        total > 0 ? parseFloat(((passCount / total) * 100).toFixed(1)) : 0,
      color: "#00BA54",
    },
    {
      label: "FAIL",
      count: failCount,
      percent:
        total > 0 ? parseFloat(((failCount / total) * 100).toFixed(1)) : 0,
      color: "#DE3A3A",
    },
    {
      label: "미실시",
      count: untested,
      percent:
        total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0,
      color: "#8C5FFF",
    },
  ];

  const donutSegments = donutData.reduce(
    (acc, seg) => {
      const prevTotal = acc.reduce((sum, item) => sum + item.strokeDash, 0);
      const strokeDash = Math.round((seg.percent / 100) * circ);
      return [...acc, { ...seg, strokeDash, offset: -prevTotal }];
    },
    [] as Array<
      (typeof donutData)[number] & { strokeDash: number; offset: number }
    >,
  );

  const barData =
    categoryGroups.length > 0
      ? categoryGroups.map((group) => {
          const groupCases = filteredCases.filter(
            (tc) => tc.group_id === group.id,
          );
          const totalInGroup = groupCases.length;

          let topPercent = 0;
          let val1 = 0;
          let val2 = 0;

          const passInGroup = groupCases.filter(
            (tc) => tc.status === "PASS",
          ).length;
          const failInGroup = groupCases.filter(
            (tc) => tc.status === "FAIL",
          ).length;
          val1 =
            totalInGroup > 0
              ? Math.round((passInGroup / totalInGroup) * 100)
              : 0;
          val2 =
            totalInGroup > 0
              ? Math.round((failInGroup / totalInGroup) * 100)
              : 0;
          topPercent = val1;

          let label = group.title;
          if (label.includes(".")) {
            const parts = label.split(".");
            if (
              parts[0].match(/^\d+(-\d+)*(-[a-zA-Z])?$/) ||
              parts[0].trim().length <= 6
            ) {
              label = parts.slice(1).join(".").trim();
            }
          }
          if (label.length > 7) {
            label = label.substring(0, 6) + "..";
          }

          return {
            label,
            topPercent,
            val1,
            val2,
          };
        })
      : [
          { label: "연결/BLE", topPercent: 85, val1: 85, val2: 15 },
          { label: "알람", topPercent: 72, val1: 72, val2: 28 },
          { label: "조명 제어", topPercent: 68, val1: 68, val2: 32 },
          { label: "권한", topPercent: 75, val1: 75, val2: 25 },
          { label: "설정", topPercent: 81, val1: 81, val2: 19 },
          { label: "기타", topPercent: 67, val1: 67, val2: 33 },
        ];

  const osCounts = filteredCases.reduce(
    (acc, tc) => {
      const osText = (tc.os || "").toLowerCase();
      if (osText.includes("ios")) acc.iOS += 1;
      else if (osText.includes("android")) acc.Android += 1;
      else if (osText.includes("web") || osText.includes("웹")) acc.Web += 1;
      else acc.Other += 1;
      return acc;
    },
    { iOS: 0, Android: 0, Web: 0, Other: 0 },
  );

  const osTotal =
    osCounts.iOS + osCounts.Android + osCounts.Web + osCounts.Other;
  const osGroups =
    osTotal > 0
      ? [
          { label: "iOS", count: osCounts.iOS, color: "#4f8bff" },
          { label: "Android", count: osCounts.Android, color: "#26c26a" },
          { label: "Web", count: osCounts.Web, color: "#6c7cff" },
          ...(osCounts.Other
            ? [{ label: "Other", count: osCounts.Other, color: "#8f8f9e" }]
            : []),
        ]
      : [
          { label: "iOS", count: 258, color: "#4f8bff" },
          { label: "Android", count: 242, color: "#26c26a" },
          { label: "Web", count: 12, color: "#6c7cff" },
        ];

  const issueTotal = Math.max(failCount, 1);
  const issueOpen = Math.round(issueTotal * 0.55);
  const issueInProgress = Math.round(issueTotal * 0.25);
  const issueClosed = issueTotal - issueOpen - issueInProgress;
  const issueGroups = [
    { label: "Open", count: issueOpen, color: "#DE3A3A" },
    { label: "In Progress", count: issueInProgress, color: "#F5A623" },
    {
      label: "Closed",
      count: issueClosed > 0 ? issueClosed : 0,
      color: "#00BA54",
    },
  ];

  const issueTotalCount = issueGroups.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const meta = parseProjectDescription(currentProject?.description || null);
  const formattedDate = currentProject?.created_at
    ? new Date(currentProject.created_at).toLocaleDateString("ko-KR")
    : new Date().toLocaleDateString("ko-KR");
  const qaName =
    meta.qa ||
    currentProject?.qa ||
    (selectedProjectId === "proj-1"
      ? "이다은"
      : selectedProjectId === "proj-2"
        ? "이다연"
        : selectedProjectId === "proj-3"
          ? "이다은"
          : "담당자 미지정");
  const devName =
    meta.developer ||
    currentProject?.developer ||
    (selectedProjectId === "proj-1"
      ? "김철수"
      : selectedProjectId === "proj-2"
        ? "박지현"
        : selectedProjectId === "proj-3"
          ? "이준호"
          : "담당자 미지정");
  const designerName =
    meta.designer ||
    currentProject?.designer ||
    (selectedProjectId === "proj-1"
      ? "박민준"
      : selectedProjectId === "proj-2"
        ? "이수진"
        : selectedProjectId === "proj-3"
          ? "김민지"
          : "담당자 미지정");
  const periodText =
    meta.period ||
    currentProject?.period ||
    (selectedProjectId === "proj-1"
      ? "2026.05.01 ~ 진행 중"
      : selectedProjectId === "proj-2"
        ? "2026.04.15 ~ 진행 중"
        : selectedProjectId === "proj-3"
          ? "2026.03.10 ~ 진행 중"
          : `${formattedDate} ~ 진행 중`);

  return {
    isProjectOpen,
    setIsProjectOpen,
    isVersionOpen,
    setIsVersionOpen,
    selectedVersion,
    setSelectedVersion,
    versionOptions,
    isAddingVersion,
    setIsAddingVersion,
    newVersionValue,
    setNewVersionValue,
    activeTab,
    setActiveTab,

    // Delete project modal states
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    deleteErrorMsg,
    setDeleteErrorMsg,
    handleDeleteProject,

    // Edit project info states
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
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    isSavingMeta,
    saveMetaError,
    setSaveMetaError,
    handleOpenEditModal,
    handleSaveMetadata,

    // Project values
    currentProject,
    meta,
    qaName,
    devName,
    designerName,
    periodText,

    // Project selection
    handleProjectSelect,
    handleAddVersion,

    // Calculations
    total,
    executed,
    untested,
    openIssues,
    executedPercent,
    untestedPercent,
    passPercent,
    failPercent,
    donutSegments,
    donutData,
    donutCenterVal,
    donutLabel,
    barData,
    osGroups,
    issueGroups,
    issueTotalCount,
    radius,
    circ,
  };
}
