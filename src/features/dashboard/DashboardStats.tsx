"use client";

import React from "react";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { DashboardHeader } from "./components/DashboardHeader";
import { MetricCards } from "./components/MetricCards";
import { DashboardCharts } from "./components/DashboardCharts";
import { ProjectEditModal } from "./components/ProjectEditModal";
import { ProjectDeleteModal } from "./components/ProjectDeleteModal";

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
  const stats = useDashboardStats({
    projects,
    testCases,
    selectedProjectId,
    categoryGroups,
  });

  return (
    <div className="space-y-4">
      {/* 1. Mellight App Header & Meta */}
      <DashboardHeader
        projects={projects}
        selectedProjectId={selectedProjectId}
        meta={stats.meta}
        periodText={stats.periodText}
        qaName={stats.qaName}
        devName={stats.devName}
        designerName={stats.designerName}
        handleOpenEditModal={stats.handleOpenEditModal}
        isVersionOpen={stats.isVersionOpen}
        setIsVersionOpen={stats.setIsVersionOpen}
        isAddingVersion={stats.isAddingVersion}
        setIsAddingVersion={stats.setIsAddingVersion}
        selectedVersion={stats.selectedVersion}
        setSelectedVersion={stats.setSelectedVersion}
        versionOptions={stats.versionOptions}
        newVersionValue={stats.newVersionValue}
        setNewVersionValue={stats.setNewVersionValue}
        handleAddVersion={stats.handleAddVersion}
      />

      {/* 2. Summary Metrics Cards */}
      <MetricCards
        total={stats.total}
        executed={stats.executed}
        executedPercent={stats.executedPercent}
        untested={stats.untested}
        untestedPercent={stats.untestedPercent}
        openIssues={stats.openIssues}
      />

      {/* 3. Main Chart Card */}
      <DashboardCharts
        activeTab={stats.activeTab}
        setActiveTab={stats.setActiveTab}
        radius={stats.radius}
        circ={stats.circ}
        donutSegments={stats.donutSegments}
        donutCenterVal={stats.donutCenterVal}
        donutLabel={stats.donutLabel}
        donutData={stats.donutData}
        barData={stats.barData}
        osGroups={stats.osGroups}
        issueGroups={stats.issueGroups}
        issueTotalCount={stats.issueTotalCount}
      />

      {/* Project Edit Info Modal */}
      <ProjectEditModal
        isEditModalOpen={stats.isEditModalOpen}
        setIsEditModalOpen={stats.setIsEditModalOpen}
        editQA={stats.editQA}
        setEditQA={stats.setEditQA}
        editDeveloper={stats.editDeveloper}
        setEditDeveloper={stats.setEditDeveloper}
        editDesigner={stats.editDesigner}
        setEditDesigner={stats.setEditDesigner}
        editPeriod={stats.editPeriod}
        setEditPeriod={stats.setEditPeriod}
        editStatus={stats.editStatus}
        setEditStatus={stats.setEditStatus}
        editDescription={stats.editDescription}
        setEditDescription={stats.setEditDescription}
        isSavingMeta={stats.isSavingMeta}
        saveMetaError={stats.saveMetaError}
        handleSaveMetadata={stats.handleSaveMetadata}
      />

      {/* Project Delete Modal */}
      <ProjectDeleteModal
        isDeleteModalOpen={stats.isDeleteModalOpen}
        setIsDeleteModalOpen={stats.setIsDeleteModalOpen}
        currentProject={stats.currentProject}
        isDeleting={stats.isDeleting}
        deleteErrorMsg={stats.deleteErrorMsg}
        setDeleteErrorMsg={stats.setDeleteErrorMsg}
        handleDeleteProject={stats.handleDeleteProject}
      />
    </div>
  );
}
