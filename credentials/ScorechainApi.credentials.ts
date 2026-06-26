import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

import { SCORECHAIN_API_BASE_URL } from '../constants';

export class ScorechainApi implements ICredentialType {
  name = 'scorechainApi';
  displayName = 'Scorechain API';
  documentationUrl = 'https://app.scorechain.com/profile/api-keys';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-KEY': '={{$credentials.apiKey}}',
      },
    },
  };

  // Powers the "Test" button when creating the credential. GET /blockchains is
  // a cheap, parameterless authenticated call: it returns 200 with a valid key
  // and 401 with an invalid one, so it validates the key without consuming any
  // scoring quota.
  test: ICredentialTestRequest = {
    request: {
      baseURL: SCORECHAIN_API_BASE_URL,
      url: '/blockchains',
      method: 'GET',
    },
  };
}
