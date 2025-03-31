import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn 
} from 'typeorm';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
