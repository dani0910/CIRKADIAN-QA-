"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { deleteProject, updateProjectMetadata } from "@/app/actions";
import { parseProjectDescription } from "@/utils/project";
import { Button } from "@/components/ui/Button";

const versionsByProject: Record<string, string[]> = {
  "proj-1": ["v1.2.4 (412)", "v1.2.3 (411)", "v1.2.2 (410)", "v1.2.1 (409)"],
  "proj-2": ["v2.1.0 (501)", "v2.0.9 (500)", "v2.0.8 (499)"],
  "proj-3": ["v1.0.5 (302)", "v1.0.4 (301)", "v1.0.3 (300)"],
};

interface DashboardStatsProps {
  projects: Project[];
  testCases: TestCase[];
  selectedProjectId: string;
  categoryGroups: CategoryGroup[];
}

export default function DashboardStats({
  projects,
  testCases,
  selectedProjectId,
  categoryGroups,
}: DashboardStatsProps) {
  // Filter test cases based on selection
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

  return (
    <div className="space-y-4">
      {/* 1. Mellight App Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-border-color pb-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProjectOpen(!isProjectOpen)}
                className="inline-flex items-center gap-2 text-2xl md:text-3xl font-black text-white tracking-tight"
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
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProjectOpen(false)}
                  />
                  <div className="absolute left-0 mt-3 w-60 rounded-2xl bg-[#090A0D] border border-[#222631] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      프로젝트 전환
                    </div>
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => handleProjectSelect(proj.id)}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer hover:bg-zinc-800 ${
                          selectedProjectId === proj.id
                            ? "text-[#00BA54] bg-[#00BA54]/5"
                            : "text-zinc-300"
                        }`}
                      >
                        <span>{proj.name}</span>
                        {selectedProjectId === proj.id && (
                          <span className="text-[#00BA54] text-[10px]">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              meta.status === '완료' 
                ? 'bg-[#00BA54]/10 text-accent-green border-[#00BA54]/20'
                : meta.status === '시작 전'
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {meta.status || '진행 중'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-medium">
            <div>
              <span className="text-zinc-600 mr-2">프로젝트 기간:</span>
              <span className="font-semibold text-zinc-300">{periodText}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 QA:</span>
              <span className="font-semibold text-zinc-300">{qaName}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 개발자:</span>
              <span className="font-semibold text-zinc-300">{devName}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 디자인:</span>
              <span className="font-semibold text-zinc-300">
                {designerName}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <button
              onClick={handleOpenEditModal}
              className="text-[11px] font-bold text-[#62ABAB] hover:text-[#4d9999] transition cursor-pointer flex items-center gap-1 bg-[#151821] border border-[#222631] rounded-lg px-2 py-1"
            >
              <svg
                className="w-3 h-3"
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

        <div className="flex items-center gap-3 self-start">
          {/* Delete Project Button - Commented out temporarily as requested */}
          {/*
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center justify-center p-2 rounded-lg border border-[#222631] bg-[#151821] hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-zinc-400 transition cursor-pointer"
            title="프로젝트 삭제"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsVersionOpen((prev) => !prev);
                setIsAddingVersion(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#222631] bg-[#151821] px-3 py-2 text-xs font-semibold text-[#62ABAB] hover:bg-zinc-800 transition"
            >
              <span className="font-semibold text-[#62ABAB]">
                {selectedVersion || "+ 버전 입력"}
              </span>
              <span className="text-[#62ABAB] text-[10px]">▼</span>
            </button>
            {isVersionOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsVersionOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#090A0D] border border-[#222631] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {versionOptions.map((version) => (
                    <button
                      key={version}
                      type="button"
                      onClick={() => {
                        setSelectedVersion(version);
                        setIsVersionOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer hover:bg-zinc-800 ${
                        selectedVersion === version
                          ? "text-[#62ABAB] bg-[#62ABAB]/10"
                          : "text-zinc-300"
                      }`}
                    >
                      <span>{version}</span>
                      {selectedVersion === version && (
                        <span className="text-[#62ABAB] text-[10px]">●</span>
                      )}
                    </button>
                  ))}

                  {isAddingVersion ? (
                    <div className="px-4 py-3 space-y-2">
                      <input
                        value={newVersionValue}
                        onChange={(e) => setNewVersionValue(e.target.value)}
                        className="w-full rounded-lg border border-[#222631] bg-[#090A0D] px-3 py-2 text-xs text-white outline-none focus:border-[#62ABAB] focus:ring-2 focus:ring-[#62ABAB]/20"
                        placeholder="버전 입력 (예: v1.2.5)"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleAddVersion}
                          className="flex-1 rounded-lg bg-[#62ABAB] px-3 py-2 text-xs font-semibold text-[#020617] hover:bg-[#4d9999] transition"
                        >
                          추가
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingVersion(false)}
                          className="flex-1 rounded-lg border border-[#222631] bg-[#151821] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-t border-[#222631] my-1" />
                      <button
                        type="button"
                        onClick={() => setIsAddingVersion(true)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#62ABAB] hover:bg-zinc-800 transition"
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

      {/* 2. Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="flex items-center justify-between p-2 hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">전체 TC</span>
            <div className="text-xl md:text-2xl font-black text-white mt-0">
              {total}
            </div>
          </div>
          <div className="p-1 rounded-xl bg-blue-500/5 text-blue-400 border border-blue-500/10">
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
        <Card className="flex items-center justify-between p-2 hover:border-[#00BA54]/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">실행 완료</span>
            <div className="flex items-baseline gap-1.5 mt-0">
              <span className="text-xl md:text-2xl font-black text-white">
                {executed}
              </span>
              <span className="text-[10px] text-text-muted font-medium">
                {executedPercent}%
              </span>
            </div>
          </div>
          <div className="p-1 rounded-xl bg-[#00BA54]/5 text-accent-green border border-[#00BA54]/10">
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
        <Card className="flex items-center justify-between p-2 hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">미실시</span>
            <div className="flex items-baseline gap-1.5 mt-0">
              <span className="text-xl md:text-2xl font-black text-white">
                {untested}
              </span>
              <span className="text-[10px] text-text-muted font-medium">
                {untestedPercent}%
              </span>
            </div>
          </div>
          <div className="p-1 rounded-xl bg-zinc-800/20 text-zinc-400 border border-zinc-800/30">
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
        <Card className="flex items-center justify-between p-2 hover:border-accent-red/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">Open 이슈</span>
            <div className="text-xl md:text-2xl font-black text-accent-red mt-0">
              {openIssues}
            </div>
          </div>
          <div className="p-1 rounded-xl bg-red-500/5 text-accent-red border border-red-500/10">
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

      {/* 3. Main Chart Card */}
      <Card className="space-y-3">
        {/* Chart Header & Tab Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h2 className="text-lg font-black text-white">대시보드 요약</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "PASS_FAIL", label: "PASS/FAIL 현황" },
              { id: "OS", label: "OS별 결과" },
              { id: "ISSUE", label: "이슈 상태 현황" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${activeTab === tab.id ? "bg-[#00BA54] text-black" : "border border-zinc-800 bg-[#151821] text-zinc-300 hover:border-zinc-600 hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "PASS_FAIL" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <div className="lg:col-span-4 flex flex-col items-start justify-center gap-3 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#1a1c23"
                    strokeWidth="10"
                  />
                  {donutSegments.map((seg, idx) => (
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
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {donutCenterVal}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {donutLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 rounded-3xl border border-zinc-800 bg-[#090A0D] p-3 text-xs text-zinc-300">
              {donutData.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div>
                      <div className="font-bold text-white">{seg.label}</div>
                      <div className="text-[11px] text-zinc-500">
                        {seg.count}개
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-zinc-400">
                    {seg.percent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "OS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4 py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
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
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {osGroups.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    OS별 결과
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-3">
              {osGroups.map((seg) => {
                const total = osGroups.reduce(
                  (sum, item) => sum + item.count,
                  0,
                );
                const percent = total
                  ? Math.round((seg.count / total) * 100)
                  : 0;
                return (
                  <div
                    key={seg.label}
                    className="rounded-3xl border border-zinc-800 bg-[#090A0D] p-4 text-xs text-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">
                        {seg.label}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">
                      {seg.count}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{percent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "ISSUE" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4 py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
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
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {issueTotalCount}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    이슈 상태
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-3">
              {issueGroups.map((seg) => {
                const percent = issueTotalCount
                  ? Math.round((seg.count / issueTotalCount) * 100)
                  : 0;
                return (
                  <div
                    key={seg.label}
                    className="rounded-3xl border border-zinc-800 bg-[#090A0D] p-4 text-xs text-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">
                        {seg.label}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">
                      {seg.count}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{percent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Project Delete Modal */}
      {isDeleteModalOpen && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#DE3A3A] mb-3">
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
              <h3 className="text-lg font-black text-white">프로젝트 삭제</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              정말{" "}
              <span className="font-bold text-white">
                "{currentProject.name}"
              </span>{" "}
              프로젝트를 삭제하시겠습니까?
            </p>

            <div className="bg-red-500/5 border border-red-500/10 text-zinc-400 p-3.5 rounded-xl text-xs space-y-1.5 mb-5 font-medium leading-normal">
              <p className="text-[#DE3A3A] font-bold">⚠️ 주의사항:</p>
              <p>
                이 프로젝트를 삭제하면 관련 기능 분류(Category), 테스트케이스,
                그리고 상세 테스트 결과와 모든 히스토리 코멘트가 영구적으로
                삭제되며 복구할 수 없습니다.
              </p>
            </div>

            {deleteErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {deleteErrorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
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
                className="font-bold bg-[#DE3A3A] hover:bg-[#b82d2d] border-none text-white shadow-lg shadow-red-500/15"
              >
                {isDeleting ? "삭제 중..." : "프로젝트 삭제"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Project Edit Info Modal */}
      {isEditModalOpen && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white mb-2">
              프로젝트 정보 수정
            </h3>
            <p className="text-xs text-text-muted mb-5">
              프로젝트 담당자 및 기간 등의 정보를 수정합니다.
            </p>

            {saveMetaError && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {saveMetaError}
              </div>
            )}

            <form
              onSubmit={handleSaveMetadata}
              className="space-y-4 max-h-[30rem] overflow-y-auto"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  담당 QA
                </label>
                <input
                  type="text"
                  placeholder="예: 이다은"
                  value={editQA}
                  onChange={(e) => setEditQA(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-[#62ABAB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  담당 개발자
                </label>
                <input
                  type="text"
                  placeholder="예: 김철수"
                  value={editDeveloper}
                  onChange={(e) => setEditDeveloper(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-[#62ABAB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  담당 디자인
                </label>
                <input
                  type="text"
                  placeholder="예: 박민준"
                  value={editDesigner}
                  onChange={(e) => setEditDesigner(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-[#62ABAB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  프로젝트 기간
                </label>
                <input
                  type="text"
                  placeholder="예: 2026.05.01 ~ 진행 중"
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-[#62ABAB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  프로젝트 상태
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-[#62ABAB]"
                >
                  <option value="시작 전">시작 전</option>
                  <option value="진행 중">진행 중</option>
                  <option value="완료">완료</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  프로젝트 설명
                </label>
                <textarea
                  rows={2}
                  placeholder="설명 입력"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#090A0D] border border-[#222631] rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-[#62ABAB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  className="font-bold bg-[#00BA54] hover:bg-[#009141] text-black border-none shadow-lg shadow-accent-green/20"
                >
                  {isSavingMeta ? "저장 중..." : "정보 저장"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
