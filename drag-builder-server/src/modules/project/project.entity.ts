import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 项目实体
 * 使用 JSONB 存储 DSL 数据以支持灵活的查询和存储
 *
 * 需求：12.1 - 数据库 Schema 设计
 */
@Entity('projects')
@Index('idx_projects_name', ['name'])
@Index('idx_projects_created_at', ['createdAt'])
export class ProjectEntity {
  /**
   * 项目唯一标识符（UUID v4）
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 项目名称
   * 最大长度 255 字符
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  /**
   * 画布配置
   * 存储画布的宽度、高度、预设类型和背景色
   * 使用 JSONB 类型以支持高效查询
   */
  @Column({ type: 'jsonb', nullable: false })
  canvasConfig!: {
    width: number;
    height: number;
    preset: 'mobile' | 'tablet' | 'desktop' | 'custom';
    backgroundColor: string;
  };

  /**
   * 组件树（DSL）
   * 存储所有组件节点的完整数据结构
   * 使用 JSONB 类型以支持灵活的嵌套结构
   */
  @Column({ type: 'jsonb', nullable: false })
  componentsTree!: unknown[];

  /**
   * 创建时间
   * 自动生成，不可修改
   */
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  /**
   * 更新时间
   * 每次更新时自动更新
   */
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
