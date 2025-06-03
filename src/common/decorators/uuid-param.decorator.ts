import { Param, ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = (property: string) => Param(property, ParseUUIDPipe);