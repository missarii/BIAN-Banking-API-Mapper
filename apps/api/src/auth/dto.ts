import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'architect@bank.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'architect123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
