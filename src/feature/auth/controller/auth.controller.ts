
import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import {
  ApiCookieAuth,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from '../service/auth.service';
import { AuthCookieService } from '../service/auth-cookie.service';
import { RefreshTokenService } from '../service/refresh-token.service';
import { TokenCryptoService } from '../service/token-crypto.service';

import { RegisterRequestDto } from '../data/dto/request/register-request.dto';
import { LoginRequestDto } from '../data/dto/request/login-request.dto';

import { RegistrationResponseDto } from '../data/dto/response/registration-response.dto';
import { LoginResponseDto } from '../data/dto/response/login-response.dto';
import { AuthSessionResponseDto } from '../data/dto/response/auth-session-response.dto';

import { Public } from '../decorator/public.decorator';
import { CurrentAuth } from '../decorator/current-auth.decorator';

import type { AuthContext } from '../data/model/auth-context';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookieService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly tokenCrypto: TokenCryptoService,
  ) {}

  // Je crée un nouveau compte utilisateur.
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @Throttle({
    global: {
      limit: 10,
      ttl: 60000,
    },
  })
  register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegistrationResponseDto> {
    return this.authService.register(dto);
  }

  // Je connecte un utilisateur.
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Throttle({
    global: {
      limit: 10,
      ttl: 60000,
    },
  })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    // Je vérifie les identifiants.
    const session = await this.authService.login(dto);

    // J'enregistre les jetons dans les cookies.
    this.cookies.setAccessCookie(
      response,
      session.accessToken,
    );

    this.cookies.setRefreshCookie(
      response,
      session.refreshToken,
      session.refreshExpiresAt,
    );

    this.cookies.setCsrfCookie(
      response,
      session.csrfToken,
      session.refreshExpiresAt,
    );

    // Je retourne les informations de connexion.
    return {
      accountId: session.accountId,
      email: dto.email,
      authenticated: true,
    };
  }

  // Je renouvelle les jetons de connexion.
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Throttle({
    global: {
      limit: 30,
      ttl: 60000,
    },
  })
  @ApiCookieAuth('refresh-cookie')
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    let rotated;

    try {
      // Je vérifie l'ancien refresh token et je le renouvelle.
      rotated = await this.refreshTokens.rotate(request);
    } catch (error) {
      // Je supprime les cookies si le renouvellement échoue.
      this.cookies.clearAuthCookies(response);

      throw error;
    }

    // Je crée un nouveau jeton d'accès.
    const accessToken = this.tokenCrypto.signAccessToken(
      rotated.accountId,
      rotated.sessionId,
      rotated.accessVersion,
    );

    // Je mets à jour les cookies.
    this.cookies.setAccessCookie(
      response,
      accessToken,
    );

    this.cookies.setRefreshCookie(
      response,
      rotated.refreshToken,
      rotated.refreshExpiresAt,
    );

    return {
      accountId: rotated.accountId,
      authenticated: true,
    };
  }

  // Je déconnecte la session actuelle.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Throttle({
    global: {
      limit: 10,
      ttl: 60000,
    },
  })
  @ApiCookieAuth('access-cookie')
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    await this.authService.logout(auth);

    // Je supprime les cookies de connexion.
    this.cookies.clearAuthCookies(response);

    return {
      accountId: auth.accountId,
      authenticated: false,
    };
  }

  // Je déconnecte toutes les sessions du compte.
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Throttle({
    global: {
      limit: 10,
      ttl: 60000,
    },
  })
  @ApiCookieAuth('access-cookie')
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  async logoutAll(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    await this.authService.logoutAll(auth);

    // Je supprime les cookies de connexion.
    this.cookies.clearAuthCookies(response);

    return {
      accountId: auth.accountId,
      authenticated: false,
    };
  }
}
