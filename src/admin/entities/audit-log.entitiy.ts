import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    ManyToOne,
    JoinColumn
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  export enum AuditLogAction {
    USER_CREATED = 'user_created',
    USER_UPDATED = 'user_updated',
    USER_DELETED = 'user_deleted',
    USER_BANNED = 'user_banned',
    USER_UNBANNED = 'user_unbanned',
    ROLE_UPDATED = 'role_updated',
    PHOTO_MODERATED = 'photo_moderated',
    PHOTO_DELETED = 'photo_deleted',
    SYSTEM_ACTION = 'system_action',
  }
  
  @Entity('audit_logs')
  export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      type: 'enum',
      enum: AuditLogAction,
    })
    action: AuditLogAction;
  
    @Column({ nullable: true })
    userId: string;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ nullable: true })
    adminId: string;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'admin_id' })
    admin: User;
  
    @Column({ type: 'jsonb', nullable: true })
    details: any;
  
    @Column({ type: 'jsonb', nullable: true })
    before: any;
  
    @Column({ type: 'jsonb', nullable: true })
    after: any;
  
    @Column({ nullable: true })
    ipAddress: string;
  
    @Column({ nullable: true })
    userAgent: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }