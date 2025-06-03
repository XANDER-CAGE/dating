import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwipesService } from './swipes.service';
import { SwipesController } from './swipes.controller';
import { Swipe } from './entities/swipe.entity';
import { Match } from '../matches/entities/match.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Swipe, Match]),
    ProfilesModule,
  ],
  providers: [SwipesService],
  controllers: [SwipesController],
  exports: [SwipesService],
})
export class SwipesModule {}