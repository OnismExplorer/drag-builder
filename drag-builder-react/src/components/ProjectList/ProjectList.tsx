/**
 * ProjectList 组件
 * 显示用户的项目列表，支持加载和创建项目
 *
 * 需求：10.6, 10.7, 10.8
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Clock, FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { getProjects, getProject } from '../../api/projectApi';
import type { Project } from '../../types/project';
import { useCanvasStore } from '../../store/canvasStore';
import { useComponentStore } from '../../store/componentStore';
import { useUIStore } from '../../store/uiStore';

/**
 * 格式化时间为相对时间字符串
 * @param isoString ISO 8601 时间字符串
 * @returns 相对时间描述（如"3 天前"）
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * 项目卡片组件
 */
interface ProjectCardProps {
  project: Project;
  onLoad: (project: Project) => void;
  isLoading: boolean;
}

function ProjectCard({ project, onLoad, isLoading }: ProjectCardProps) {
  return (
    <button
      onClick={() => onLoad(project)}
      disabled={isLoading}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl overflow-hidden
                 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50
                 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      {/* 预览缩略图区域 */}
      <div className="relative h-36 bg-slate-50 border-b border-slate-100 overflow-hidden">
        {/* 画布尺寸预览背景 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-white border border-slate-200 shadow-sm rounded"
            style={{
              width: Math.min(project.canvasConfig.width / 8, 120),
              height: Math.min(project.canvasConfig.height / 8, 80),
            }}
          >
            {/* 组件数量指示 */}
            {project.componentsTree.length > 0 && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="grid grid-cols-3 gap-0.5 p-1 opacity-40">
                  {Array.from({ length: Math.min(project.componentsTree.length, 9) }).map(
                    (_, i) => (
                      <div key={i} className="w-2 h-2 bg-orange-400 rounded-sm" />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 transition-colors duration-200 flex items-center justify-center">
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-md"
          >
            打开项目
          </span>
        </div>

        {/* 组件数量徽章 */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm
                        border border-slate-200 rounded-full text-xs text-slate-500 font-medium"
        >
          {project.componentsTree.length} 个组件
        </div>
      </div>

      {/* 项目信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 tracking-tight truncate group-hover:text-orange-600 transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{formatRelativeTime(project.updatedAt)}</span>
          <span className="mx-1 text-slate-200">·</span>
          <span>
            {project.canvasConfig.width} × {project.canvasConfig.height}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * ProjectList 主组件
 * 显示项目列表，支持加载和创建项目
 *
 * 需求：10.6, 10.7, 10.8
 */
export default function ProjectList() {
  const navigate = useNavigate();
  const { setConfig, setPan, setZoom } = useCanvasStore();
  const { importComponents } = useComponentStore();
  const { openCanvasSizeModal, showToast, setLoading, isLoading } = useUIStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await getProjects({ limit: 50 });
      setProjects(response.data);
    } catch {
      setFetchError('无法加载项目列表，请检查网络连接');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * 加载项目到编辑器
   * 需求：10.7, 10.8
   */
  const handleLoadProject = useCallback(
    async (project: Project) => {
      setLoadingProjectId(project.id);
      setLoading(true);
      try {
        // 获取完整项目数据（含最新组件树）
        const fullProject = await getProject(project.id);

        // 恢复画布配置
        setConfig(fullProject.canvasConfig);
        // 重置缩放和平移到默认值
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        // 恢复组件树
        importComponents(fullProject.componentsTree);

        showToast(`已加载项目「${fullProject.name}」`, 'success');
        navigate('/editor');
      } catch {
        showToast('加载项目失败，请重试', 'error');
      } finally {
        setLoadingProjectId(null);
        setLoading(false);
      }
    },
    [setConfig, setZoom, setPan, importComponents, showToast, setLoading, navigate]
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">我的项目</h1>
          {!isFetching && !fetchError && (
            <p className="mt-1 text-sm text-slate-400">共 {projects.length} 个项目</p>
          )}
        </div>
        <button
          onClick={openCanvasSizeModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-bold
                     rounded-xl hover:bg-orange-700 transition-all hover:-translate-y-0.5 active:scale-95
                     shadow-lg shadow-orange-600/25 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          创建新项目
        </button>
      </div>

      {/* 加载状态 */}
      {isFetching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-36 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {!isFetching && fetchError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-slate-600 font-medium mb-1">{fetchError}</p>
          <p className="text-sm text-slate-400 mb-6">后端服务可能未启动</p>
          <button
            onClick={fetchProjects}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600
                       bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      )}

      {/* 空状态 */}
      {!isFetching && !fetchError && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
            <FolderOpen className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无项目</h3>
          <p className="text-sm text-slate-400 mb-8 max-w-xs">
            从左侧拖拽组件开始设计，或点击下方按钮创建你的第一个项目
          </p>
          <button
            onClick={openCanvasSizeModal}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-sm font-bold
                       rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/25"
          >
            <Plus className="w-4 h-4" />
            创建第一个项目
          </button>
        </div>
      )}

      {/* 项目列表 */}
      {!isFetching && !fetchError && projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 新建项目卡片 */}
          <button
            onClick={openCanvasSizeModal}
            className="group h-full min-h-[200px] flex flex-col items-center justify-center gap-3
                       border-2 border-dashed border-slate-200 rounded-2xl
                       hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <div
              className="w-10 h-10 bg-slate-100 group-hover:bg-orange-100 rounded-xl
                            flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-400 group-hover:text-orange-600 transition-colors">
              新建项目
            </span>
          </button>

          {/* 项目卡片列表 */}
          {projects.map(project => (
            <div key={project.id} className="relative">
              {/* 加载遮罩 */}
              {loadingProjectId === project.id && (
                <div
                  className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl
                                flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                    <Layers className="w-4 h-4 animate-spin" />
                    加载中...
                  </div>
                </div>
              )}
              <ProjectCard project={project} onLoad={handleLoadProject} isLoading={isLoading} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
