import { IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  apiPath: string;

  @IsNotEmpty()
  method: string;

  @IsNotEmpty()
  module: string;
}
