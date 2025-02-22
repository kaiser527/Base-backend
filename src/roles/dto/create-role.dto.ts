import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
