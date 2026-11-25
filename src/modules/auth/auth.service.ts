import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { randomBytes, randomInt } from 'node:crypto';

import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

import { UsersService } from '../users/user.service';
import { MailService } from '../mail/mail.service';

import { AuthenticatedUser } from 'src/common/types/authenticated-user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const newUser = await this.usersService.create({
      email,
      password,
      firstName,
      lastName,
    });

    const verificationCode = await this.createEmailVerificationToken(
      newUser.id,
    );

    await this.mailService.sendVerificationMail(
      newUser.email,
      `${newUser.firstName} ${newUser.lastName}`,
      verificationCode,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
    
  }

  // ============================================================
  // Verify Email
  // ============================================================

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken =
      await this.usersService.getLatestVerificationToken(user.id);

    if (!verificationToken) {
      throw new BadRequestException('No verification code found');
    }

    if (verificationToken.expiresAt <= new Date()) {
      await this.usersService.deleteVerificationToken(verificationToken.id);

      throw new UnauthorizedException('Verification code has expired');
    }

    const isOtpValid = await bcrypt.compare(otp, verificationToken.token);

    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.usersService.verifyUserEmail(user.id, verificationToken.id);

    return {
      message: 'Account verified successfully. You can now login.',
    };
  }

  // ============================================================
  // Login
  // ============================================================

  async login(user: AuthenticatedUser) {
    const accessToken = await this.generateAccessToken(user.id, user.email);

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: `${refreshToken.tokenId}.${refreshToken.rawToken}`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ============================================================
  // Validate User
  // ============================================================

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return null;
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  // ============================================================
  // Refresh Token
  // ============================================================

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const [tokenId, rawToken] = refreshToken.split('.');

    if (!tokenId || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const existingToken = await this.usersService.findRefreshTokenById(tokenId);

    if (!existingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existingToken.expiresAt <= new Date()) {
      await this.usersService.deleteRefreshToken(existingToken.id);

      throw new UnauthorizedException('Refresh token expired');
    }

    const isTokenValid = await bcrypt.compare(rawToken, existingToken.token);

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let user;

    try {
      user = await this.usersService.findById(existingToken.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('User not found');
      }

      throw error;
    }

    // ==========================================================
    // Refresh Token Rotation
    // ==========================================================

    await this.usersService.deleteRefreshToken(existingToken.id);

    const accessToken = await this.generateAccessToken(user.id, user.email);

    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      message: 'Token refreshed successfully',

      accessToken,

      refreshToken: `${newRefreshToken.tokenId}.${newRefreshToken.rawToken}`,

      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  // ============================================================
  // Logout
  // ============================================================

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required for logout');
    }

    const [tokenId] = refreshToken.split('.');

    if (!tokenId) {
      throw new BadRequestException('Invalid token format');
    }

    await this.usersService.deleteRefreshToken(tokenId);

    return {
      message: 'Logged out successfully',
    };
  }

  // ============================================================
  // Generate Access Token
  // ============================================================

  private async generateAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    const expiresIn = parseInt(
      this.configService.get<string>('JWT_EXPIRES_IN') || '900',
      10,
    );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn,
    });
  }

  // ============================================================
  // Generate Refresh Token
  // ============================================================

  private async generateRefreshToken(userId: string) {
    const rawToken = randomBytes(40).toString('hex');

    const hashedToken = await bcrypt.hash(rawToken, this.SALT_ROUNDS);

    const expirationDays = parseInt(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_DAYS') || '7',
      10,
    );

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const savedToken = await this.usersService.saveRefreshToken(
      userId,
      hashedToken,
      expiresAt,
    );

    return {
      tokenId: savedToken.id,
      rawToken,
    };
  }

  // ============================================================
  // Create Email Verification Token
  // ============================================================

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const verificationCode = randomInt(100000, 1000000).toString();

    const tokenExpireMinutes = parseInt(
      this.configService.get<string>('VERIFICATION_TOKEN_EXPIRES_IN_TIME') ||
        '10',
      10,
    );

    const expiresAt = new Date(Date.now() + tokenExpireMinutes * 60 * 1000);

    const hashedToken = await bcrypt.hash(verificationCode, this.SALT_ROUNDS);

    await this.usersService.createVerificationToken(
      userId,
      hashedToken,
      expiresAt,
    );

    return verificationCode;
  }
}
