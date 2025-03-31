import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn 
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity('photos')
  export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userId: string;
  
    @ManyToOne(() => User, user => user.photos)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column()
    url: string;
  
    @Column({ nullable: true })
    thumbnailUrl: string;
  
    @Column({ default: false })
    isMain: boolean;
  
    @Column({ default: false })
    isModerated: boolean;
  
    @Column({ default: false })
    isApproved: boolean;
  
    @Column({ nullable: true })
    rejectionReason: string;
  
    @Column({ nullable: true })
    originalFilename: string;
  
    @Column({ nullable: true })
    fileSize: number;
  
    @Column({ nullable: true })
    contentType: string;
  
    @Column({ nullable: true, type: 'jsonb' })
    metadata: any;
  
    @CreateDateColumn()
    createdAt: Date;
  }