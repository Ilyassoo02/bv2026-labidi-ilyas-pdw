import { Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ApiCode } from '@common/api/api-codes';
import { ApiEnvelopeResponse } from '@common/api/api-envelope.decorator';
import { ApiException } from '@common/api/api-exception';
import { ApiSuccessCode } from '@common/api/api-metadata.decorator';
import { ParseUlidPipe } from '@common/api/parse-ulid.pipe';
import { AccountResponseDto } from './account-response.dto';
import { AccountService } from './account.service';

// Je regroupe les routes du domaine Account dans la documentation Swagger.
@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // POST /account : je crée un compte et je décris la réponse telle qu'elle est réellement envoyée.
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

  // GET /account/:id : l'identifiant est validé par ParseUlidPipe avant toute requête vers la base.
  @ApiEnvelopeResponse(AccountResponseDto, {
    status: HttpStatus.OK,
    code: ApiCode.AccountFound,
    description: 'Compte trouvé',
  })
  @ApiNotFoundResponse({ description: 'Compte introuvable' })
  @ApiSuccessCode(ApiCode.AccountFound)
  @Get(':id')
  async findOne(
    @Param('id', ParseUlidPipe) id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.findById(id);

    // Si le compte n'existe pas, je renvoie une erreur 404 au format de l'API.
    if (!account) {
      throw new ApiException(404, ApiCode.AccountNotFound);
    }

    return account;
  }
}
