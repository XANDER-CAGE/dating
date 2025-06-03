import { Module, Global } from '@nestjs/common';
import { GeolocationService } from './services/geolocation.service';

@Global()
@Module({
  providers: [GeolocationService],
  exports: [GeolocationService],
})
export class CommonModule {}