
import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiCode } from '@common/api/api-codes';
import { ApiEnvelopeResponse } from '@common/api/api-envelope.decorator';
import { ApiException } from '@common/api/api-exception';
import { ApiSuccessCode } from '@common/api/api-metadata.decorator';
import { ParseUlidPipe } from '@common/api/parse-ulid.pipe';

import { CurrentAuth } from '@feature/auth/decorator/current-auth.decorator';
import type { AuthContext } from '@feature/auth/data/model/auth-context';

import { AccountResponseDto } from './account-response.dto';
import { AccountService } from './account.service';

// Je regroupe les routes du domaine Account dans la documentation Swagger.
@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) {}

  // POST /account : je crée un compte.
  // Cette route sera protégée par les Guards globaux.
  @ApiEnvelopeResponse(AccountResponseDto, {
    status: HttpStatus.CREATED,
    code: ApiCode.AccountCreated,
    description: 'Compte créé',
  })
  @ApiSuccessCode(ApiCode.AccountCreated)
  @Post()
  create(): Promise<AccountResponseDto> {
    return this.accountService.createAccount();
  }

  // GET /account/me : je retrouve mon propre compte.
  @ApiCookieAuth('access-cookie')
  @Header('Cache-Control', 'no-store')
  @ApiEnvelopeResponse(AccountResponseDto, {
    status: HttpStatus.OK,
    code: ApiCode.AccountFound,
    description: 'Informations du compte connecté',
  })
  @ApiSuccessCode(ApiCode.AccountFound)
  @Get('me')
  async me(
    @CurrentAuth() auth: AuthContext,
  ): Promise<AccountResponseDto> {
    // Je récupère mon compte grâce à mon identifiant de connexion.
    const account = await this.accountService.findById(
      auth.accountId,
    );

    if (!account) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ApiCode.AccountNotFound,
      );
    }

    return account;
  }

  // GET /account/:id : je recherche un compte avec son identifiant.
  @ApiEnvelopeResponse(AccountResponseDto, {
    status: HttpStatus.OK,
    code: ApiCode.AccountFound,
    description: 'Compte trouvé',
  })
  @ApiNotFoundResponse({
    description: 'Compte introuvable',
  })
  @ApiSuccessCode(ApiCode.AccountFound)
  @Get(':id')
  async findOne(
    @Param('id', ParseUlidPipe) id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.findById(id);

    // Si le compte n'existe pas, je renvoie une erreur 404.
    if (!account) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ApiCode.AccountNotFound,
      );
    }

    return account;
  }
}
