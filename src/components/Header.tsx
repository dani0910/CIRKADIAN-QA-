"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Mock versions for each project
const versionsByProject: Record<string, string[]> = {
  'proj-1': ['v1.2.4 (412)', 'v1.2.3 (411)', 'v1.2.2 (410)', 'v1.2.1 (409)'],
  'proj-2': ['v2.1.0 (501)', 'v2.0.9 (500)', 'v2.0.8 (499)'],
  'proj-3': ['v1.0.5 (302)', 'v1.0.4 (301)', 'v1.0.3 (300)']
};

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get("project");
  const [isOpen, setIsOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setProjects(data);
        }
      });
  }, []);

  useEffect(() => {
    // Set default version based on current project
    if (currentProject && versionsByProject[currentProject]) {
      setSelectedVersion(versionsByProject[currentProject][0]);
    }
  }, [currentProject]);

  const selectedProjectName =
    projects.find((p) => p.id === currentProject)?.name || "프로젝트 선택";

  const handleSelect = (id: string | null) => {
    setIsOpen(false);
    if (id) {
      router.push(`/?project=${id}`);
    } else {
      router.push("/");
    }
  };

  const handleGoBack = () => {
    router.push("/");
  };

  const availableVersions = currentProject && versionsByProject[currentProject] 
    ? versionsByProject[currentProject] 
    : [];

  // 메인 페이지 헤더 (프로젝트 선택 전)
  if (!currentProject) {
    return (
      <header className="h-16 border-b border-[#222631] bg-[#090A0D]/80 backdrop-blur flex items-center justify-between px-6 md:px-8 z-50 sticky top-0 select-none">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-black tracking-wider text-white hover:opacity-90 transition"
          >
            CIRKADIAN<span className="text-accent-green">QA</span>
          </Link>

          {/* Project Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-[#151821] hover:bg-zinc-800 border border-[#222631] rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 transition shadow-lg cursor-pointer outline-none"
            >
              <span>📂 {selectedProjectName}</span>
              <span
                className="text-zinc-500 text-[10px] transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ▼
              </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <>
                {/* Overlay to close on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />

                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#090A0D] border border-[#222631] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    프로젝트 전환
                  </div>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleSelect(proj.id)}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer hover:bg-zinc-800 ${
                        currentProject === proj.id
                          ? "text-[#00BA54] bg-[#00BA54]/5"
                          : "text-zinc-300"
                      }`}
                    >
                      <span>{proj.name}</span>
                      {currentProject === proj.id && (
                        <span className="text-[#00BA54] text-[10px]">●</span>
                      )}
                    </button>
                  ))}

                  <div className="border-t border-[#222631] my-1.5" />

                  <button
                    onClick={() => handleSelect(null)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition cursor-pointer hover:bg-zinc-800 ${
                    !currentProject
                      ? "text-blue-400 bg-blue-500/5"
                      : "text-zinc-400"
                  }`}
                  >
                    <span>🏠 프로젝트 목록 전체 보기</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400"></div>
      </header>
    );
  }

  // 상세 페이지 헤더 (프로젝트 선택 후) - 뒤로가기만
  return (
    <header className="h-12 border-b border-[#222631] bg-[#090A0D]/80 backdrop-blur flex items-center px-4 md:px-6 z-50 sticky top-0 select-none">
      <button
        onClick={handleGoBack}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-zinc-800 transition text-zinc-300 hover:text-white cursor-pointer"
        title="뒤로가기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </header>
  );
}
