/**
 * 项目 API 请求封装
 * 提供项目的 CRUD 操作方法
 *
 * 需求：10.2, 10.3, 10.7
 */

import apiClient from './client';
import type { Project } from '@/types/project';
import type { CanvasConfig } from '@/types/canvas';
import type { ComponentNode } from '@/types/component';

/**
 * 创建项目请求体
 */
export interface CreateProjectPayload {
  name: string;
  canvasConfig: CanvasConfig;
  componentsTree: ComponentNode[];
}

/**
 * 更新项目请求体（所有字段可选）
 */
export interface UpdateProjectPayload {
  name?: string;
  canvasConfig?: CanvasConfig;
  componentsTree?: ComponentNode[];
}

/**
 * 项目列表查询参数
 */
export interface GetProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * 项目列表响应
 */
export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 创建新项目（需求 10.2）
 * POST /api/projects
 * @param payload 项目数据（名称、画布配置、组件树）
 * @returns 创建成功的项目（含 id、createdAt、updatedAt）
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const response = await apiClient.post<Project>('/api/projects', payload);
  return response.data;
}

/**
 * 获取项目列表（需求 10.6）
 * GET /api/projects
 * @param params 分页和搜索参数（可选）
 * @returns 项目列表及分页信息
 */
export async function getProjects(params?: GetProjectsParams): Promise<ProjectListResponse> {
  const response = await apiClient.get<ProjectListResponse>('/api/projects', { params });
  return response.data;
}

/**
 * 获取单个项目详情（需求 10.7）
 * GET /api/projects/:id
 * @param id 项目 UUID
 * @returns 项目完整数据（含画布配置和组件树）
 */
export async function getProject(id: string): Promise<Project> {
  const response = await apiClient.get<Project>(`/api/projects/${id}`);
  return response.data;
}

/**
 * 更新项目（需求 10.3）
 * PUT /api/projects/:id
 * @param id 项目 UUID
 * @param payload 需要更新的字段（部分更新）
 * @returns 更新后的项目数据
 */
export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const response = await apiClient.put<Project>(`/api/projects/${id}`, payload);
  return response.data;
}

/**
 * 删除项目
 * DELETE /api/projects/:id
 * @param id 项目 UUID
 */
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`);
}
