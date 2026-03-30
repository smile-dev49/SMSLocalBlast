import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiTokensService } from './api-tokens.service';

@ApiTags('API Tokens')
@Controller({ path: 'api-tokens', version: '1' })
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}
}
