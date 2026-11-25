import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshToken, Role, User, VerificationToken } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/User-Response.Dto';

import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/changePassword-dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Public User Methods
  // ============================================================

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.USER,
      },
    });

    return this.findById(user.id);
  }

  /**
   * Find user by email.
   *
   * Used internally by AuthService.
   * Returns the complete User because authentication
   * needs password, role, verification status, etc.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.client.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID and return only public information.
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Get all users.
   */
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.prisma.client.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update user's profile.
   *
   * Important:
   * UpdateUserDto should only contain fields that the user
   * is allowed to modify, such as firstName and lastName.
   */
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userExists = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== userExists.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.client.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.password) {
      throw new BadRequestException('This account does not have a password');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.prisma.client.user.delete({
      where: { id: userId },
    });

    return {
      message: `User with ID ${userId} has been deleted successfully`,
    };
  }

  // ============================================================
  // Email Verification Token Methods
  // ============================================================

  /**
   * Delete old verification tokens and create a new one.
   */
  async createVerificationToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<VerificationToken> {
    await this.prisma.client.verificationToken.deleteMany({
      where: { userId },
    });

    return this.prisma.client.verificationToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  /**
   * Get the latest verification token for a user.
   */
  async getLatestVerificationToken(
    userId: string,
  ): Promise<VerificationToken | null> {
    return this.prisma.client.verificationToken.findFirst({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Mark user's email as verified and delete
   * the used verification token in one transaction.
   */
  async verifyUserEmail(userId: string, tokenId: string): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
        },
      });

      await tx.verificationToken.delete({
        where: {
          id: tokenId,
        },
      });
    });
  }

  /**
   * Delete a verification token.
   *
   * Used when the OTP expires.
   */
  async deleteVerificationToken(tokenId: string): Promise<void> {
    await this.prisma.client.verificationToken.deleteMany({
      where: {
        id: tokenId,
      },
    });
  }

  // ============================================================
  // Refresh Token Methods
  // ============================================================

  /**
   * Save a hashed refresh token.
   *
   * Also removes expired refresh tokens belonging
   * to the same user.
   */
  async saveRefreshToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    await this.prisma.client.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return this.prisma.client.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  /**
   * Find refresh token by its ID.
   */
  async findRefreshTokenById(tokenId: string): Promise<RefreshToken | null> {
    return this.prisma.client.refreshToken.findUnique({
      where: {
        id: tokenId,
      },
    });
  }

  /**
   * Delete a refresh token.
   *
   * deleteMany is intentionally used here so deleting an already
   * deleted/non-existent token doesn't throw an exception.
   */
  async deleteRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.client.refreshToken.deleteMany({
      where: {
        id: tokenId,
      },
    });
  }
}
