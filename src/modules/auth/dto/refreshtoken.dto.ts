import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'clx123abc' })
  tokenId!: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  rawToken!: string;

  @ApiProperty({ example: 'user_guid_here' })
  userId!: string;
}
